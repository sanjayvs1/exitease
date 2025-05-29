import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Building, FileText, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface Resignation {
    id: string;
    employeeName: string;
    department: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    submissionDate: string;
}

const Dashboard: React.FC = () => {
    const [resignations, setResignations] = React.useState<Resignation[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchResignations = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/resignations', {
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch resignations');
                }

                const data = await response.json();

                // Transform the API data to match the component interface
                const transformedData = data.map((item: any) => ({
                    id: item._id,
                    employeeName: item.name,
                    department: item.department,
                    reason: item.reason,
                    status: item.status,
                    submissionDate: new Date(item.submittedAt).toLocaleDateString()
                }));

                setResignations(transformedData);
            } catch (error) {
                console.error('Error fetching resignations:', error);
                toast.error('Failed to fetch resignations');
            } finally {
                setLoading(false);
            }
        };

        fetchResignations();
    }, []);

    const updateResignationStatus = async (id: string, status: 'pending' | 'approved' | 'rejected') => {
        try {
            const response = await fetch(`http://localhost:3000/api/resignations/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ status }),
            });

            if (!response.ok) {
                throw new Error('Failed to update resignation status');
            }

            const data = await response.json();

            // Update the local state
            setResignations(prev => prev.map(resignation =>
                resignation.id === id ? { ...resignation, status } : resignation
            ));

            toast.success(`Resignation ${status} successfully`);
            return data;
        } catch (error) {
            console.error('Error updating resignation status:', error);
            toast.error('Failed to update resignation status');
            throw error;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const stats = {
        total: resignations.length,
        pending: resignations.filter(r => r.status === 'pending').length,
        approved: resignations.filter(r => r.status === 'approved').length,
        rejected: resignations.filter(r => r.status === 'rejected').length
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">HR Resignation Dashboard</h1>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <TrendingUp className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{stats.pending}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved</CardTitle>
                        <Users className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{stats.approved}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                        <Building className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{stats.rejected}</div>
                    </CardContent>
                </Card>
            </div>

            <Button
                onClick={() => {
                    const exportData = resignations.map(resignation => ({
                        'Employee Name': resignation.employeeName,
                        'Department': resignation.department,
                        'Status': resignation.status,
                        'Submission Date': resignation.submissionDate,
                        'Reason': resignation.reason
                    }));
                    const ws = XLSX.utils.json_to_sheet(exportData);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Resignations');
                    XLSX.writeFile(wb, `resignations_${new Date().toISOString().split('T')[0]}.xlsx`);
                    toast.success('Excel file exported successfully');
                }}
                className="mb-2"
            >
                Export to Excel
            </Button>

            {/* Resignations Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Resignations</CardTitle>
                    <CardDescription>
                        Manage and track resignation requests from employees
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {resignations.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No resignations found. Click "New Resignation" to submit one.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee Name</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Submission Date</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {resignations.map((resignation) => (
                                    <TableRow key={resignation.id}>
                                        <TableCell className="font-medium">
                                            {resignation.employeeName}
                                        </TableCell>
                                        <TableCell>{resignation.department}</TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(resignation.status)}>
                                                {resignation.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{resignation.submissionDate}</TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        const newWindow = window.open('', '_blank');
                                                        if (newWindow) {
                                                            newWindow.document.write(`
                                                            <html>
                                                                <head>
                                                                    <title>Resignation Reason - ${resignation.employeeName}</title>
                                                                    <style>
                                                                        body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                                                                        h1 { color: #333; }
                                                                        .content { max-width: 800px; margin: 0 auto; }
                                                                    </style>
                                                                </head>
                                                                <body>
                                                                    <div class="content">
                                                                        <h1>Resignation Reason</h1>
                                                                        <p><strong>Employee:</strong> ${resignation.employeeName}</p>
                                                                        <p><strong>Department:</strong> ${resignation.department}</p>
                                                                        <p><strong>Submission Date:</strong> ${resignation.submissionDate}</p>
                                                                        <hr>
                                                                        <h2>Reason for Resignation:</h2>
                                                                        <p>${resignation.reason}</p>
                                                                    </div>
                                                                </body>
                                                            </html>
                                                        `);
                                                            newWindow.document.close();
                                                        }
                                                    }}
                                                >
                                                    View Reason
                                                </Button>
                                                {resignation.status === 'pending' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-green-600 hover:text-green-700"
                                                            onClick={() => updateResignationStatus(resignation.id, 'approved')}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-red-600 hover:text-red-700"
                                                            onClick={() => updateResignationStatus(resignation.id, 'rejected')}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Dashboard;
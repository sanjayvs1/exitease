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
    status: 'pending' | 'approved' | 'withdrawn';
    submissionDate: string;
}

interface Withdrawal {
    _id: string;
    resignationId: {
        _id: string;
        name: string;
        department: string;
        reason: string;
        submittedAt: string;
    };
    username: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
}

// HTML template for resignation reason display
const generateResignationReasonHTML = (resignation: Resignation): string => {
    return `
        <html>
            <head>
                <title>Resignation Reason - ${resignation.employeeName}</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        padding: 20px; 
                        line-height: 1.6; 
                        background-color: #f9f9f9;
                    }
                    h1 { 
                        color: #333; 
                        border-bottom: 2px solid #007bff;
                        padding-bottom: 10px;
                    }
                    h2 {
                        color: #555;
                        margin-top: 30px;
                    }
                    .content { 
                        max-width: 800px; 
                        margin: 0 auto; 
                        background: white;
                        padding: 30px;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .info-row {
                        margin-bottom: 10px;
                    }
                    .info-row strong {
                        color: #333;
                        display: inline-block;
                        width: 150px;
                    }
                    .reason-content {
                        background-color: #f8f9fa;
                        padding: 20px;
                        border-radius: 5px;
                        border-left: 4px solid #007bff;
                        margin-top: 15px;
                        white-space: pre-wrap;
                    }
                    hr {
                        border: none;
                        height: 1px;
                        background-color: #ddd;
                        margin: 25px 0;
                    }
                </style>
            </head>
            <body>
                <div class="content">
                    <h1>Resignation Reason</h1>
                    <div class="info-row">
                        <strong>Employee:</strong> ${resignation.employeeName}
                    </div>
                    <div class="info-row">
                        <strong>Department:</strong> ${resignation.department}
                    </div>
                    <div class="info-row">
                        <strong>Status:</strong> ${resignation.status}
                    </div>
                    <div class="info-row">
                        <strong>Submission Date:</strong> ${resignation.submissionDate}
                    </div>
                    <hr>
                    <h2>Reason for Resignation:</h2>
                    <div class="reason-content">${resignation.reason}</div>
                </div>
            </body>
        </html>
    `;
};

// Function to open resignation reason in new window
const openResignationReason = (resignation: Resignation): void => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
        newWindow.document.write(generateResignationReasonHTML(resignation));
        newWindow.document.close();
    }
};

const Dashboard: React.FC = () => {
    const [resignations, setResignations] = React.useState<Resignation[]>([]);
    const [withdrawals, setWithdrawals] = React.useState<Withdrawal[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch resignations
                const resignationsResponse = await fetch('http://localhost:3000/api/resignations', {
                    credentials: 'include',
                });

                if (!resignationsResponse.ok) {
                    throw new Error('Failed to fetch resignations');
                }

                const resignationsData = await resignationsResponse.json();

                // Transform the API data to match the component interface
                const transformedResignations = resignationsData.map((item: any) => ({
                    id: item._id,
                    employeeName: item.name,
                    department: item.department,
                    reason: item.reason,
                    status: item.status,
                    submissionDate: new Date(item.submittedAt).toLocaleDateString()
                }));

                setResignations(transformedResignations);

                // Fetch withdrawal requests
                const withdrawalsResponse = await fetch('http://localhost:3000/api/withdrawals', {
                    credentials: 'include',
                });

                if (!withdrawalsResponse.ok) {
                    throw new Error('Failed to fetch withdrawal requests');
                }

                const withdrawalsData = await withdrawalsResponse.json();
                setWithdrawals(withdrawalsData);

            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const updateResignationStatus = async (id: string, status: 'pending' | 'approved' | 'withdrawn') => {
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

    const updateWithdrawalStatus = async (id: string, status: 'approved' | 'rejected') => {
        try {
            const response = await fetch(`http://localhost:3000/api/withdrawals/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ status }),
            });

            if (!response.ok) {
                throw new Error('Failed to update withdrawal status');
            }

            const data = await response.json();

            // Update the local state
            setWithdrawals(prev => prev.map(withdrawal =>
                withdrawal._id === id ? { ...withdrawal, status, reviewedAt: new Date().toISOString() } : withdrawal
            ));

            // If withdrawal is approved, also update the resignation status in local state
            if (status === 'approved') {
                const withdrawal = withdrawals.find(w => w._id === id);
                if (withdrawal) {
                    setResignations(prev => prev.map(resignation =>
                        resignation.id === withdrawal.resignationId._id 
                            ? { ...resignation, status: 'withdrawn' } 
                            : resignation
                    ));
                }
            }

            toast.success(`Withdrawal request ${status} successfully`);
            return data;
        } catch (error) {
            console.error('Error updating withdrawal status:', error);
            toast.error('Failed to update withdrawal status');
            throw error;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'withdrawn': return 'bg-gray-100 text-gray-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getWithdrawalStatusColor = (status: string) => {
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
        withdrawn: resignations.filter(r => r.status === 'withdrawn').length
    };

    const withdrawalStats = {
        total: withdrawals.length,
        pending: withdrawals.filter(w => w.status === 'pending').length,
        approved: withdrawals.filter(w => w.status === 'approved').length,
        rejected: withdrawals.filter(w => w.status === 'rejected').length
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
                <div className="text-sm text-gray-500">
                    Debug: Total: {resignations.length}, Withdrawn: {resignations.filter(r => r.status === 'withdrawn').length}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                        <CardTitle className="text-sm font-medium">Withdrawn</CardTitle>
                        <Building className="h-4 w-4 text-gray-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{stats.withdrawn}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-orange-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-orange-50">
                        <CardTitle className="text-sm font-medium">Withdrawal Requests</CardTitle>
                        <FileText className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{withdrawalStats.total}</div>
                        <p className="text-xs text-muted-foreground">Total requests</p>
                    </CardContent>
                </Card>

                <Card className="border-yellow-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-yellow-50">
                        <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                        <TrendingUp className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{withdrawalStats.pending}</div>
                        <p className="text-xs text-muted-foreground">Awaiting decision</p>
                    </CardContent>
                </Card>

                <Card className="border-green-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-green-50">
                        <CardTitle className="text-sm font-medium">Approved</CardTitle>
                        <Users className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{withdrawalStats.approved}</div>
                        <p className="text-xs text-muted-foreground">Withdrawals granted</p>
                    </CardContent>
                </Card>

                <Card className="border-red-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-red-50">
                        <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                        <Building className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{withdrawalStats.rejected}</div>
                        <p className="text-xs text-muted-foreground">Withdrawals denied</p>
                    </CardContent>
                </Card>
            </div>

            <Button
                onClick={() => {
                    const resignationData = resignations.map(resignation => ({
                        'Employee Name': resignation.employeeName,
                        'Department': resignation.department,
                        'Status': resignation.status,
                        'Submission Date': resignation.submissionDate,
                        'Reason': resignation.reason
                    }));

                    const withdrawalData = withdrawals.map(withdrawal => ({
                        'Employee Name': withdrawal.resignationId.name,
                        'Department': withdrawal.resignationId.department,
                        'Username': withdrawal.username,
                        'Withdrawal Reason': withdrawal.reason,
                        'Status': withdrawal.status,
                        'Submitted': new Date(withdrawal.submittedAt).toLocaleDateString(),
                        'Reviewed': withdrawal.reviewedAt ? new Date(withdrawal.reviewedAt).toLocaleDateString() : 'Not reviewed',
                        'Reviewed By': withdrawal.reviewedBy || 'N/A',
                        'Original Resignation Reason': withdrawal.resignationId.reason
                    }));

                    const wb = XLSX.utils.book_new();
                    
                    const resignationWs = XLSX.utils.json_to_sheet(resignationData);
                    XLSX.utils.book_append_sheet(wb, resignationWs, 'Resignations');
                    
                    const withdrawalWs = XLSX.utils.json_to_sheet(withdrawalData);
                    XLSX.utils.book_append_sheet(wb, withdrawalWs, 'Withdrawal Requests');
                    
                    XLSX.writeFile(wb, `hr_dashboard_${new Date().toISOString().split('T')[0]}.xlsx`);
                    toast.success('Excel file exported successfully with both resignations and withdrawal requests');
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
                    {resignations.filter(r => {
                        // Don't show withdrawn resignations
                        if (r.status === 'withdrawn') return false;
                        
                        // Don't show resignations that have withdrawal requests
                        const hasWithdrawalRequest = withdrawals.some(w => w.resignationId._id === r.id);
                        return !hasWithdrawalRequest;
                    }).length === 0 ? (
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
                                {resignations.filter(r => {
                                    // Don't show withdrawn resignations
                                    if (r.status === 'withdrawn') return false;
                                    
                                    // Don't show resignations that have withdrawal requests
                                    const hasWithdrawalRequest = withdrawals.some(w => w.resignationId._id === r.id);
                                    return !hasWithdrawalRequest;
                                }).map((resignation) => (
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
                                                    onClick={() => openResignationReason(resignation)}
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
                                                        {/* <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-gray-600 hover:text-gray-700"
                                                            onClick={() => updateResignationStatus(resignation.id, 'withdrawn')}
                                                        >
                                                            Withdraw
                                                        </Button> */}
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

            {/* Withdrawal Requests Table */}
            <Card className="border-orange-200">
                <CardHeader className="bg-orange-50">
                    <CardTitle className="text-lg">Withdrawal Requests</CardTitle>
                    <CardDescription>
                        Manage withdrawal requests from employees ({withdrawalStats.total} total, {withdrawalStats.pending} pending)
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    {withdrawals.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <div className="text-lg font-medium">No withdrawal requests found.</div>
                            <div className="text-sm mt-2">Employee withdrawal requests will appear here.</div>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Withdrawal Reason</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Submitted</TableHead>
                                    <TableHead>Reviewed</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {withdrawals.map((withdrawal) => (
                                    <TableRow key={withdrawal._id} className="hover:bg-orange-50">
                                        <TableCell className="font-medium">
                                            {withdrawal.resignationId.name}
                                        </TableCell>
                                        <TableCell>{withdrawal.resignationId.department}</TableCell>
                                        <TableCell className="max-w-xs truncate" title={withdrawal.reason}>
                                            {withdrawal.reason}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getWithdrawalStatusColor(withdrawal.status)}>
                                                {withdrawal.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(withdrawal.submittedAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {withdrawal.reviewedAt 
                                                ? new Date(withdrawal.reviewedAt).toLocaleDateString()
                                                : '-'
                                            }
                                            {withdrawal.reviewedBy && (
                                                <div className="text-xs text-gray-500">by {withdrawal.reviewedBy}</div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        const resignation = {
                                                            id: withdrawal.resignationId._id,
                                                            employeeName: withdrawal.resignationId.name,
                                                            department: withdrawal.resignationId.department,
                                                            reason: withdrawal.resignationId.reason,
                                                            status: 'pending' as const,
                                                            submissionDate: new Date(withdrawal.resignationId.submittedAt).toLocaleDateString()
                                                        };
                                                        openResignationReason(resignation);
                                                    }}
                                                >
                                                    View Original
                                                </Button>
                                                {withdrawal.status === 'pending' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-green-600 hover:text-green-700"
                                                            onClick={() => updateWithdrawalStatus(withdrawal._id, 'approved')}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-red-600 hover:text-red-700"
                                                            onClick={() => updateWithdrawalStatus(withdrawal._id, 'rejected')}
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
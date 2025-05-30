import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ResignationFormData {
    name: string;
    department: string;
    lastWorkingDay: string;
    reason: string;
    additionalComments: string;
}

interface Resignation {
    _id: string;
    username: string;
    name: string;
    department: string;
    lastWorkingDay: string;
    reason: string;
    additionalComments: string;
    status: string;
    submittedAt: string;
}

interface Withdrawal {
    _id: string;
    resignationId: string;
    username: string;
    reason: string;
    status: string;
    submittedAt: string;
}

const resignationTemplates = {
    personal: "I would like to inform you that I have decided to resign from my position due to personal reasons. My last working day will be as indicated in this form. I appreciate the opportunities provided to me and will ensure a smooth transition of my responsibilities.",
    career: "I am writing to formally notify you of my resignation from my position. I have accepted a role with another company that will provide me with new challenges and career growth opportunities. I am grateful for the experience gained here and will work diligently during my notice period.",
    relocation: "I am submitting my resignation from my position due to relocation. My family and I will be moving to a different location, making it impossible for me to continue in my current role. I will ensure all my current projects are properly handed over.",
    education: "I am resigning from my position to pursue further education opportunities. This decision will help advance my career in the long term. I am committed to completing all pending work and assisting in the transition process.",
    health: "Due to health reasons, I need to resign from my current position. This decision was not made lightly, but it is necessary for my well-being. I will do my best to ensure a smooth handover of my responsibilities.",
};

const ResigForm: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<ResignationFormData>({
        name: '',
        department: '',
        lastWorkingDay: '',
        reason: '',
        additionalComments: '',
    });
    const handleTemplateSelect = (template: keyof typeof resignationTemplates) => {
        setFormData(prev => ({
            ...prev,
            reason: resignationTemplates[template],
        }));
    };

    const [userResignations, setUserResignations] = useState<Resignation[]>([]);
    const [userWithdrawals, setUserWithdrawals] = useState<Withdrawal[]>([]);
    const [isLoadingResignations, setIsLoadingResignations] = useState(false);
    const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
    const [selectedResignationId, setSelectedResignationId] = useState<string>('');
    const [withdrawalReason, setWithdrawalReason] = useState('');
    const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);

    const fetchUserResignations = async () => {
        if (!user?.username) return;

        setIsLoadingResignations(true);
        try {
            const response = await fetch(`http://localhost:3000/api/resignations/user/${user.username}`, {
                method: 'GET',
                credentials: 'include',
            });

            if (response.ok) {
                const resignations = await response.json();
                setUserResignations(resignations);
            } else {
                console.error('Failed to fetch user resignations');
            }
        } catch (error) {
            console.error('Error fetching user resignations:', error);
        } finally {
            setIsLoadingResignations(false);
        }
    };

    const fetchUserWithdrawals = async () => {
        if (!user?.username) return;

        try {
            const response = await fetch(`http://localhost:3000/api/withdrawals/user/${user.username}`, {
                method: 'GET',
                credentials: 'include',
            });

            if (response.ok) {
                const withdrawals = await response.json();
                setUserWithdrawals(withdrawals);
            } else {
                console.error('Failed to fetch user withdrawals');
            }
        } catch (error) {
            console.error('Error fetching user withdrawals:', error);
        }
    };

    React.useEffect(() => {
        fetchUserResignations();
        fetchUserWithdrawals();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:3000/api/resignations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Resignation submitted successfully:', result);

                toast.success('Resignation submitted successfully!', {
                    description: 'Your resignation has been recorded and will be reviewed by HR.',
                });

                setFormData({
                    name: '',
                    department: '',
                    lastWorkingDay: '',
                    reason: '',
                    additionalComments: '',
                });

                if (user?.role === 'HR') {
                    setTimeout(() => {
                        navigate('/dash');
                    }, 1500);
                }
            } else {
                const error = await response.json();
                console.error('Error submitting resignation:', error);
                toast.error('Failed to submit resignation', {
                    description: error.message || 'Please try again later.',
                });
            }
        } catch (error) {
            console.error('Network error:', error);
            toast.error('Network error', {
                description: 'Please check your internet connection and try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackNavigation = () => {
        if (user?.role === 'HR') {
            navigate('/dash');
        } else {
            navigate('/');
        }
    };

    const handleCancelNavigation = () => {
        if (user?.role === 'HR') {
            navigate('/dash');
        } else {
            setFormData({
                name: '',
                department: '',
                lastWorkingDay: '',
                reason: '',
                additionalComments: '',
            });
        }
    };

    const handleWithdrawResignation = async (resignationId: string) => {
        setSelectedResignationId(resignationId);
        setWithdrawalDialogOpen(true);
    };

    const submitWithdrawalRequest = async () => {
        if (!withdrawalReason.trim()) {
            toast.error('Please provide a reason for withdrawal');
            return;
        }

        setIsSubmittingWithdrawal(true);
        try {
            const response = await fetch('http://localhost:3000/api/withdrawals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ 
                    resignationId: selectedResignationId, 
                    reason: withdrawalReason 
                }),
            });

            if (response.ok) {
                toast.success('Withdrawal request submitted successfully!', {
                    description: 'Your withdrawal request will be reviewed by HR.',
                });
                setWithdrawalDialogOpen(false);
                setWithdrawalReason('');
                setSelectedResignationId('');
                // Refresh both resignations and withdrawals
                fetchUserResignations();
                fetchUserWithdrawals();
            } else {
                const error = await response.json();
                toast.error('Failed to submit withdrawal request', {
                    description: error.message || 'Please try again later.',
                });
            }
        } catch (error) {
            console.error('Error submitting withdrawal request:', error);
            toast.error('Network error', {
                description: 'Please check your internet connection and try again.',
            });
        } finally {
            setIsSubmittingWithdrawal(false);
        }
    };

    const getResignationStatus = (resignation: Resignation) => {
        // Check if there's a pending withdrawal for this resignation
        const pendingWithdrawal = userWithdrawals.find(
            w => w.resignationId === resignation._id && w.status === 'pending'
        );
        
        if (pendingWithdrawal) {
            return { status: 'withdrawal-pending', label: 'Withdrawal Pending' };
        }
        
        return { status: resignation.status, label: resignation.status };
    };

    const canWithdraw = (resignation: Resignation) => {
        if (resignation.status !== 'pending') return false;
        
        const pendingWithdrawal = userWithdrawals.find(
            w => w.resignationId === resignation._id && w.status === 'pending'
        );
        
        const approvedWithdrawal = userWithdrawals.find(
            w => w.resignationId === resignation._id && w.status === 'approved'
        );
            
        return !pendingWithdrawal && !approvedWithdrawal;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'withdrawn': return 'bg-gray-100 text-gray-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'withdrawal-pending': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Get today's date for minimum date validation
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="min-h-screen p-6 bg-gray-50">
            <div className="max-w-4xl mx-auto">
                {isLoadingResignations ? (
                    <div className="text-center mb-6">
                        <p className="text-gray-500">Loading your previous resignations...</p>
                    </div>
                ) :
                    userResignations.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold mb-4">Your Previous Resignations</h2>
                            <div className="border rounded-lg">
                                <Table className='bg-white'>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Employee Name</TableHead>
                                            <TableHead>Department</TableHead>
                                            <TableHead>Last Working Day</TableHead>
                                            <TableHead>Submission Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {userResignations.map((resignation) => {
                                            const statusInfo = getResignationStatus(resignation);
                                            return (
                                                <TableRow key={resignation._id}>
                                                    <TableCell className="font-medium">{resignation.name}</TableCell>
                                                    <TableCell>{resignation.department}</TableCell>
                                                    <TableCell>{new Date(resignation.lastWorkingDay).toLocaleDateString()}</TableCell>
                                                    <TableCell>{new Date(resignation.submittedAt).toLocaleDateString()}</TableCell>
                                                    <TableCell>
                                                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(statusInfo.status)}`}>
                                                            {statusInfo.label}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {canWithdraw(resignation) ? (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleWithdrawResignation(resignation._id)}
                                                            >
                                                                Request Withdrawal
                                                            </Button>
                                                        ) : (
                                                            <span className="text-gray-400 text-sm">
                                                                {(() => {
                                                                    if (statusInfo.status === 'withdrawal-pending') {
                                                                        return 'Withdrawal Requested';
                                                                    }
                                                                    if (resignation.status === 'withdrawn') {
                                                                        return 'Already Withdrawn';
                                                                    }
                                                                    if (resignation.status === 'approved') {
                                                                        return 'Already Approved';
                                                                    }
                                                                    const approvedWithdrawal = userWithdrawals.find(
                                                                        w => w.resignationId === resignation._id && w.status === 'approved'
                                                                    );
                                                                    if (approvedWithdrawal) {
                                                                        return 'Withdrawal Approved';
                                                                    }
                                                                    return 'Cannot Withdraw';
                                                                })()}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )
                }

                {/* Withdrawal Dialog */}
                <Dialog open={withdrawalDialogOpen} onOpenChange={setWithdrawalDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Request Resignation Withdrawal</DialogTitle>
                            <DialogDescription>
                                Please provide a reason for withdrawing your resignation. This request will be reviewed by HR.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="withdrawal-reason">Reason for Withdrawal *</Label>
                                <Textarea
                                    id="withdrawal-reason"
                                    rows={4}
                                    value={withdrawalReason}
                                    onChange={(e) => setWithdrawalReason(e.target.value)}
                                    placeholder="Please explain why you want to withdraw your resignation..."
                                    disabled={isSubmittingWithdrawal}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    setWithdrawalDialogOpen(false);
                                    setWithdrawalReason('');
                                    setSelectedResignationId('');
                                }}
                                disabled={isSubmittingWithdrawal}
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={submitWithdrawalRequest}
                                disabled={isSubmittingWithdrawal || !withdrawalReason.trim()}
                            >
                                {isSubmittingWithdrawal ? 'Submitting...' : 'Submit Request'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <div className="mb-6">
                    {user?.role === 'HR' && (
                        <Button
                            variant="ghost"
                            onClick={handleBackNavigation}
                            className="mb-4"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    )}
                    <div className="text-center">
                        <h1 className="text-3xl font-bold mb-2">ExitEase</h1>
                        <p className="text-gray-600">Submit your resignation form with ease</p>
                    </div>
                </div>

                <Card className="shadow-lg border-0">
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold">Resignation Form</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                                        Full Name *
                                    </Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        disabled={isLoading}
                                        className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="Enter your full name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="department" className="text-sm font-medium text-slate-700">
                                        Department *
                                    </Label>
                                    <Input
                                        id="department"
                                        type="text"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        required
                                        disabled={isLoading}
                                        className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="Enter your department"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="lastWorkingDay" className="text-sm font-medium text-slate-700">
                                    Last Working Day *
                                </Label>
                                <Input
                                    id="lastWorkingDay"
                                    type="date"
                                    value={formData.lastWorkingDay}
                                    onChange={(e) => setFormData({ ...formData, lastWorkingDay: e.target.value })}
                                    required
                                    disabled={isLoading}
                                    min={today}
                                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                                />
                                <p className="text-xs text-gray-500">
                                    Please ensure you provide adequate notice as per your contract.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="template" className="text-sm font-medium text-slate-700">
                                    Resignation Template
                                </Label>
                                <Select
                                    onValueChange={(value) => handleTemplateSelect(value as keyof typeof resignationTemplates)}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger className="text-slate-700 border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                                        <SelectValue placeholder="Choose a template to get started (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="personal">Personal Reasons</SelectItem>
                                        <SelectItem value="career">Career Growth</SelectItem>
                                        <SelectItem value="relocation">Relocation</SelectItem>
                                        <SelectItem value="education">Further Education</SelectItem>
                                        <SelectItem value="health">Health Reasons</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-gray-500">
                                    Select a template to auto-fill the reason field, then customize as needed.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reason" className="text-sm font-medium text-slate-700">
                                    Reason for Resignation *
                                </Label>
                                <Textarea
                                    id="reason"
                                    rows={6}
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    required
                                    disabled={isLoading}
                                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                                    placeholder="Please explain your reason for resignation in detail"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="comments" className="text-sm font-medium text-slate-700">
                                    Additional Comments
                                </Label>
                                <Textarea
                                    id="comments"
                                    rows={3}
                                    value={formData.additionalComments}
                                    onChange={(e) => setFormData({ ...formData, additionalComments: e.target.value })}
                                    disabled={isLoading}
                                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                                    placeholder="Any additional comments, feedback, or requests (optional)"
                                />
                            </div>

                            <div className="pt-4 flex gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancelNavigation}
                                    disabled={isLoading}
                                    className="flex-1"
                                >
                                    {user?.role === 'HR' ? 'Cancel' : 'Clear Form'}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1"
                                >
                                    {isLoading ? "Submitting..." : "Submit Resignation"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ResigForm;

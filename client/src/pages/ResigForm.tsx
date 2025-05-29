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

interface ResignationFormData {
    name: string;
    department: string;
    lastWorkingDay: string;
    reason: string;
    additionalComments: string;
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
                
                // Clear form after successful submission
                setFormData({
                    name: '',
                    department: '',
                    lastWorkingDay: '',
                    reason: '',
                    additionalComments: '',
                });
                
                // Only HR users should navigate to dashboard after submission
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
            // For employees, we could redirect to a different page or just stay
            // Since employees should mainly use the resignation form, we'll navigate to home
            navigate('/');
        }
    };

    const handleCancelNavigation = () => {
        if (user?.role === 'HR') {
            navigate('/dash');
        } else {
            // For employees, we could show a confirmation or just clear the form
            setFormData({
                name: '',
                department: '',
                lastWorkingDay: '',
                reason: '',
                additionalComments: '',
            });
        }
    };

    // Get today's date for minimum date validation
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="min-h-screen p-6 bg-gray-50">
            <div className="max-w-4xl mx-auto">
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

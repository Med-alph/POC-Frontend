import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Calendar, User, FileText, AlertCircle } from "lucide-react";
import attendanceAPI from "../api/attendanceapi";
import toast from 'react-hot-toast';

export default function LeaveManagement() {
    const [pendingLeaves, setPendingLeaves] = useState([]);
    const [leaveHistory, setLeaveHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    
    const user = useSelector((state) => state.auth.user);

    useEffect(() => {
        fetchPendingLeaves();
        fetchLeaveHistory();
    }, [user?.hospital_id]);

    const fetchPendingLeaves = async () => {
        if (!user?.hospital_id) return;
        
        try {
            setLoading(true);
            const response = await attendanceAPI.getPendingLeaves(user.hospital_id);
            
            if (response.success) {
                setPendingLeaves(response.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch pending leaves:', error);
            toast.error('Failed to load pending leave requests');
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaveHistory = async () => {
        if (!user?.hospital_id) return;
        
        try {
            setHistoryLoading(true);
            // Fetch approved leaves
            const approvedResponse = await attendanceAPI.getHospitalLeaves(user.hospital_id, { 
                status: 'approved', 
                limit: 50 
            });
            
            // Fetch rejected leaves
            const rejectedResponse = await attendanceAPI.getHospitalLeaves(user.hospital_id, { 
                status: 'rejected', 
                limit: 50 
            });
            
            // Combine and sort by date (most recent first)
            const allProcessedLeaves = [
                ...(approvedResponse.success ? approvedResponse.data || [] : []),
                ...(rejectedResponse.success ? rejectedResponse.data || [] : [])
            ].sort((a, b) => {
                const dateA = new Date(a.approved_at || a.created_at);
                const dateB = new Date(b.approved_at || b.created_at);
                return dateB - dateA; // Most recent first
            });
            
            setLeaveHistory(allProcessedLeaves);
        } catch (error) {
            console.error('Failed to fetch leave history:', error);
            toast.error('Failed to load leave history');
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleApprove = async (leaveId) => {
        if (!user?.id) return;
        
        try {
            setProcessingId(leaveId);
            const response = await attendanceAPI.approveLeave(leaveId, user.id);
            
            if (response.success) {
                toast.success('Leave request approved successfully!');
                // Remove from pending list and refresh history
                setPendingLeaves(prev => prev.filter(leave => leave.id !== leaveId));
                fetchLeaveHistory();
            }
        } catch (error) {
            console.error('Failed to approve leave:', error);
            toast.error(error.message || 'Failed to approve leave request');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (leaveId) => {
        if (!user?.id) return;
        
        if (!rejectionReason.trim()) {
            toast.error('Please provide a rejection reason');
            return;
        }
        
        try {
            setProcessingId(leaveId);
            const response = await attendanceAPI.rejectLeave(leaveId, user.id, rejectionReason);
            
            if (response.success) {
                toast.success('Leave request rejected');
                // Remove from pending list and refresh history
                setPendingLeaves(prev => prev.filter(leave => leave.id !== leaveId));
                setRejectingId(null);
                setRejectionReason("");
                fetchLeaveHistory();
            }
        } catch (error) {
            console.error('Failed to reject leave:', error);
            toast.error(error.message || 'Failed to reject leave request');
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getLeaveTypeColor = (type) => {
        const colors = {
            casual: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
            sick: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
            annual: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
            emergency: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
        };
        return colors[type?.toLowerCase()] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700';
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                        Leave Management
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Review and approve pending leave requests
                    </p>
                </div>

                {/* Summary Card */}
                <Card className="border border-gray-200 dark:border-gray-700">
                    <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            Pending Requests
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-4xl font-semibold text-orange-600 dark:text-orange-400 mb-1">
                                {loading ? "..." : pendingLeaves.length}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Awaiting approval
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Pending Leave Requests */}
                <Card className="border border-gray-200 dark:border-gray-700">
                    <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">
                            Pending Leave Requests
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
                            </div>
                        ) : pendingLeaves.length > 0 ? (
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {pendingLeaves.map((leave) => (
                                    <div key={leave.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <div className="flex items-start justify-between gap-4">
                                            {/* Left: Staff Info */}
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                                                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {leave.staff?.staff_name || 'Unknown Staff'}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {leave.staff?.department || 'No Department'} • {leave.staff?.staff_code || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    {/* Leave Type */}
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-gray-400" />
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">Leave Type</p>
                                                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${getLeaveTypeColor(leave.leave_type)}`}>
                                                                {leave.leave_type?.toUpperCase() || 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Dates */}
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-gray-400" />
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {formatDate(leave.start_date)}
                                                                {leave.start_date !== leave.end_date && ` - ${formatDate(leave.end_date)}`}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                {leave.total_days} {leave.total_days === 1 ? 'day' : 'days'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Reason */}
                                                {leave.reason && (
                                                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reason:</p>
                                                        <p className="text-sm text-gray-700 dark:text-gray-300">{leave.reason}</p>
                                                    </div>
                                                )}

                                                {/* Rejection Reason Input */}
                                                {rejectingId === leave.id && (
                                                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800">
                                                        <label className="text-xs text-red-700 dark:text-red-400 font-medium mb-2 block">
                                                            Rejection Reason *
                                                        </label>
                                                        <textarea
                                                            value={rejectionReason}
                                                            onChange={(e) => setRejectionReason(e.target.value)}
                                                            placeholder="Please provide a reason for rejection..."
                                                            className="w-full px-3 py-2 text-sm border border-red-300 dark:border-red-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                                            rows="3"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right: Action Buttons */}
                                            <div className="flex flex-col gap-2 min-w-[120px]">
                                                {rejectingId === leave.id ? (
                                                    <>
                                                        <Button
                                                            onClick={() => handleReject(leave.id)}
                                                            disabled={processingId === leave.id || !rejectionReason.trim()}
                                                            className="bg-red-600 hover:bg-red-700 text-white h-9 px-4 text-sm font-medium rounded-md w-full"
                                                        >
                                                            {processingId === leave.id ? (
                                                                <span className="flex items-center gap-2">
                                                                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                                                                    Rejecting...
                                                                </span>
                                                            ) : (
                                                                <>
                                                                    <XCircle className="h-4 w-4 mr-1.5" />
                                                                    Confirm Reject
                                                                </>
                                                            )}
                                                        </Button>
                                                        <Button
                                                            onClick={() => {
                                                                setRejectingId(null);
                                                                setRejectionReason("");
                                                            }}
                                                            variant="outline"
                                                            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 h-9 px-4 text-sm font-medium rounded-md w-full"
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button
                                                            onClick={() => handleApprove(leave.id)}
                                                            disabled={processingId === leave.id}
                                                            className="bg-green-600 hover:bg-green-700 text-white h-9 px-4 text-sm font-medium rounded-md w-full"
                                                        >
                                                            {processingId === leave.id ? (
                                                                <span className="flex items-center gap-2">
                                                                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                                                                    Approving...
                                                                </span>
                                                            ) : (
                                                                <>
                                                                    <CheckCircle className="h-4 w-4 mr-1.5" />
                                                                    Approve
                                                                </>
                                                            )}
                                                        </Button>
                                                        <Button
                                                            onClick={() => setRejectingId(leave.id)}
                                                            disabled={processingId === leave.id}
                                                            variant="outline"
                                                            className="border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 h-9 px-4 text-sm font-medium rounded-md w-full"
                                                        >
                                                            <XCircle className="h-4 w-4 mr-1.5" />
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <CheckCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">No pending leave requests</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">All leave requests have been processed</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Leave History */}
                <Card className="border border-gray-200 dark:border-gray-700">
                    <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">
                            Leave History
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {historyLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
                            </div>
                        ) : leaveHistory.length > 0 ? (
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {leaveHistory.map((leave) => (
                                    <div key={leave.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <div className="flex items-start justify-between gap-4">
                                            {/* Left: Staff Info */}
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                                                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {leave.staff?.staff_name || 'Unknown Staff'}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {leave.staff?.department || 'No Department'} • {leave.staff?.staff_code || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    {/* Leave Type */}
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-gray-400" />
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">Leave Type</p>
                                                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${getLeaveTypeColor(leave.leave_type)}`}>
                                                                {leave.leave_type?.toUpperCase() || 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Dates */}
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-gray-400" />
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {formatDate(leave.start_date)}
                                                                {leave.start_date !== leave.end_date && ` - ${formatDate(leave.end_date)}`}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                {leave.total_days} {leave.total_days === 1 ? 'day' : 'days'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Reason */}
                                                {leave.reason && (
                                                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reason:</p>
                                                        <p className="text-sm text-gray-700 dark:text-gray-300">{leave.reason}</p>
                                                    </div>
                                                )}

                                                {/* Rejection Reason */}
                                                {leave.status === 'rejected' && leave.rejection_reason && (
                                                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800">
                                                        <p className="text-xs text-red-700 dark:text-red-400 font-medium mb-1">Rejection Reason:</p>
                                                        <p className="text-sm text-red-800 dark:text-red-300">{leave.rejection_reason}</p>
                                                    </div>
                                                )}

                                                {/* Processed Info */}
                                                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                                    {leave.approved_by_name && (
                                                        <span>Processed by: {leave.approved_by_name}</span>
                                                    )}
                                                    {leave.approved_at && (
                                                        <span>
                                                            {new Date(leave.approved_at).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right: Status Badge */}
                                            <div className="flex flex-col items-end gap-2">
                                                {leave.status === 'approved' ? (
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md border border-green-200 dark:border-green-800">
                                                        <CheckCircle className="h-4 w-4" />
                                                        <span className="text-sm font-medium">Approved</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800">
                                                        <XCircle className="h-4 w-4" />
                                                        <span className="text-sm font-medium">Rejected</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">No leave history found</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Processed leave requests will appear here</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

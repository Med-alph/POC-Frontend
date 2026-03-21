import React, { useState, useEffect } from "react";
import { 
    MessageSquare, 
    ThumbsUp, 
    ThumbsDown, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    Loader, 
    User, 
    Calendar,
    ArrowRight,
    Search,
    Filter
} from "lucide-react";
import feedbackAPI from "../api/feedbackapi";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function FeedbackAnalytics() {
    const user = useSelector((state) => state.auth.user);
    const hospitalId = user?.hospital_id;

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [inbox, setInbox] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState("all"); // all, acknowledged, pending

    useEffect(() => {
        if (hospitalId) {
            fetchData();
        }
    }, [hospitalId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, inboxRes] = await Promise.all([
                feedbackAPI.getStats(hospitalId),
                feedbackAPI.getInbox(hospitalId)
            ]);
            setStats(statsRes);
            setInbox(inboxRes);
        } catch (error) {
            console.error("Failed to fetch feedback data:", error);
            toast.error("Failed to load feedback analytics");
        } finally {
            setLoading(false);
        }
    };

    const handleAcknowledge = async (id) => {
        try {
            await feedbackAPI.acknowledge(id);
            toast.success("Feedback acknowledged");
            // Refresh inbox
            const updatedInbox = await feedbackAPI.getInbox(hospitalId);
            setInbox(updatedInbox);
        } catch (error) {
            toast.error("Failed to acknowledge feedback");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4 min-h-[400px]">
                <Loader className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-gray-500 font-medium">Loading feedback analytics...</p>
            </div>
        );
    }

    const filteredInbox = inbox.filter(item => {
        if (filter === "acknowledged") return item.is_acknowledged;
        if (filter === "pending") return !item.is_acknowledged;
        return true;
    });

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <MessageSquare className="h-6 w-6 text-blue-600" />
                        Patient Satisfaction Dashboard
                    </h2>
                    <p className="text-sm text-gray-500">Monitor and respond to patient feedback from WhatsApp.</p>
                </div>
                <Button 
                    variant="outline" 
                    onClick={fetchData} 
                    disabled={refreshing}
                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                    {refreshing ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Clock className="mr-2 h-4 w-4" />}
                    Refresh Data
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-none shadow-md bg-white">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sent</p>
                                <h3 className="text-2xl font-bold mt-1 text-gray-900">{stats?.totalSent || 0}</h3>
                            </div>
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <MessageSquare className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-xs text-gray-500">
                            <span className="font-semibold text-blue-600 mr-1">{stats?.responseRate || 0}%</span>
                            response rate
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Happiness Score</p>
                                <h3 className="text-2xl font-bold mt-1 text-gray-900">{stats?.happinessScore || 0}%</h3>
                            </div>
                            <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                <ThumbsUp className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-xs">
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div 
                                    className="bg-green-500 h-full" 
                                    style={{ width: `${stats?.happinessScore || 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Positive Feedbacks</p>
                                <h3 className="text-2xl font-bold mt-1 text-green-600">{stats?.positive || 0}</h3>
                            </div>
                            <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="mt-4 text-[10px] text-gray-400">Total high satisfaction responses</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Critical Feedbacks</p>
                                <h3 className="text-2xl font-bold mt-1 text-red-600">{stats?.negative || 0}</h3>
                            </div>
                            <div className="p-2 bg-red-50 rounded-lg text-red-600">
                                <AlertCircle className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="mt-4 text-[10px] text-gray-400">Responses requiring attention</p>
                    </CardContent>
                </Card>
            </div>

            {/* Negative Feedback Inbox */}
            <Card className="border-none shadow-lg bg-white overflow-hidden">
                <CardHeader className="border-b bg-gray-50/50">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <ThumbsDown className="h-5 w-5 text-red-500" />
                                Critical Feedback Inbox
                            </CardTitle>
                            <CardDescription>Manage patient concerns and perform service recovery.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant={filter === 'all' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setFilter('all')}>All</Badge>
                            <Badge variant={filter === 'pending' ? 'destructive' : 'outline'} className="cursor-pointer" onClick={() => setFilter('pending')}>Pending</Badge>
                            <Badge variant={filter === 'acknowledged' ? 'default' : 'outline'} className="cursor-pointer bg-green-500 text-white" onClick={() => setFilter('acknowledged')}>Resolved</Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50/80 border-b">
                                <tr>
                                    <th className="px-6 py-4">Patient</th>
                                    <th className="px-6 py-4">Appointment</th>
                                    <th className="px-6 py-4">Feedback / Comment</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredInbox.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <ThumbsUp className="h-12 w-12 mb-2 opacity-20" />
                                                <p className="text-base font-medium">No critical feedbacks found</p>
                                                <p className="text-xs">Congratulations! Your patients are happy.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInbox.map((item) => (
                                        <tr key={item.id} className={`hover:bg-gray-50/50 transition-colors ${item.is_acknowledged ? 'opacity-60' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold shrink-0">
                                                        {item.patient?.patient_name?.charAt(0) || <User className="h-4 w-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{item.patient?.patient_name || "Unknown Patient"}</p>
                                                        <p className="text-[10px] text-gray-500">{item.patient?.contact_info}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1 text-xs text-gray-600">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(item.appointment?.appointment_date).toLocaleDateString()}
                                                    </div>
                                                    <p className="text-xs underline text-blue-600 font-medium">Dr. {item.appointment?.staff_name}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1 max-w-md">
                                                    <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 text-[10px]">
                                                        Rating: {item.rating}
                                                    </Badge>
                                                    <p className="text-gray-700 italic">
                                                        "{item.comment || "No text comment provided."}"
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {item.is_acknowledged ? (
                                                    <div className="flex flex-col items-end gap-1">
                                                        <Badge className="bg-green-100 text-green-700 border-green-200">
                                                            <CheckCircle2 className="h-3 w-3 mr-1" /> Resolved
                                                        </Badge>
                                                        <span className="text-[10px] text-gray-400">by {item.acknowledged_by_user?.name || "Admin"}</span>
                                                    </div>
                                                ) : (
                                                    <Button 
                                                        size="sm" 
                                                        onClick={() => handleAcknowledge(item.id)}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                                    >
                                                        Acknowledge
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

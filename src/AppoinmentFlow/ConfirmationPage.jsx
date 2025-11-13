import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle2, Stethoscope, Download, Share2, Printer } from "lucide-react";

const ConfirmationPage = () => {
    const navigate = useNavigate();
    const { appointment } = useLocation().state || {};
    const date = appointment?.appointment_date;
    const time = appointment?.appointment_time;
    const doctor = appointment?.doctor_name || appointment?.staff_name;

    // Format date helper
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch {
            return dateString;
        }
    };

    const handleDownloadICS = () => {
        // Create .ics file content
        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MedAssist//Patient Portal//EN
BEGIN:VEVENT
DTSTART:${new Date(`${date}T${time}:00`).toISOString().replace(/[-:]/g, "").split(".")[0]}Z
DTEND:${new Date(`${date}T${time}:00`).toISOString().replace(/[-:]/g, "").split(".")[0]}Z
SUMMARY:Appointment with ${doctor}
DESCRIPTION:Appointment Details
LOCATION:MedAssist Clinic
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
        
        const blob = new Blob([icsContent], { type: "text/calendar" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "appointment.ics";
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: "Appointment Confirmed",
                text: `Appointment with ${doctor} on ${formatDate(date)} at ${time}`,
            });
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center px-4 py-10 transition-colors duration-300">
            <div className="w-full max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-3 bg-green-600 text-white px-4 py-2.5 rounded-xl shadow-lg mb-6">
                    <Stethoscope className="h-6 w-6" />
                    <span className="text-sm font-semibold">MedPortal — Patient Access</span>
                </div>
                
                <Card className="shadow-2xl border-0 rounded-2xl dark:bg-gray-800 dark:border-gray-700 overflow-hidden animate-in fade-in-0 zoom-in-95">
                    <CardHeader className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 dark:from-green-700 dark:via-green-600 dark:to-emerald-600 text-white text-center pb-8 pt-8">
                        <div className="mx-auto mb-6 w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-95">
                            <CheckCircle2 className="h-12 w-12 text-white" />
                        </div>
                        <CardTitle className="text-3xl font-bold mb-2">Appointment Confirmed!</CardTitle>
                        <p className="text-green-100 text-lg mt-2">Your booking has been successfully completed</p>
                    </CardHeader>
                    
                    <CardContent className="p-8 space-y-6">
                        {/* Appointment Summary */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 space-y-5 border border-blue-200 dark:border-blue-800">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                Appointment Summary
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {appointment?.id && (
                                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Appointment ID</p>
                                        <p className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">{appointment.id}</p>
                                    </div>
                                )}
                                
                                {doctor && (
                                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Doctor</p>
                                        <p className="font-bold text-gray-900 dark:text-white">{doctor}</p>
                                    </div>
                                )}
                                
                                {date && (
                                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 flex items-start gap-3">
                                        <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Date</p>
                                            <p className="font-bold text-gray-900 dark:text-white">{formatDate(date)}</p>
                                        </div>
                                    </div>
                                )}
                                
                                {time && (
                                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 flex items-start gap-3">
                                        <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Time</p>
                                            <p className="font-bold text-gray-900 dark:text-white">{time}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-3 gap-3">
                            <Button
                                variant="outline"
                                onClick={handleDownloadICS}
                                className="flex flex-col items-center gap-2 h-auto py-4 border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 transition-all rounded-xl"
                            >
                                <Download className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                <span className="text-xs font-semibold">Add to Calendar</span>
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleShare}
                                className="flex flex-col items-center gap-2 h-auto py-4 border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 transition-all rounded-xl"
                            >
                                <Share2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                <span className="text-xs font-semibold">Share</span>
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handlePrint}
                                className="flex flex-col items-center gap-2 h-auto py-4 border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 transition-all rounded-xl"
                            >
                                <Printer className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                <span className="text-xs font-semibold">Print</span>
                            </Button>
                        </div>

                        {/* Main Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <Button 
                                variant="outline" 
                                onClick={() => navigate('/landing')}
                                className="flex-1 h-12 text-base font-semibold rounded-xl"
                            >
                                Back to Home
                            </Button>
                            <Button 
                                onClick={() => navigate('/appointment')}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                            >
                                Book Another Appointment
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ConfirmationPage;
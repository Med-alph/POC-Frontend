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
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center px-4 py-10 transition-colors duration-300">
            <div className="w-full max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-3 bg-green-600 text-white px-4 py-2.5 rounded-xl shadow-lg mb-6">
                    <Stethoscope className="h-6 w-6" />
                    <span className="text-sm font-semibold">MedPortal — Patient Access</span>
                </div>
                
                <Card className="shadow-2xl border-0 rounded-2xl dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-green-600 to-green-500 dark:from-green-700 dark:to-green-600 text-white text-center pb-8">
                        <div className="mx-auto mb-4 w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-10 w-10 text-white" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Appointment Confirmed!</CardTitle>
                        <p className="text-green-100 mt-2">Your booking has been successfully completed</p>
                    </CardHeader>
                    
                    <CardContent className="p-6 space-y-6">
                        {/* Appointment Summary */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 space-y-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Appointment Summary</h3>
                            
                            {appointment?.id && (
                                <div className="flex items-start gap-3">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Appointment ID:</span>
                                    <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{appointment.id}</span>
                                </div>
                            )}
                            
                            {doctor && (
                                <div className="flex items-start gap-3">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Doctor:</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{doctor}</span>
                                </div>
                            )}
                            
                            {date && (
                                <div className="flex items-start gap-3">
                                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                                    <div>
                                        <span className="text-sm text-gray-600 dark:text-gray-400 block">Date</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{formatDate(date)}</span>
                                    </div>
                                </div>
                            )}
                            
                            {time && (
                                <div className="flex items-start gap-3">
                                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                                    <div>
                                        <span className="text-sm text-gray-600 dark:text-gray-400 block">Time</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{time}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                variant="outline"
                                onClick={handleDownloadICS}
                                className="flex flex-col items-center gap-2 h-auto py-3"
                            >
                                <Download className="h-5 w-5" />
                                <span className="text-xs">Add to Calendar</span>
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleShare}
                                className="flex flex-col items-center gap-2 h-auto py-3"
                            >
                                <Share2 className="h-5 w-5" />
                                <span className="text-xs">Share</span>
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handlePrint}
                                className="flex flex-col items-center gap-2 h-auto py-3"
                            >
                                <Printer className="h-5 w-5" />
                                <span className="text-xs">Print</span>
                            </Button>
                        </div>

                        {/* Main Actions */}
                        <div className="flex gap-3 pt-4">
                            <Button 
                                variant="outline" 
                                onClick={() => navigate('/landing')}
                                className="flex-1"
                            >
                                Back to Home
                            </Button>
                            <Button 
                                onClick={() => navigate('/appointment')}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            >
                                Book Another
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ConfirmationPage;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";

export default function PendingPayments({ appointments }) {
    return (
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden h-fit">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    Pending Payments
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
                {appointments.length === 0 ? (
                    <div className="text-center py-8">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">No pending payments</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {appointments.map(a => (
                            <div
                                key={a.appointmentId}
                                className={`cursor-pointer p-3 rounded-md border transition-all ${
                                    a.pendingAmount > 0 
                                        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30" 
                                        : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30"
                                }`}
                                onClick={() => a.onClick(a.appointmentId)}
                            >
                                <div className="flex items-start gap-3 mb-2">
                                    {a.pendingAmount > 0 ? (
                                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                                            {a.shortId}
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            {a.patient} / {a.doctor}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Pending:</span>
                                    <span className={`font-bold text-lg ${
                                        a.pendingAmount > 0 
                                            ? "text-red-600 dark:text-red-400" 
                                            : "text-green-600 dark:text-green-400"
                                    }`}>
                                        ₹{a.pendingAmount}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

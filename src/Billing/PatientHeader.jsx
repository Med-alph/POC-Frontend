import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { User, Calendar, Phone, MapPin } from "lucide-react";

export default function PatientHeader({ name, age, phone, address }) {
    return (
        <Card className="mb-6 shadow-xl border-0 rounded-2xl dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 text-white">
                <h2 className="text-xl font-bold flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                        <User className="h-6 w-6" />
                    </div>
                    Patient Information
                </h2>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-3 mb-2">
                            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Full Name</p>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{name}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-3 mb-2">
                            <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Age</p>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{age} years</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-3 mb-2">
                            <Phone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Phone</p>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{phone}</p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                        <div className="flex items-center gap-3 mb-2">
                            <MapPin className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Address</p>
                        </div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{address}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

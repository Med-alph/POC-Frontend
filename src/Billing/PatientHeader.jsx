import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { User, Calendar, Phone, MapPin } from "lucide-react";

export default function PatientHeader({ name, age, phone, address }) {
    return (
        <Card className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    Patient Information
                </h2>
            </CardHeader>
            <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-4 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Full Name</p>
                        </div>
                        <p className="text-base font-semibold text-gray-900 dark:text-white">{name}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-4 border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Age</p>
                        </div>
                        <p className="text-base font-semibold text-gray-900 dark:text-white">{age} years</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-4 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-2">
                            <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Phone</p>
                        </div>
                        <p className="text-base font-semibold text-gray-900 dark:text-white">{phone}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-4 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Address</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{address}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

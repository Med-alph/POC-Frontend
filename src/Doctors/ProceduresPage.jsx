import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Clipboard } from "lucide-react";

export default function ProceduresPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                        Procedures
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Manage your medical procedures
                    </p>
                </div>

                {/* Empty State */}
                <Card className="border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-12">
                        <div className="flex flex-col items-center justify-center text-center">
                            <Clipboard className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                            <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                No procedures found
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                This module is currently empty.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

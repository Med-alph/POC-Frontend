import { Card, CardContent } from "@/components/ui/card";

const ConfirmationPage = () => {
    return (
        <div className="flex items-center justify-center h-screen">
            <Card className="w-96 p-6 text-center">
                <CardContent>
                    <h1 className="text-2xl font-bold text-green-600">Appointment Confirmed ✅</h1>
                    <p className="mt-2">Thank you! Your appointment has been booked successfully.</p>
                </CardContent>
            </Card>
        </div>
    );
};

export default ConfirmationPage;
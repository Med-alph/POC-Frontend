import { Card, CardContent } from "@/components/ui/card";


export default function PatientHeader({ name, age, phone, address }) {
    return (
        <Card className="mb-4">
            <CardContent className="flex flex-col md:flex-row md:justify-between gap-2">
                <div>
                    <p className="text-lg font-semibold">{name}</p>
                    <p>Age: {age}</p>
                </div>
                <div>
                    <p>Phone: {phone}</p>
                    <p>Address: {address}</p>
                </div>
            </CardContent>
        </Card>
    );
};

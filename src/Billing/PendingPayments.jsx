import { Card, CardContent } from "@/components/ui/card";



export default function PendingPayments({ appointments }) {
    return (
        <Card className="p-2">
            <CardContent>
                <p className="font-semibold mb-2">Pending Payments</p>
                <ul>
                    {appointments.map(a => (
                        <li
                            key={a.appointmentId}
                            className={`cursor-pointer py-1 px-2 rounded mb-1 ${a.pendingAmount > 0 ? "bg-red-100" : "bg-gray-100"}`}
                            onClick={() => a.onClick(a.appointmentId)}
                        >
                            {a.shortId} -{a.patient} / {a.doctor} | Pending: ₹{a.pendingAmount}
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
};

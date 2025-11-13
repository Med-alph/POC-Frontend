import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PatientHeader from "./PatientHeader";
import ItemTable from "./ItemTable";
import PendingPayments from "./PendingPayments";
import BillingSummary from "./BillingSummary";
import PaymentTab from "./PaymentTab";

export default function BillingPage() {
    const [totalToday, setTotalToday] = useState(0);

    const patient = { name: "John Doe", age: 32, phone: "+91-9876543210", address: "123 MG Road, City" };
    const items = [
        { id: "1", name: "Consultation", qty: 1, unitPrice: 100, payNow: true },
        { id: "2", name: "Tablet 1", qty: 2, unitPrice: 20, payNow: false },
        { id: "3", name: "Tablet 2", qty: 1, unitPrice: 10, payNow: true },
    ];
    const pendingAppointments = [
        { shortId: "321-Dr_Jeff-rey", appointmentId: "app_123", doctor: "Dr. Jeff", patient: "John Doe", pendingAmount: 100, onClick: (id) => console.log("Go to appointment", id) },
        { shortId: "322-Dr_Alice", appointmentId: "app_124", doctor: "Dr. Alice", patient: "John Doe", pendingAmount: 0, onClick: (id) => console.log("Go to appointment", id) },
    ];

    return (
        <div className="p-4">
            <PatientHeader {...patient} />

            <Tabs defaultValue="billing">
                <TabsList>
                    <TabsTrigger value="billing">Billing Details</TabsTrigger>
                    <TabsTrigger value="payment">Payment</TabsTrigger>
                </TabsList>

                <TabsContent value="billing">
                    <div className="md:flex gap-4">
                        <div className="md:w-3/4">
                            <ItemTable items={items} onTotalChange={setTotalToday} />
                        </div>
                        <div className="md:w-1/4">
                            <PendingPayments appointments={pendingAppointments} />
                        </div>
                    </div>
                    <BillingSummary
                        subtotal={totalToday}
                        tax={totalToday * 0.1}
                        totalToday={totalToday + totalToday * 0.1}
                        pendingTotal={pendingAppointments.reduce((sum, a) => sum + a.pendingAmount, 0)}
                        onPayNow={() => console.log("Pay Now")}
                    />
                </TabsContent>

                <TabsContent value="payment">
                    <PaymentTab
                        amount={totalToday + totalToday * 0.1}
                        onPay={(method) => console.log("Pay via", method)}
                        patient={patient}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
};

// BillingPage.tsx
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PatientHeader from "./PatientHeader";
import ItemTable from "./ItemTable";
import PendingPayments from "./PendingPayments";
import BillingSummary from "./BillingSummary";
import PaymentTab from "./PaymentTab";
import paymentsAPI from "../api/paymentsapi";
import toast, { Toaster } from "react-hot-toast"

export default function BillingPage() {
  const [totalToday, setTotalToday] = useState(0);
  const [orderCreated, setOrderCreated] = useState(false);
  const [razorpayOrderId, setRazorpayOrderId] = useState(null);

  const [activeTab, setActiveTab] = useState("billing");
  const [loading, setLoading] = useState(false);

  const patient = {
    name: "John Doe",
    age: 32,
    phone: "+91-9876543210",
    email: "johndoe@example.com",
    address: "123 MG Road, City",
    id: "1142c1d8-99cf-4fcd-8467-262cc15e4368",
  };
  const items = [
    { id: "1", name: "Consultation", qty: 1, unitPrice: 1, payNow: true },
    { id: "2", name: "Tablet 1", qty: 2, unitPrice: 1, payNow: false },
    { id: "3", name: "Tablet 2", qty: 1, unitPrice: 1, payNow: true },
  ];
  const pendingAppointments = [
    {
      shortId: "321-Dr_Jeff-rey",
      appointmentId: "app_123",
      doctor: "Dr. Jeff",
      patient: "John Doe",
      pendingAmount: 100,
      onClick: (id) => console.log("Go to appointment", id),
    },
    {
      shortId: "322-Dr_Alice",
      appointmentId: "app_124",
      doctor: "Dr. Alice",
      patient: "John Doe",
      pendingAmount: 0,
      onClick: (id) => console.log("Go to appointment", id),
    },
  ];

  const amountToPay = totalToday + totalToday * 0.1; // total + tax

  // on Pay Now click: create razorpay order backend call
  const handlePayNow = async () => {
    setLoading(true);
    try {
      const orderResponse = await paymentsAPI.createOrder({
        amount: Math.round(amountToPay * 100), // convert to paise
        receipt: `receipt_${Date.now()}`,
        patientId: patient.id || "1142c1d8-99cf-4fcd-8467-262cc15e4368", // pass patientId here
      });
      const razorOrderId = orderResponse.razorpayOrderId || orderResponse.orderNumber;
      setRazorpayOrderId(razorOrderId);
      setOrderCreated(true);
      setActiveTab("payment");
    } catch (error) {
      console.error("Failed to create order:", error);
      alert("Failed to initiate payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 lg:p-8">
        <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">Patient Billing</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage billing details and process payments</p>
        </div>

        <PatientHeader {...patient} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-white dark:bg-gray-800 rounded-xl p-1 shadow-lg border border-gray-200 dark:border-gray-700">
            <TabsTrigger
              value="billing"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg font-semibold transition-all"
            >
              Billing Details
            </TabsTrigger>
            <TabsTrigger
              value="payment"
              disabled={!orderCreated}
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg font-semibold transition-all"
            >
              Payment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="billing" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <ItemTable items={items} onTotalChange={setTotalToday} />
              </div>
              <div className="lg:col-span-1">
                <PendingPayments appointments={pendingAppointments} />
              </div>
            </div>
            <BillingSummary
              subtotal={totalToday}
              tax={totalToday * 0.1}
              totalToday={amountToPay}
              pendingTotal={pendingAppointments.reduce((sum, a) => sum + a.pendingAmount, 0)}
              onPayNow={handlePayNow}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="payment" className="mt-6">
            <PaymentTab
              amount={amountToPay}
              orderId={razorpayOrderId}
              patient={patient}
              onPaymentSuccess={() => {
                toast.success("Payment success!");
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

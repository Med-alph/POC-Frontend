// BillingPage.tsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PatientHeader from "./PatientHeader";
import ItemTable from "./ItemTable";
import PendingPayments from "./PendingPayments";
import BillingSummary from "./BillingSummary";
import PaymentTab from "./PaymentTab";
import paymentsAPI from "../api/paymentsapi";
import appointmentsAPI from "../api/appointmentsapi";
import toast, { Toaster } from "react-hot-toast"
import { Loader2, AlertCircle } from "lucide-react";
import { useHospital } from "../contexts/HospitalContext";

export default function BillingPage() {
  const { hospitalInfo } = useHospital();
  const { appoinmentid } = useParams();
  const [totalToday, setTotalToday] = useState(0);
  const [orderCreated, setOrderCreated] = useState(false);
  const [razorpayOrderId, setRazorpayOrderId] = useState(null);

  const [activeTab, setActiveTab] = useState("billing");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [patient, setPatient] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [items, setItems] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);

  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      try {
        setFetching(true);
        const response = await appointmentsAPI.getById(appoinmentid);
        const appt = response.data || response;
        setAppointment(appt);

        if (appt.patient) {
          setPatient({
            name: appt.patient.patient_name || appt.patient_name,
            age: appt.patient.age || calculateAge(appt.patient.dob),
            phone: appt.patient.contact_info || appt.patient_contact,
            email: appt.patient.email || "N/A",
            address: appt.patient.address || "N/A",
            id: appt.patient.id || appt.patient_id,
          });
        }

        // Dynamically create billing items
        const consultationItem = {
          id: "cons-1",
          name: `Consultation - ${appt.staff?.staff_name || appt.staff_name || "Doctor"}`,
          qty: 1,
          unitPrice: appt.consultation_fee || 500, // Default to 500 if not specified
          payNow: true
        };

        // Add some mock pharmacy items if it's a fulfilled appointment to make it look real
        const pharmacyItems = appt.status === "fulfilled" || appt.status === "completed" ? [
          { id: "med-1", name: "Prescribed Medicine A", qty: 2, unitPrice: 150, payNow: true },
          { id: "med-2", name: "Prescribed Medicine B", qty: 1, unitPrice: 80, payNow: true }
        ] : [];

        setItems([consultationItem, ...pharmacyItems]);

        // Mock pending payments for other appointments (if any)
        setPendingPayments([
          {
            shortId: appoinmentid.slice(0, 8),
            appointmentId: appoinmentid,
            doctor: appt.staff?.staff_name || appt.staff_name || "Doctor",
            patient: appt.patient?.patient_name || appt.patient_name || "Patient",
            pendingAmount: 0,
            onClick: (id) => console.log("Current appointment", id),
          }
        ]);

      } catch (error) {
        console.error("Failed to fetch appointment details:", error);
        toast.error("Failed to load patient information");
      } finally {
        setFetching(false);
      }
    };

    if (appoinmentid) {
      fetchAppointmentDetails();
    }
  }, [appoinmentid]);

  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };



  const amountToPay = totalToday + totalToday * 0.1; // total + tax

  // on Pay Now click: create razorpay order backend call
  const handlePayNow = async () => {
    setLoading(true);
    try {
      const orderResponse = await paymentsAPI.createOrder({
        amount: Math.round(amountToPay * 100), // convert to paise
        receipt: `receipt_${Date.now()}`,
        patientId: patient?.id,
        appointmentId: appoinmentid, // pass appointmentId here
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

  // Determine if payment is enabled from appointment details (priority) or global hospital context
  // Use loose equality check to handle string "true" if API returns that, though boolean is expected
  const isPaymentEnabled = appointment?.hospital?.is_payment_enabled !== undefined
    ? appointment.hospital.is_payment_enabled
    : (hospitalInfo?.is_payment_enabled ?? false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <main className="flex-1 p-6 lg:p-8">
        <Toaster position="top-right" />
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">Patient Billing</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage billing details and process payments</p>
        </div>

        {fetching ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Fetching patient details...</p>
          </div>
        ) : (
          <>
            <PatientHeader {...patient} />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
              <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-100 dark:bg-gray-700 rounded-md p-1">
                <TabsTrigger
                  value="billing"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md font-semibold transition-all"
                >
                  Billing Details
                </TabsTrigger>
                <TabsTrigger
                  value="payment"
                  disabled={!orderCreated}
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md font-semibold transition-all"
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
                    <PendingPayments appointments={pendingPayments} />
                  </div>
                </div>
                <BillingSummary
                  subtotal={totalToday}
                  tax={totalToday * 0.1}
                  totalToday={amountToPay}
                  pendingTotal={pendingPayments.reduce((sum, a) => sum + a.pendingAmount, 0)}
                  onPayNow={handlePayNow}
                  loading={loading}
                  showPayButton={isPaymentEnabled}
                />
                {!isPaymentEnabled && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-3 text-amber-800">
                    <AlertCircle className="h-5 w-5" />
                    <p className="text-sm font-medium">Online payments are currently disabled for this hospital. Please pay at the reception.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="payment" className="mt-6">
                <PaymentTab
                  amount={amountToPay}
                  orderId={razorpayOrderId}
                  patient={patient}
                  isPaymentEnabled={isPaymentEnabled}
                  onPaymentSuccess={() => {
                    toast.success("Payment success!");
                  }}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}

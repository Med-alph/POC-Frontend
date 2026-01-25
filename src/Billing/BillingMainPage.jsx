// BillingPage.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PatientHeader from "./PatientHeader";
import ItemTable from "./ItemTable";
import PendingPayments from "./PendingPayments";
import BillingSummary from "./BillingSummary";
import PaymentTab from "./PaymentTab";
import paymentsAPI from "../api/paymentsapi";
import appointmentsAPI from "../api/appointmentsapi";
import consultationsAPI from "../api/consultationsapi";
import inventoryAPI from "../api/inventoryapi";
import patientsAPI from "../api/patientsapi";
import toast, { Toaster } from "react-hot-toast"
import { Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { useHospital } from "../contexts/HospitalContext";

export default function BillingPage() {
  const { hospitalInfo } = useHospital();
  const navigate = useNavigate();
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

        // Fetch full patient details to get credit info
        const patientId = appt.patient_id || appt.patient?.id;
        if (patientId) {
          try {
            const patResponse = await patientsAPI.getById(patientId);
            const patFull = patResponse.data || patResponse;
            setPatient({
              ...patFull,
              name: patFull.patient_name,
              age: patFull.age || calculateAge(patFull.dob),
              phone: patFull.contact_info,
              email: patFull.email || "N/A",
              address: patFull.address || "N/A",
              id: patFull.id,
              is_credit_eligible: patFull.is_credit_eligible,
              current_credit_balance: patFull.current_credit_balance,
              credit_limit: patFull.credit_amount // patient.credit_amount acts as limit
            });
          } catch (patErr) {
            console.error("Failed to fetch full patient details", patErr);
            // Fallback to appointment patient data
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
          }
        }

        // Fetch consultation to get prescriptions
        let prescriptionItems = [];
        try {
          // Fetch inventory items to match prices
          let inventoryItems = [];
          try {
            const inventoryResponse = await inventoryAPI.getItems({ include_archived: false });
            inventoryItems = inventoryResponse.data || [];
          } catch (invErr) {
            console.error("Failed to fetch inventory", invErr);
          }

          const consultationResponse = await consultationsAPI.getByAppointment(appoinmentid);

          // Handle various response formats
          let consultation = null;
          if (consultationResponse) {
            if (consultationResponse.consultations && Array.isArray(consultationResponse.consultations)) {
              consultation = consultationResponse.consultations[0];
            } else if (Array.isArray(consultationResponse)) {
              consultation = consultationResponse[0];
            } else {
              consultation = consultationResponse;
            }
          }

          if (consultation && consultation.prescriptions) {
            prescriptionItems = consultation.prescriptions.map((p, idx) => {
              // Try to find matching item in inventory to get price
              const invMatch = inventoryItems.find(item =>
                item.name.toLowerCase().trim() === p.medicine_name.toLowerCase().trim()
              );

              return {
                id: p.id || `pres-${idx}`,
                name: p.medicine_name,
                type: "Pharmaceutical",
                qty: p.quantity || 1,
                unitPrice: invMatch ? parseFloat(invMatch.cost_per_unit) : 0,
                payNow: true
              };
            });
          }
        } catch (err) {
          console.error("No consultation found for this appointment", err);
        }

        const consultationItem = {
          id: "cons-1",
          name: `Consultation - ${appt.staff?.staff_name || appt.staff_name || "Doctor"}`,
          type: "Consultation",
          qty: 1,
          unitPrice: appt.consultation_fee || 500,
          payNow: true
        };

        setItems([consultationItem, ...prescriptionItems]);

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

  // handle payment initiation (multi-mode)
  const handlePaymentInitiation = async (mode) => {
    setLoading(true);
    try {
      const orderResponse = await paymentsAPI.initiateOrder({
        amount: Math.round(amountToPay * 100), // convert to paise
        receipt: `receipt ${appoinmentid}_${Date.now()}`,
        patientId: patient?.id,
        appointmentId: appoinmentid,
        paymentModeCategory: mode.toLowerCase(), // digital, cash, credit
      });

      if (mode === 'DIGITAL') {
        const razorOrderId = orderResponse.razorpayOrderId || orderResponse.orderNumber;
        setRazorpayOrderId(razorOrderId);
        setOrderCreated(true);
        setActiveTab("payment");
      } else if (mode === 'CASH') {
        toast.success("Bill posted as UNPAID. Send patient to Cashier.", { duration: 4000 });
        navigate('/appointments'); // Or to a bill detail page
      } else if (mode === 'CREDIT') {
        toast.success("Payment settled via Patient Credit.");
        navigate('/appointments');
      }
    } catch (error) {
      console.error(`Failed to initiate ${mode} payment:`, error);
      toast.error(error.message || "Failed to process payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Determine if already paid
  const isAlreadyPaid = appointment?.orders?.some(o => o.status === 'paid') || appointment?.status === 'paid';

  // Determine if payment is enabled from appointment details (priority) or global hospital context
  // Use loose equality check to handle string "true" if API returns that, though boolean is expected
  const isPaymentEnabled = appointment?.hospital?.is_payment_enabled !== undefined
    ? appointment.hospital.is_payment_enabled
    : (hospitalInfo?.is_payment_enabled ?? false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <main className="flex-1 p-6 lg:p-8">
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

            {isAlreadyPaid && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-center gap-3 text-green-800">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-bold">Payment Completed</p>
                  <p className="text-sm">This appointment has already been settled. No further payment is required.</p>
                </div>
              </div>
            )}

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
                  disabled={!orderCreated || isAlreadyPaid}
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
                  onPayNow={handlePaymentInitiation}
                  loading={loading}
                  showPayButton={isPaymentEnabled && !isAlreadyPaid}
                  patient={patient}
                />
                {!isPaymentEnabled && !isAlreadyPaid && (
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

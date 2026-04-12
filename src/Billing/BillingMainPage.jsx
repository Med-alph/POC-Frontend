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
  const [showQrModal, setShowQrModal] = useState(false);
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

          let labItems = [];
          if (consultation && consultation.lab_orders) {
            labItems = consultation.lab_orders.map((l, idx) => {
              // Try to find matching item in inventory to get price (sometimes tests are in inventory)
              const invMatch = inventoryItems.find(item =>
                item.name.toLowerCase().trim() === l.test_name.toLowerCase().trim()
              );

              return {
                id: l.id || `lab-${idx}`,
                name: l.test_name,
                type: "Service",
                qty: 1,
                unitPrice: invMatch ? parseFloat(invMatch.cost_per_unit) : 0,
                payNow: true
              };
            });
          }

          let procedureItems = [];
          if (consultation && consultation.procedures) {
            procedureItems = consultation.procedures.map((p, idx) => {
              return {
                id: p.id || `proc-${idx}`,
                name: p.procedure?.name || "Procedure",
                type: "Service",
                qty: 1,
                unitPrice: parseFloat(p.actual_price_charged || p.procedure?.price || 0),
                payNow: true
              };
            });
          }

          const consultationItem = {
            id: "cons-1",
            name: `Consultation - ${appt.staff?.staff_name || appt.staff_name || "Doctor"}`,
            type: "Consultation",
            qty: 1,
            unitPrice: parseFloat(appt.staff?.consultation_fee || appt.hospital?.default_consultation_fee || 500),
            payNow: true
          };

          setItems([consultationItem, ...prescriptionItems, ...labItems, ...procedureItems]);
        } catch (err) {
          console.error("No consultation found for this appointment", err);
        }

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
      window.scrollTo(0, 0);
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



  const amountToPay = totalToday;

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
        items: items.map(item => ({
          name: item.name,
          type: item.type,
          unitPrice: item.unitPrice,
          quantity: item.qty,
          total: item.unitPrice * item.qty,
          referenceId: item.id?.toString()
        }))
      });

      if (mode === 'DIGITAL') {
        toast.success("Invoice posted successfully. Patient can now pay from their portal.", { duration: 5000 });
        navigate('/appointments');
      } else if (mode === 'CASH') {
        toast.success("Bill marked as Settle payment. Verify payment at counter.", { duration: 4000 });
        navigate('/cashier'); // Navigate to cashier tab as requested
      } else if (mode === 'CREDIT') {
        toast.success("Invoice settled via Patient Credit.");
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

  const renderQrModal = () => {
    const upiId = appointment?.hospital?.upi_id || hospitalInfo?.upi_id;
    if (!showQrModal || !upiId) return null;

    const hospitalName = appointment?.hospital?.name || hospitalInfo?.name || "Clinic";
    const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(hospitalName)}&am=${amountToPay}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}&bg=ffffff&color=000000`;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowQrModal(false)} />
        <div className="relative z-50 w-full max-w-sm bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Scan to Pay</h3>
            <button onClick={() => setShowQrModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <AlertCircle className="h-6 w-6 rotate-45" />
            </button>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-inner border-4 border-blue-50 mb-6">
            <img src={qrUrl} alt="Payment QR" className="w-[220px] h-[220px]" />
          </div>

          <div className="text-center space-y-2">
            <p className="text-2xl font-black text-gray-900 dark:text-white">₹{amountToPay.toFixed(2)}</p>
            <div className="flex flex-col items-center">
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">UPI ID</p>
              <p className="text-sm font-medium text-blue-600">{upiId}</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 w-full opacity-60 grayscale scale-90">
             <div className="bg-gray-100 dark:bg-gray-700 h-10 rounded-lg flex items-center justify-center font-black">GPay</div>
             <div className="bg-gray-100 dark:bg-gray-700 h-10 rounded-lg flex items-center justify-center font-black">PhonePe</div>
          </div>

          <p className="mt-6 text-[10px] text-gray-400 text-center uppercase tracking-tighter">After payment, please click "Settle Payment" <br/> to mark the bill as paid.</p>
        </div>
      </div>
    );
  };

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
              </TabsList>

              <TabsContent value="billing" className="mt-6">
                <div className="w-full">
                  <ItemTable items={items} onItemsChange={setItems} onTotalChange={setTotalToday} />
                </div>
                <BillingSummary
                  subtotal={totalToday}
                  totalToday={amountToPay}
                  onPayNow={handlePaymentInitiation}
                  onShowQr={() => setShowQrModal(true)}
                  hospitalUpiId={appointment?.hospital?.upi_id || hospitalInfo?.upi_id}
                  isPaymentEnabled={isPaymentEnabled}
                  loading={loading}
                  showPayButton={!isAlreadyPaid}
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
            {renderQrModal()}
          </>
        )}
      </main>
    </div>
  );
}

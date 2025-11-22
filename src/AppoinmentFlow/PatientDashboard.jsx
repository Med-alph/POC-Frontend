import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, ClipboardList, UserCircle2 } from "lucide-react";

// Import your API functions, but ensure they use the correct token in headers

const TABS = [
  { label: "Upcoming", icon: CalendarDays },
  { label: "History", icon: ClipboardList },
  { label: "Profile", icon: UserCircle2 },
];

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [patient, setPatient] = useState({});
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const jwt = localStorage.getItem("auth_token");
  if (!jwt) {
    navigate("/landing", { replace: true });
  }
}, [navigate]);

useEffect(() => {
  async function fetchData() {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const headers = { Authorization: `Bearer ${token}` };

      const profileRes = await fetch("http://localhost:9009/auth/profile", { headers });
      if (profileRes.status !== 200) throw new Error("Unauthorized");
      const profile = await profileRes.json();
      setPatient(profile);

      // Repeat for appointments with same headers etc.

    } catch (error) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("isAuthenticated");
      navigate("/landing", { replace: true });
    } finally {
      setLoading(false);
    }
  }
  fetchData();
}, [navigate]);


  const renderTab = () => {
    if (activeTab === 0) {
      // Upcoming
      return (
        <div>
          {appointments.length === 0 ? (
            <p className="text-gray-500">No upcoming appointments.</p>
          ) : appointments.map((appt) => (
            <Card key={appt.id} className="mb-4">
              <CardHeader>
                <CardTitle>
                  {appt.doctor_name} – {appt.department}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>Date: {appt.date}</div>
                <div>Time: {appt.time}</div>
                <div>Status: {appt.status}</div>
                {/* If teleconsultation, show join button */}
                {appt.is_teleconsult && appt.status === "upcoming" && (
                  <Button
                    onClick={() => window.open(appt.video_link, "_blank")}
                    className="mt-2 bg-blue-600 text-white rounded-lg"
                  >
                    Join Video Call
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      );
    } else if (activeTab === 1) {
      // History
      return (
        <div>
          {pastAppointments.length === 0 ? (
            <p className="text-gray-500">No past appointments.</p>
          ) : pastAppointments.map((appt) => (
            <Card key={appt.id} className="mb-4">
              <CardHeader>
                <CardTitle>
                  {appt.doctor_name} – {appt.department}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>Date: {appt.date}</div>
                <div>Time: {appt.time}</div>
                <div>Status: {appt.status}</div>
                <div>Notes: {appt.notes || "N/A"}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    } else {
      // Profile
      return (
        <Card>
          <CardHeader>
            <CardTitle>Patient Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div>Name: {patient.name || patient.patient_name}</div>
            <div>Phone: {patient.phone || patient.contact_info}</div>
            <div>Email: {patient.email || "Not provided"}</div>
            {/* Add more fields as per your schema */}
          </CardContent>
        </Card>
      );
    }
  };

  if (loading)
    return <div className="min-h-screen flex items-center justify-center text-xl">Loading...</div>;

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-900 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex gap-2 mb-4">
          {TABS.map((tab, idx) => (
            <Button
              key={tab.label}
              className={`flex-1 py-3 rounded-xl font-bold transition ${activeTab === idx ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 text-blue-700 dark:text-gray-300"}`}
              onClick={() => setActiveTab(idx)}
            >
              <tab.icon className="inline mb-1 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>
        {renderTab()}
      </div>
    </div>
  );
}

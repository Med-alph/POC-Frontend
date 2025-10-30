import { useEffect, useState } from "react";
import appointmentsAPI from "../api/AppointmentsAPI";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function FulfilledRecords() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFulfilledAppointments = async () => {
      try {
        setLoading(true);
        const response = await appointmentsAPI.getFulfilledAppointments();
        setAppointments(response.appointments || []);
      } catch (err) {
        toast.error("Failed to load fulfilled appointments");
      } finally {
        setLoading(false);
      }
    };
    fetchFulfilledAppointments();
  }, []);

  function ViewRecord(patientId) {
    navigate("/doctor-patient-record/" + patientId);
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow max-w-5xl mx-auto mt-10">
      <h1 className="text-3xl font-semibold mb-6 text-gray-900 border-b pb-3">
        Fulfilled Patient Records
      </h1>

      {loading ? (
        <p className="text-center text-gray-500 text-lg">Loading records...</p>
      ) : appointments.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">No fulfilled appointments found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-md shadow-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 border-b border-gray-200 text-gray-700 font-semibold text-sm">
                  Patient Name
                </th>
                <th className="text-left px-6 py-3 border-b border-gray-200 text-gray-700 font-semibold text-sm">
                  Date
                </th>
                <th className="text-left px-6 py-3 border-b border-gray-200 text-gray-700 font-semibold text-sm">
                  Time
                </th>
                <th className="px-6 py-3 border-b border-gray-200"></th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt) => (
                <tr
                  key={apt.id}
                  className="hover:bg-gray-100 transition-colors duration-200"
                >
                  <td className="px-6 py-4 border-b border-gray-200 text-gray-800 whitespace-nowrap">
                    {apt.patient_name || "Unknown"}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-gray-600 whitespace-nowrap">
                    {apt.appointment_date}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-gray-600 whitespace-nowrap">
                    {apt.appointment_time}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-right">
                    <button
                      onClick={() => ViewRecord(apt.patient_id)}
                      className="inline-block px-4 py-1 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                      aria-label={`View record of ${apt.patient_name}`}
                    >
                      View Record
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

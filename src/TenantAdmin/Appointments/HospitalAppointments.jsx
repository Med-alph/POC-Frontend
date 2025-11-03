import React, { useState, useEffect } from "react";
import hospitalsapi from "../../api/hospitalsAPI";
import toast from "react-hot-toast";
import appointmentsAPI from "../../API/AppointmentsAPI";

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString();
}

function formatTime(timeStr) {
  if (!timeStr) return "-";
  const [hour, minute] = timeStr.split(":");
  const date = new Date();
  date.setHours(parseInt(hour, 10), parseInt(minute, 10));
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const HospitalAppointments = () => {
  const [hospitals, setHospitals] = useState([]);
  const [expandedHospitalIds, setExpandedHospitalIds] = useState([]);
  const [hospitalAppointments, setHospitalAppointments] = useState({});
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [editAppointment, setEditAppointment] = useState(null);
  const [dialogKey, setDialogKey] = useState(0);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchHospitals = async () => {
      setLoadingHospitals(true);
      try {
        const data = await hospitalsapi.getByTenant();
        setHospitals(data);
      } catch (error) {
        toast.error("Failed to fetch hospitals: " + error.message);
      } finally {
        setLoadingHospitals(false);
      }
    };
    fetchHospitals();
  }, []);

  const fetchAppointmentsByHospital = async (hospitalId) => {
    console.log("Fetching appointments for hospital:", hospitalId);
    if (!hospitalId) {
      console.warn("No hospitalId supplied to fetchAppointmentsByHospital");
      return;
    }
    setLoadingAppointments((prev) => ({ ...prev, [hospitalId]: true }));
    try {
      const response = await appointmentsAPI.getByHospital(hospitalId);
      console.log("Appointments received:", response.data);
      setHospitalAppointments((prev) => ({ ...prev, [hospitalId]: response.data }));
    } catch (error) {
      toast.error("Failed to load appointments: " + error.message);
    } finally {
      setLoadingAppointments((prev) => ({ ...prev, [hospitalId]: false }));
    }
  };

  const toggleHospital = (id) => {
    if (expandedHospitalIds.includes(id)) {
      setExpandedHospitalIds((curr) => curr.filter((hid) => hid !== id));
    } else {
      setExpandedHospitalIds((curr) => [...curr, id]);
      if (!hospitalAppointments[id]) {
        fetchAppointmentsByHospital(id);
      }
    }
  };

  const openCreateAppointmentDialog = (hospitalId) => {
    setEditAppointment(null);
    setSelectedHospitalId(hospitalId);
    setDialogKey((prev) => prev + 1);
    setDialogOpen(true);
  };

  const openEditAppointmentDialog = (hospitalId, appointment) => {
    setEditAppointment(appointment);
    setSelectedHospitalId(hospitalId);
    setDialogKey((prev) => prev + 1);
    setDialogOpen(true);
  };

  const handleAppointmentSaved = async () => {
    if (selectedHospitalId) {
      await fetchAppointmentsByHospital(selectedHospitalId);
    }
  };

  const openDeleteModal = (appointment) => {
    setAppointmentToDelete(appointment);
    setSelectedHospitalId(appointment.hospital_id); // Important for refresh
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    console.log("Deleting appointment for hospital:", selectedHospitalId);
    if (!appointmentToDelete) return;
    setDeleting(true);
    try {
      await appointmentsAPI.delete(appointmentToDelete.id);
      toast.success(`Appointment ${appointmentToDelete.id} deleted successfully.`);
      setDeleteModalOpen(false);
      setAppointmentToDelete(null);
      if (selectedHospitalId) {
        await fetchAppointmentsByHospital(selectedHospitalId);
      }
    } catch (error) {
      toast.error("Failed to delete appointment: " + error.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loadingHospitals)
    return <div className="text-center py-10 text-gray-600">Loading hospitals...</div>;

  if (!hospitals.length)
    return <div className="text-center py-10 text-gray-600">No hospitals found for this tenant.</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 relative">
      <h2 className="text-3xl font-semibold text-gray-900">Hospitals & Appointments</h2>
      {hospitals.map(({ id, name }) => {
        const isExpanded = expandedHospitalIds.includes(id);
        let appointments = hospitalAppointments[id] || [];
        if (!Array.isArray(appointments)) appointments = [];
        const appointmentsLoading = loadingAppointments[id];
        return (
          <section
            key={id}
            className="border rounded-lg shadow-sm overflow-hidden"
            aria-labelledby={`hospital-${id}`}
          >
            <button
              type="button"
              id={`hospital-${id}`}
              onClick={() => toggleHospital(id)}
              className="w-full flex justify-between items-center px-6 py-4 font-semibold text-lg text-left text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              aria-expanded={isExpanded}
              aria-controls={`hospital-panel-${id}`}
            >
              <span>{name}</span>
              <svg
                className={`w-5 h-5 transform transition-transform duration-300 ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isExpanded && (
              <div
                id={`hospital-panel-${id}`}
                className="bg-white px-6 pt-4 pb-6"
                role="region"
                aria-labelledby={`hospital-${id}`}
              >
                <div className="mb-4">
                  {/* Uncomment below if you want add appointment button */}
                  {/* <button
                    onClick={() => openCreateAppointmentDialog(id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 transition"
                  >
                    + Add Appointment
                  </button> */}
                </div>
                {appointmentsLoading ? (
                  <p className="text-center py-5 text-gray-500 italic">Loading Appointments...</p>
                ) : appointments.length === 0 ? (
                  <p className="text-center py-5 text-gray-500 italic">
                    No Appointments found for this hospital.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Appointment ID</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Patient Name</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Time</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Doctor Name</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Department</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Staff Contact</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Patient Contact</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {appointments.map((appt) => (
                          <tr key={appt.id} className="bg-white hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-gray-900">{appt.id}</td>
                            <td className="px-4 py-3 whitespace-nowrap font-semibold">{appt.patient?.patient_name || appt.patient_name || "-"}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{formatDate(appt.appointment_date)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{formatTime(appt.appointment_time)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{appt.status || "-"}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{appt.staff?.staff_name || appt.staff_name || "-"}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{appt.staff?.department || "-"}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{appt.staff?.contact_info || "-"}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{appt.patient?.contact_info || "-"}</td>
                            <td className="px-4 py-3 whitespace-nowrap space-x-2">
                              {/* <button
                                onClick={() => openEditAppointmentDialog(id, appt)}
                                className="text-blue-600 hover:text-blue-800"
                                aria-label={`Edit appointment ${appt.id}`}
                              >
                                ✏️
                              </button> */}
                              <button
                                onClick={() => openDeleteModal(appt)}
                                className="text-red-600 hover:text-red-800"
                                aria-label={`Delete appointment ${appt.id}`}
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })}
      {dialogOpen && (
        <CreateAppointmentDialog
          key={dialogKey}
          hospitalId={selectedHospitalId}
          open={dialogOpen}
          setOpen={setDialogOpen}
          onAdd={handleAppointmentSaved}
          editAppointment={editAppointment}
        />
      )}

      {deleteModalOpen && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            zIndex: 9999,
            width: "320px",
            backgroundColor: "white",
            border: "1px solid #d1d5db",
            borderRadius: "0.5rem",
            boxShadow: "0 10px 15px rgba(0,0,0,0.1)",
            padding: "1.5rem",
            transform: "translate(-50%, -50%)",
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <h3 id="delete-dialog-title" className="text-lg font-semibold mb-4">
            Confirm Delete
          </h3>
          <p className="mb-6">
            Are you sure you want to delete appointment{" "}
            <strong>{appointmentToDelete?.id}</strong>?
          </p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-100"
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirmed}
              disabled={deleting}
              className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 flex items-center justify-center min-w-[90px]"
            >
              {deleting && (
                <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></span>
              )}
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalAppointments;

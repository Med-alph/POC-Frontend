import React, { useState, useEffect } from "react";
import hospitalsapi from "../../api/hospitalsapi";
import toast from "react-hot-toast";
import CreatePatientsDialog from "../../Patients/AddPatient";
import EditPatientDialog from "./EditPatientDialog";
import patientsAPI from "../../api/patientsapi";

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString();
}

const HospitalPatients = () => {
  const [hospitals, setHospitals] = useState([]);
  const [expandedHospitalIds, setExpandedHospitalIds] = useState([]);
  const [hospitalPatients, setHospitalPatients] = useState({});
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState({});
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [editPatient, setEditPatient] = useState(null);
  const [dialogKey, setDialogKey] = useState(0);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
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

  const fetchPatientsByHospital = async (hospitalId) => {
    setLoadingPatients((prev) => ({ ...prev, [hospitalId]: true }));
    try {
      const response = await patientsAPI.getByHospital(hospitalId);
      setHospitalPatients((prev) => ({ ...prev, [hospitalId]: response.data }));
    } catch (error) {
      toast.error("Failed to load patients: " + error.message);
    } finally {
      setLoadingPatients((prev) => ({ ...prev, [hospitalId]: false }));
    }
  };

  const toggleHospital = (id) => {
    if (expandedHospitalIds.includes(id)) {
      setExpandedHospitalIds((curr) => curr.filter((hid) => hid !== id));
    } else {
      setExpandedHospitalIds((curr) => [...curr, id]);
      if (!hospitalPatients[id]) {
        fetchPatientsByHospital(id);
      }
    }
  };

  // Updated onAdd to call create API
  const handlePatientSaved = async (patientData) => {
    try {
      await patientsAPI.create(patientData);
      toast.success("Patient created successfully");
      setAddDialogOpen(false);
      await fetchPatientsByHospital(selectedHospitalId);
    } catch (error) {
      toast.error("Failed to create patient: " + error.message);
    }
  };

  const openCreatePatientDialog = (hospitalId) => {
    setEditPatient(null);
    setSelectedHospitalId(hospitalId);
    setDialogKey((prev) => prev + 1);
    setAddDialogOpen(true);
  };

  const openEditPatientDialog = (hospitalId, patient) => {
    setEditPatient(patient);
    setSelectedHospitalId(hospitalId);
    setDialogKey((prev) => prev + 1);
    setEditDialogOpen(true);
  };

  const handlePatientUpdated = async (patientId, patientData) => {
    try {
      await patientsAPI.update(patientId, patientData);
      toast.success("Patient updated successfully");
      setEditDialogOpen(false);
      await fetchPatientsByHospital(selectedHospitalId);
    } catch (error) {
      toast.error("Failed to update patient: " + error.message);
    }
  };

  const openDeleteModal = (patient) => {
    setPatientToDelete(patient);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!patientToDelete) return;
    setDeleting(true);
    try {
      await patientsAPI.delete(patientToDelete.id);
      toast.success(`Patient "${patientToDelete.patient_name}" deleted successfully.`);
      await fetchPatientsByHospital(selectedHospitalId);
    } catch (error) {
      toast.error("Failed to delete patient: " + error.message);
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
      setPatientToDelete(null);
    }
  };

  if (loadingHospitals)
    return <div className="text-center py-10 text-gray-600">Loading hospitals...</div>;
  if (!hospitals.length)
    return <div className="text-center py-10 text-gray-600">No hospitals found for this tenant.</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 relative">
      <h2 className="text-3xl font-semibold text-gray-900">Hospitals & Patients</h2>
      {hospitals.map(({ id, name }) => {
        const isExpanded = expandedHospitalIds.includes(id);
        let patients = hospitalPatients[id] || [];
        if (!Array.isArray(patients)) patients = [];
        const patientsLoading = loadingPatients[id];
        return (
          <section key={id} className="border rounded-lg shadow-sm overflow-hidden" aria-labelledby={`hospital-${id}`}>
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
                className={`w-5 h-5 transform transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isExpanded && (
              <div id={`hospital-panel-${id}`} className="bg-white px-6 pt-4 pb-6" role="region" aria-labelledby={`hospital-${id}`}>
                <div className="mb-4">
                  <button
                    onClick={() => openCreatePatientDialog(id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 transition"
                  >
                    + Add Patient
                  </button>
                </div>
                {patientsLoading ? (
                  <p className="text-center py-5 text-gray-500 italic">Loading Patients...</p>
                ) : patients.length === 0 ? (
                  <p className="text-center py-5 text-gray-500 italic">No Patients found for this hospital.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Patient Code</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">DOB</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Address</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Insurance Provider</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Medical History</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Allergies</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {patients.map((patient) => (
                          <tr key={patient.id} className="bg-white hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-gray-900">{patient.patient_code || "-"}</td>
                            <td className="px-4 py-3 whitespace-nowrap font-semibold">{patient.patient_name || "-"}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{formatDate(patient.dob)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{patient.email || "-"}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{patient.address || "-"}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{patient.insurance_provider || "-"}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{patient.medical_history || "-"}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{patient.allergies || "-"}</td>
                            <td className="px-4 py-3 whitespace-nowrap space-x-2">
                              <button
                                onClick={() => openEditPatientDialog(id, patient)}
                                className="text-blue-600 hover:text-blue-800"
                                aria-label={`Edit ${patient.patient_name}`}
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => {
                                  setPatientToDelete(patient);
                                  setDeleteModalOpen(true);
                                }}
                                className="text-red-600 hover:text-red-800"
                                aria-label={`Delete ${patient.patient_name}`}
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
      {addDialogOpen && (
        <CreatePatientsDialog
          key={dialogKey}
          hospitalId={selectedHospitalId}
          open={addDialogOpen}
          setOpen={setAddDialogOpen}
          onAdd={handlePatientSaved}
          editPatient={editPatient}
        />
      )}
      {editDialogOpen && (
        <EditPatientDialog
          key={dialogKey}
          open={editDialogOpen}
          setOpen={setEditDialogOpen}
          onUpdate={handlePatientUpdated}
          editPatient={editPatient}
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
            Are you sure you want to delete "<strong>{patientToDelete?.patient_name}</strong>"?
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
              className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 flex items-center justify-center min-w-[90px]"
              disabled={deleting}
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

export default HospitalPatients;

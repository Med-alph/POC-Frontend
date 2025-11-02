import React, { useState, useEffect } from "react";
import hospitalsapi from "../../api/hospitalsAPI";

import toast from "react-hot-toast";
import CreatePatientsDialog from "../../Patients/AddPatient"; // Adjust if needed
import patientsAPI from "../../API/PatientsAPI";

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [editPatient, setEditPatient] = useState(null);
  const [dialogKey, setDialogKey] = useState(0);

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

  const openCreatePatientDialog = (hospitalId) => {
    setEditPatient(null);
    setSelectedHospitalId(hospitalId);
    setDialogKey((prev) => prev + 1);
    setDialogOpen(true);
  };

  const openEditPatientDialog = (hospitalId, patient) => {
    setEditPatient(patient);
    setSelectedHospitalId(hospitalId);
    setDialogKey((prev) => prev + 1);
    setDialogOpen(true);
  };

  const handlePatientSaved = async () => {
    await fetchPatientsByHospital(selectedHospitalId);
  };

  if (loadingHospitals)
    return <div className="text-center py-10 text-gray-600">Loading hospitals...</div>;
  if (!hospitals.length)
    return <div className="text-center py-10 text-gray-600">No hospitals found for this tenant.</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
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
                                onClick={() => alert(`Delete patient ${patient.id} coming soon`)}
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
      {dialogOpen && (
        <CreatePatientsDialog
          key={dialogKey}
          hospitalId={selectedHospitalId}
          open={dialogOpen}
          setOpen={setDialogOpen}
          onAdd={handlePatientSaved}
          editPatient={editPatient}
        />
      )}
    </div>
  );
};

export default HospitalPatients;

import React, { useState, useEffect } from "react";
import hospitalsapi from "../../api/hospitalsAPI";
import staffApi from "../../api/staffapi";
import toast from "react-hot-toast";
import CreateStaffDialog from "../../Staff/AddStaff";

function formatAvailability(availString) {
  if (!availString) return "-";
  let obj;
  try {
    obj = typeof availString === "string" ? JSON.parse(availString) : availString;
  } catch {
    return "-";
  }
  if (!obj || typeof obj !== "object") return "-";
  return Object.entries(obj)
    .map(([day, time]) =>
      <span key={day} className="block"><span className="font-medium">{day[0].toUpperCase() + day.slice(1)}:</span> <span>{time}</span></span>
    );
}

const StaffsRolesTab = () => {
  const [hospitals, setHospitals] = useState([]);
  const [expandedHospitalIds, setExpandedHospitalIds] = useState([]);
  const [hospitalStaffs, setHospitalStaffs] = useState({});
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [loadingStaffs, setLoadingStaffs] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [editStaff, setEditStaff] = useState(null);
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

  const fetchStaffsByHospital = async (hospitalId) => {
    setLoadingStaffs((prev) => ({ ...prev, [hospitalId]: true }));
    try {
      const response = await staffApi.getAll({ hospital_id: hospitalId });
      const staffs = response?.data || [];
      setHospitalStaffs((prev) => ({ ...prev, [hospitalId]: staffs }));
    } catch (error) {
      toast.error("Failed to load staffs for hospital: " + error.message);
    } finally {
      setLoadingStaffs((prev) => ({ ...prev, [hospitalId]: false }));
    }
  };

  const toggleHospital = (id) => {
    if (expandedHospitalIds.includes(id)) {
      setExpandedHospitalIds((curr) => curr.filter((hid) => hid !== id));
    } else {
      setExpandedHospitalIds((curr) => [...curr, id]);
      if (!hospitalStaffs[id]) {
        fetchStaffsByHospital(id);
      }
    }
  };

  const openCreateStaffDialog = (hospitalId) => {
    setEditStaff(null);
    setSelectedHospitalId(hospitalId);
    setDialogKey((prev) => prev + 1);
    setDialogOpen(true);
  };

  const openEditStaffDialog = (hospitalId, staff) => {
    setEditStaff(staff);
    setSelectedHospitalId(hospitalId);
    setDialogKey((prev) => prev + 1);
    setDialogOpen(true);
  };

  const handleStaffSaved = async () => {
    await fetchStaffsByHospital(selectedHospitalId);
  };

  if (loadingHospitals)
    return <div className="text-center py-10 text-gray-600">Loading hospitals...</div>;
  if (!hospitals.length)
    return <div className="text-center py-10 text-gray-600">No hospitals found for this tenant.</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <h2 className="text-3xl font-semibold text-gray-900">Hospitals & Staff</h2>
      {hospitals.map(({ id, name, email, address }) => {
        const isExpanded = expandedHospitalIds.includes(id);
        const staffs = hospitalStaffs[id] || [];
        const staffsLoading = loadingStaffs[id];
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3 text-gray-700 mb-4">
                  <div>
                    <strong>Email:</strong> {email || "-"}
                  </div>
                  <div>
                    <strong>Address:</strong> {address || "-"}
                  </div>
                </div>
                <div className="mb-4">
                  <button
                    onClick={() => openCreateStaffDialog(id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 transition"
                  >
                    + Create Staff
                  </button>
                </div>
                {staffsLoading ? (
                  <p className="text-center py-5 text-gray-500 italic">
                    Loading staffs...
                  </p>
                ) : staffs.length === 0 ? (
                  <p className="text-center py-5 text-gray-500 italic">
                    No staffs found for this hospital.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Staff Code</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Staff Name</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Department</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Designation</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Contact Info</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Experience (years)</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Availability</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {staffs.map((staff) => (
                          <tr key={staff.id} className="bg-white hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-gray-900 font-medium">{staff.staff_code || "-"}</td>
                            <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-800">{staff.staff_name}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-700">{staff.department || "-"}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-700">{staff.designation?.name || "-"}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-700">{staff.contact_info || "-"}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-700">{staff.email || "-"}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-700">{staff.experience != null ? staff.experience : "-"}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-700">{staff.status || "-"}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                              <div className="whitespace-pre-line text-xs">{formatAvailability(staff.availability)}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap space-x-2">
                              <button
                                onClick={() => openEditStaffDialog(id, staff)}
                                className="text-blue-600 hover:text-blue-800"
                                aria-label={`Edit ${staff.staff_name}`}
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => alert(`Delete staff ${staff.id} coming soon`)}
                                className="text-red-600 hover:text-red-800"
                                aria-label={`Delete ${staff.staff_name}`}
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
        <CreateStaffDialog
          key={dialogKey} 
          hospitalId={selectedHospitalId}
          open={dialogOpen}
          setOpen={setDialogOpen}
          onAdd={handleStaffSaved}
          editStaff={editStaff}
        />
      )}
    </div>
  );
};
export default StaffsRolesTab;

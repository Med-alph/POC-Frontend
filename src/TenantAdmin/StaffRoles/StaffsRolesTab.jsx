import React, { useState, useEffect } from "react";
import hospitalsapi from "../../api/hospitalsapi";
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
  return Object.entries(obj).map(([day, time]) =>
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

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
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

  // Show delete confirmation modal
  const confirmDeleteStaff = (staff, hospitalId, event) => {
    event.preventDefault();
    event.stopPropagation();
    setStaffToDelete({ ...staff, hospitalId });
    setDeleteModalOpen(true);
  };

  // Delete staff handler with inline loader
  const handleDeleteConfirmed = async () => {
    if (!staffToDelete) return;
    setDeleting(true);
    try {
      await staffApi.softDelete(staffToDelete.id);
      toast.success(`Staff "${staffToDelete.staff_name}" deleted successfully.`);
      await fetchStaffsByHospital(staffToDelete.hospitalId);
    } catch (error) {
      toast.error("Failed to delete staff: " + error.message);
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
      setStaffToDelete(null);
    }
  };

  if (loadingHospitals)
    return <div className="text-center py-10 text-gray-600">Loading hospitals...</div>;
  if (!hospitals.length)
    return <div className="text-center py-10 text-gray-600">No hospitals found for this tenant.</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 relative">
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
                  <p className="text-center py-5 text-gray-500 italic">Loading staffs...</p>
                ) : staffs.length === 0 ? (
                  <p className="text-center py-5 text-gray-500 italic">No staffs found for this hospital.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Staff Code</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Staff Name</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Department</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Designation</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Assigned Role</th>
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
                            <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                              {staff.roles && staff.roles.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {staff.roles.map((role, index) => (
                                    <span 
                                      key={role.id || index}
                                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                    >
                                      {role.name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400 italic">No role assigned</span>
                              )}
                            </td>
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
                                onClick={(e) => confirmDeleteStaff(staff, id, e)}
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

      {/* Centered delete confirmation modal with delete button loader */}
      {deleteModalOpen && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            zIndex: 1000,
            width: "320px",
            backgroundColor: "white",
            border: "1px solid #d1d5db", // Tailwind gray-300
            borderRadius: "0.5rem",
            boxShadow: "0 10px 15px rgba(0,0,0,0.1)",
            padding: "1.5rem",
            transform: "translate(-50%,-50%)",
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <h3 id="delete-dialog-title" className="text-lg font-semibold mb-4">
            Confirm Delete
          </h3>
          <p className="mb-6">
            Are you sure you want to delete "<strong>{staffToDelete?.staff_name}</strong>"?
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
                <span
                  className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"
                  style={{
                    borderWidth: "2px",
                    borderTopColor: "transparent",
                    marginRight: "0.5rem",
                  }}
                ></span>
              )}
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffsRolesTab;

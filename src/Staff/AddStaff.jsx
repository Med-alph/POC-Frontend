import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { Clock, AlertCircle } from "lucide-react";
import designationapi from "@/api/designationapi";
import staffApi from "@/api/staffapi";
import { rolesAPI } from "@/api/rolesapi";
import RoleAssignmentDropdown from "../TenantAdmin/RoleManagement/RoleAssignmentDropdown";

const WEEKDAYS = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

// Utility to convert string like "monday" or "MONDAY" to "Monday"
const toTitleCase = (str) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

// Normalize time string to "HH:MM-HH:MM" format
const normalizeTime = (timeStr) => {
  if (!timeStr) return "";
  const parts = timeStr.split("-");
  if (parts.length !== 2) return timeStr; // fallback, do not break
  const pad = (str) => {
    if (str.includes(":")) return str;
    // Pad single digit hour with zero and add ":00"
    const trimmed = str.trim();
    if (/^\d{1,2}$/.test(trimmed)) {
      return (trimmed.length === 1 ? "0" + trimmed : trimmed) + ":00";
    }
    return str; // fallback
  };
  return `${pad(parts[0])}-${pad(parts[1])}`;
};

export default function CreateStaffDialog({ hospitalId, onAdd, open, setOpen, editStaff }) {
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState({});
  const [formData, setFormData] = useState({
    staff_name: "",
    department: "",
    contact_info: "",
    email: "",
    password: "",
    experience: "",
    designation: "",
    role_id: "", // Add role assignment
    availability: {},
    is_archived: false,
    status: "Active",
  });
  const [availabilityErrors, setAvailabilityErrors] = useState({});

  useEffect(() => {
    async function loadDesignations() {
      try {
        const data = await designationapi.getAllGrouped();
        setDesignations(data);
        setDepartments(Object.keys(data));
      } catch (err) {
        toast.error("Failed to load designations");
      }
    }
    if (open) {
      loadDesignations();
    }
  }, [open]);

  useEffect(() => {
    if (open && editStaff) {
      // Parse & normalize availability keys and time strings
      let availabilityObj = {};
      if (editStaff.availability) {
        try {
          const rawAvail = JSON.parse(editStaff.availability);
          Object.entries(rawAvail).forEach(([key, value]) => {
            const titleKey = toTitleCase(key);
            availabilityObj[titleKey] = normalizeTime(value);
          });
        } catch (e) {
          availabilityObj = {};
        }
      }

      // Get the first role ID if roles exist
      let roleId = "none";
      if (editStaff.roles && editStaff.roles.length > 0) {
        roleId = editStaff.roles[0].id.toString();
      }

      setFormData({
        staff_name: editStaff.staff_name || "",
        department: editStaff.department || "",
        contact_info: editStaff.contact_info || "",
        email: editStaff.email || "",
        password: "",
        experience: editStaff.experience != null ? editStaff.experience.toString() : "",
        designation: editStaff.designation_id ? editStaff.designation_id.toString() : "",
        role_id: roleId,
        availability: availabilityObj,
        is_archived: editStaff.is_archived || false,
        status:
          editStaff.status?.charAt(0).toUpperCase() + editStaff.status?.slice(1) || "Active",
      });
      setAvailabilityErrors({});
    }
  }, [open, editStaff]);

  useEffect(() => {
    if (!open || (!editStaff && open)) {
      setFormData({
        staff_name: "",
        department: "",
        contact_info: "",
        email: "",
        password: "",
        experience: "",
        designation: "",
        role_id: "none",
        availability: {},
        is_archived: false,
        status: "Active",
      });
      setAvailabilityErrors({});
    }
  }, [open, editStaff]);

  const validateTimeFormat = (time) => /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/.test(time);

  const validateTimeSlot = (slot) => {
    if (!slot || slot.trim() === "") return { isValid: true, error: null };
    const trimmedSlot = slot.trim();
    if (!trimmedSlot.includes("-"))
      return { isValid: false, error: "Use format HH:MM-HH:MM (e.g., 09:00-14:00)" };
    const [startTime, endTime] = trimmedSlot.split("-").map((t) => t.trim());
    if (!validateTimeFormat(startTime))
      return {
        isValid: false,
        error: `Invalid start time: ${startTime}. Use 24hr format (e.g., 09:00)`,
      };
    if (!validateTimeFormat(endTime))
      return {
        isValid: false,
        error: `Invalid end time: ${endTime}. Use 24hr format (e.g., 14:00)`,
      };
    const startMinutes = parseInt(startTime.split(":")[0]) * 60 + parseInt(startTime.split(":")[1]);
    const endMinutes = parseInt(endTime.split(":")[0]) * 60 + parseInt(endTime.split(":")[1]);
    if (endMinutes <= startMinutes) return { isValid: false, error: "End time must be after start time" };
    return { isValid: true, error: null };
  };

  const ensureTimeIn24HourFormat = (timeSlot) => (!timeSlot || timeSlot.trim() === "" ? "" : timeSlot.trim());

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDepartmentChange = (value) => setFormData((prev) => ({ ...prev, department: value, designation: "" }));

  const handleDesignationChange = (value) => setFormData((prev) => ({ ...prev, designation: value }));

  const handleAvailabilityChange = (day, slot) => {
    const validation = validateTimeSlot(slot);
    setAvailabilityErrors((prev) => ({ ...prev, [day]: validation.error }));
    setFormData((prev) => ({
      ...prev,
      availability: { ...prev.availability, [day]: slot },
    }));
  };

  const copyToWeekdays = (sourceDay) => {
    const sourceTime = formData.availability[sourceDay];
    if (!sourceTime) return toast.error("Please enter a time slot first");
    const validation = validateTimeSlot(sourceTime);
    if (!validation.isValid) return toast.error("Please fix the time format before copying");
    const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const newAvailability = { ...formData.availability };
    weekdays.forEach((day) => {
      newAvailability[day] = sourceTime;
    });
    setFormData((prev) => ({ ...prev, availability: newAvailability }));
    const newErrors = { ...availabilityErrors };
    weekdays.forEach((day) => {
      delete newErrors[day];
    });
    setAvailabilityErrors(newErrors);
    toast.success("Time copied to all weekdays");
  };

  const copyToWeekend = (sourceDay) => {
    const sourceTime = formData.availability[sourceDay];
    if (!sourceTime) return toast.error("Please enter a time slot first");
    const validation = validateTimeSlot(sourceTime);
    if (!validation.isValid) return toast.error("Please fix the time format before copying");
    const weekend = ["Saturday", "Sunday"];
    const newAvailability = { ...formData.availability };
    weekend.forEach((day) => {
      newAvailability[day] = sourceTime;
    });
    setFormData((prev) => ({ ...prev, availability: newAvailability }));
    const newErrors = { ...availabilityErrors };
    weekend.forEach((day) => {
      delete newErrors[day];
    });
    setAvailabilityErrors(newErrors);
    toast.success("Time copied to weekend");
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.staff_name.trim()) errors.push("Staff name is required");
    if (!formData.department) errors.push("Department is required");
    if (!formData.designation) errors.push("Designation is required");
    // Role assignment is now optional - only validate if provided
    if (!formData.contact_info.trim()) errors.push("Contact information is required");
    if (!formData.email || !formData.email.trim()) errors.push("Email is required");
    if (formData.email && !isValidEmail(formData.email)) errors.push("Invalid email format");
    if (formData.experience && isNaN(Number(formData.experience))) errors.push("Experience must be a number");

    let hasAvailability = false;
    const availabilityValidationErrors = {};
    WEEKDAYS.forEach((day) => {
      const slot = formData.availability[day];
      if (slot && slot.trim() !== "") {
        hasAvailability = true;
        const validation = validateTimeSlot(slot);
        if (!validation.isValid) {
          availabilityValidationErrors[day] = validation.error;
          errors.push(`${day}: ${validation.error}`);
        }
      }
    });
    if (!hasAvailability) errors.push("Please specify availability for at least one day");
    setAvailabilityErrors(availabilityValidationErrors);
    return errors;
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submit triggered");
    if (editStaff) console.log("Editing staff:", editStaff.id);
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      console.log("Validation errors: \n", validationErrors);
      toast.error(validationErrors[0]);
      return;
    }
    try {
      const availabilityObject = {};
      WEEKDAYS.forEach((day) => {
        const slot = formData.availability[day];
        if (slot && slot.trim() !== "") {
          availabilityObject[day] = ensureTimeIn24HourFormat(slot);
        }
      });

      // Prepare payload without role_id for staff API
      const payload = {
        hospital_id: hospitalId,
        staff_name: formData.staff_name.trim(),
        department: formData.department,
        designation_id: formData.designation,
        contact_info: formData.contact_info.trim(),
        email: formData.email.trim() || null,
        ...(editStaff ? (formData.password ? { password: formData.password } : {}) : { password: formData.password }),
        experience: formData.experience ? Number(formData.experience) : 0,
        availability: JSON.stringify(availabilityObject),
        is_archived: false,
        status: formData.status?.toLowerCase() || "active",
      };
      console.log("Payload: \n", payload);
      console.log("Role ID for assignment:", formData.role_id);
      console.log("Role ID is valid:", formData.role_id && formData.role_id.trim() !== "" && formData.role_id !== "none");

      let saved;
      let roleAssignmentSuccess = true;

      if (editStaff) {
        // Update staff basic info
        saved = await staffApi.update(editStaff.id, payload);

        // Separately assign role if role_id is provided and valid (not "none")
        if (formData.role_id && formData.role_id.trim() !== "" && formData.role_id !== "none") {
          try {
            console.log('Attempting role assignment with role_id:', formData.role_id);
            console.log('Staff ID:', editStaff.id);
            await rolesAPI.assignRoleToStaff(editStaff.id, formData.role_id); // Send as string, not number
            console.log('Role assigned successfully');
          } catch (roleError) {
            console.error('Failed to assign role:', roleError);
            roleAssignmentSuccess = false;
          }
        }

        if (roleAssignmentSuccess || !formData.role_id || formData.role_id === "none") {
          toast.success(`Staff updated successfully!`);
        } else {
          toast.error('Staff updated but role assignment failed. Please assign role manually.');
        }
      } else {
        // Create new staff
        saved = await staffApi.create(payload);

        // Assign role to newly created staff if role_id is provided and valid (not "none")
        if (formData.role_id && formData.role_id.trim() !== "" && formData.role_id !== "none" && saved.id) {
          try {
            console.log('Attempting role assignment for new staff with role_id:', formData.role_id);
            console.log('New staff ID:', saved.id);
            await rolesAPI.assignRoleToStaff(saved.id, formData.role_id); // Send as string, not number
            console.log('Role assigned to new staff');
          } catch (roleError) {
            console.error('Failed to assign role to new staff:', roleError);
            roleAssignmentSuccess = false;
          }
        }

        if (roleAssignmentSuccess || !formData.role_id || formData.role_id === "none") {
          toast.success(`Staff created successfully!`);
        } else {
          toast.error('Staff created but role assignment failed. Please assign role manually.');
        }
      }

      onAdd(saved);
      setOpen(false);
    } catch (error) {
      console.error('Staff operation error:', error);
      toast.error(`Failed to ${editStaff ? "update" : "create"} staff: ${error.message || "Unknown error"}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[700px] h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-semibold">{editStaff ? "Edit Staff" : "Create New Staff"}</DialogTitle>
          <DialogDescription id="staff-form-dialog-description">
            {editStaff ? "Update staff member information and role assignment." : "Create a new staff member with role assignment."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto mt-4 pr-2 space-y-1">
          <form id="staff-form" onSubmit={handleSubmit} className="space-y-4" aria-describedby="staff-form-dialog-description">
            {/* Basic Information */}
            <div className="space-y-4 pb-4 border-b">
              <h3 className="font-semibold text-sm text-gray-700">Basic Information</h3>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">
                  Staff Name <span className="text-red-500">*</span>
                </label>
                <Input name="staff_name" placeholder="Enter full name" value={formData.staff_name} onChange={handleChange} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <Select onValueChange={handleDepartmentChange} value={formData.department}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dep) => (
                        <SelectItem key={dep} value={dep}>
                          {dep}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">
                    Designation <span className="text-red-500">*</span>
                  </label>
                  <Select onValueChange={handleDesignationChange} value={formData.designation} disabled={!formData.department}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Designation" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.department &&
                        designations[formData.department]?.map((designation) => (
                          <SelectItem key={designation.id.toString()} value={designation.id.toString()}>
                            {designation.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <Input name="contact_info" placeholder="+91 1234567890" value={formData.contact_info} onChange={handleChange} required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input type="email" name="email" placeholder="email@example.com" value={formData.email} onChange={handleChange} required />
              </div>

              {/* Role Assignment */}
              <div>
                <RoleAssignmentDropdown
                  value={formData.role_id}
                  onChange={(roleId) => setFormData(prev => ({ ...prev, role_id: roleId }))}
                  required={false}
                  label="Assign Role (Optional)"
                  placeholder="Select a role for this staff member"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Experience (Years)</label>
                <Input
                  type="number"
                  name="experience"
                  placeholder="0"
                  min="0"
                  max="50"
                  value={formData.experience}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Availability Section */}
            <div className="space-y-4 pb-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-gray-700">
                  Weekly Availability <span className="text-red-500">*</span>
                </h3>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>24-hour format</span>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-800">
                    <p className="font-medium mb-1">Time Format Instructions:</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                      <li>
                        Use 24-hour format: <code className="bg-blue-100 px-1 rounded">09:00-14:00</code>
                      </li>
                      <li>Start and end times must be HH:MM (e.g., 09:00, not 9:00)</li>
                      <li>End time must be after start time</li>
                      <li>Leave blank for days off</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Weekdays */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm text-gray-700">Weekdays</p>
                  {formData.availability["Monday"] && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToWeekdays("Monday")}
                      className="text-xs h-7"
                    >
                      Copy Monday to All Weekdays
                    </Button>
                  )}
                </div>
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                  <div key={day} className="space-y-1">
                    <div className="flex gap-2 items-center">
                      <span className="text-sm font-medium text-gray-600 min-w-[100px]">{day}:</span>
                      <Input
                        type="text"
                        placeholder="09:00-14:00"
                        value={formData.availability[day] || ""}
                        onChange={(e) => handleAvailabilityChange(day, e.target.value)}
                        className={`flex-1 ${availabilityErrors[day] ? "border-red-500" : ""}`}
                      />
                    </div>
                    {availabilityErrors[day] && (
                      <p className="text-xs text-red-500 ml-[108px]">{availabilityErrors[day]}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Weekend */}
              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm text-gray-700">Weekend</p>
                  {formData.availability["Saturday"] && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToWeekend("Saturday")}
                      className="text-xs h-7"
                    >
                      Copy Saturday to Sunday
                    </Button>
                  )}
                </div>
                {["Saturday", "Sunday"].map((day) => (
                  <div key={day} className="space-y-1">
                    <div className="flex gap-2 items-center">
                      <span className="text-sm font-medium text-gray-600 min-w-[100px]">{day}:</span>
                      <Input
                        type="text"
                        placeholder="09:00-18:00"
                        value={formData.availability[day] || ""}
                        onChange={(e) => handleAvailabilityChange(day, e.target.value)}
                        className={`flex-1 ${availabilityErrors[day] ? "border-red-500" : ""}`}
                      />
                    </div>
                    {availabilityErrors[day] && (
                      <p className="text-xs text-red-500 ml-[108px]">{availabilityErrors[day]}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Preview */}
              {Object.keys(formData.availability).some((day) =>
                formData.availability[day]?.trim()
              ) && (
                  <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <p className="text-xs font-medium text-gray-700 mb-2">Availability Preview:</p>
                    <pre className="text-xs text-gray-600 overflow-x-auto">
                      {JSON.stringify(
                        Object.fromEntries(
                          Object.entries(formData.availability)
                            .filter(([_, value]) => value?.trim())
                            .map(([day, value]) => [day, value.trim()])
                        ),
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t mt-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="staff-form" className="bg-blue-600 hover:bg-blue-700 text-white">
            {editStaff ? "Save Changes" : "Create Staff"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, Clock, AlertCircle, Loader2 } from "lucide-react";

import designationapi from "@/api/designationapi";
import staffApi from "@/api/staffapi";
import { rolesAPI } from "@/api/rolesapi";
import RoleAssignmentDropdown from "../TenantAdmin/RoleManagement/RoleAssignmentDropdown";
import { PHONE_REGEX, SUPPORTED_COUNTRY_CODES } from "@/constants/Constant";


const WEEKDAYS = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"
];
const WEEKEND = ["Saturday", "Sunday"];

// Utility to convert string like "monday" or "MONDAY" to "Monday"
const toTitleCase = (str) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

const ALL_DAYS = [...WEEKDAYS, ...WEEKEND];

const createDefaultAvailability = () => {
  const avail = {};
  ALL_DAYS.forEach(day => {
    avail[day] = {
      active: false,
      sessions: [{ start: "", end: "" }]
    };
  });
  return avail;
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
    availability: createDefaultAvailability(),
    is_archived: false,
    status: "Active",
  });
  const [availabilityErrors, setAvailabilityErrors] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);


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
      const newAvail = createDefaultAvailability();

      if (editStaff.availability) {
        try {
          const rawAvail = JSON.parse(editStaff.availability);
          Object.entries(rawAvail).forEach(([key, value]) => {
            const titleKey = toTitleCase(key);
            if (newAvail[titleKey]) {
              const ranges = Array.isArray(value) ? value : [value];
              const sessions = ranges.map(range => {
                const [start, end] = range.split('-');
                return { start: start || "", end: end || "" };
              });

              newAvail[titleKey] = {
                active: true,
                sessions: sessions.length > 0 ? sessions : [{ start: "", end: "" }]
              };
            }
          });
        } catch (e) {
          console.error("Error parsing availability:", e);
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
        availability: newAvail,
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
        availability: createDefaultAvailability(),
        is_archived: false,
        status: "Active",
      });
      setAvailabilityErrors({});
      setFormErrors({});
    }
  }, [open, editStaff]);

  /* Form Handlers */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDepartmentChange = (value) => setFormData((prev) => ({ ...prev, department: value, designation: "" }));

  const handleDesignationChange = (value) => setFormData((prev) => ({ ...prev, designation: value }));

  /* Availability Handlers */

  const handleDayToggle = (day, checked) => {
    setFormData((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: { ...prev.availability[day], active: checked },
      },
    }));
    // Clear error for this day if turned off
    if (!checked) {
      setAvailabilityErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[day];
        return newErrs;
      });
    }
  };

  const handleSessionChange = (day, index, field, value) => {
    setFormData((prev) => {
      const currentDay = prev.availability[day];
      const newSessions = [...currentDay.sessions];
      newSessions[index] = { ...newSessions[index], [field]: value };
      return {
        ...prev,
        availability: {
          ...prev.availability,
          [day]: { ...currentDay, sessions: newSessions },
        },
      };
    });
  };

  const addSession = (day) => {
    setFormData((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          sessions: [...prev.availability[day].sessions, { start: "", end: "" }],
        },
      },
    }));
  };

  const removeSession = (day, index) => {
    setFormData((prev) => {
      const currentDay = prev.availability[day];
      if (currentDay.sessions.length <= 1) return prev;
      const newSessions = currentDay.sessions.filter((_, i) => i !== index);
      return {
        ...prev,
        availability: {
          ...prev.availability,
          [day]: { ...currentDay, sessions: newSessions },
        },
      };
    });
  };

  const copyToOtherDays = (sourceDay, targetDays) => {
    const sourceState = formData.availability[sourceDay];
    if (!sourceState.active) {
      return toast.error(`Please enable ${sourceDay} first`);
    }

    // Validate source sessions before copying
    const errors = [];
    sourceState.sessions.forEach((session, idx) => {
      if (!session.start || !session.end) errors.push(`Session ${idx + 1} incomplete`);
      if (session.start && session.end && session.start >= session.end) errors.push(`Session ${idx + 1} invalid time`);
    });

    if (errors.length > 0) {
      return toast.error("Please fix errors in source day before copying");
    }

    setFormData((prev) => {
      const newAvail = { ...prev.availability };
      targetDays.forEach((day) => {
        newAvail[day] = {
          active: true,
          sessions: JSON.parse(JSON.stringify(sourceState.sessions)) // Deep copy
        };
      });
      return { ...prev, availability: newAvail };
    });

    // Clear errors for targets
    setAvailabilityErrors(prev => {
      const newErrs = { ...prev };
      targetDays.forEach(day => delete newErrs[day]);
      return newErrs;
    });

    toast.success("Schedule copied successfully");
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.staff_name.trim()) errors.staff_name = "Staff name is required";
    if (!formData.department) errors.department = "Department is required";
    if (!formData.designation) errors.designation = "Designation is required";

    if (!formData.contact_info.trim()) {
      errors.contact_info = "Contact information is required";
    } else {
      const phoneToTest = formData.contact_info.trim().replace(/(?!^\+)[\s-]/g, '');

      if (phoneToTest.startsWith('+')) {
        const matchedCode = SUPPORTED_COUNTRY_CODES.find(c => phoneToTest.startsWith(c.code));
        if (!matchedCode) {
          errors.contact_info = "Unsupported or invalid country code (e.g., use +91, +1)";
        } else {
          const subscriberNumber = phoneToTest.replace(matchedCode.code, '');
          if (subscriberNumber.length !== 10) {
            errors.contact_info = `${matchedCode.country} phone numbers must have exactly 10 digits after the country code`;
          }
        }
      } else if (phoneToTest.length !== 10) {
        errors.contact_info = "Phone number must be exactly 10 digits";
      } else if (!PHONE_REGEX.test(phoneToTest)) {
        errors.contact_info = "Invalid phone number format";
      }
    }

    if (!formData.email || !formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      errors.email = "Invalid email format";
    }

    if (formData.experience && isNaN(Number(formData.experience))) {
      errors.experience = "Experience must be a number";
    }

    let hasAvailability = false;
    const availabilityValidationErrors = {};

    ALL_DAYS.forEach((day) => {
      const { active, sessions } = formData.availability[day];
      if (active) {
        let dayHasValidSession = false;
        sessions.forEach((session, idx) => {
          if (!session.start || !session.end) {
            availabilityValidationErrors[`${day}_${idx}`] = "Incomplete time range";
          } else if (session.start >= session.end) {
            availabilityValidationErrors[`${day}_${idx}`] = "End time must be after start time";
          } else {
            dayHasValidSession = true;
          }
        });

        if (dayHasValidSession) hasAvailability = true;
      }
    });

    if (!hasAvailability) {
      errors.availability = "Please specify availability for at least one day";
    }

    setAvailabilityErrors(availabilityValidationErrors);
    setFormErrors(errors);
    return errors;
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submit triggered");
    if (editStaff) console.log("Editing staff:", editStaff.id);
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      console.log("Validation errors: \n", validationErrors);
      // Toast first error for quick feedback, inline errors will show the rest
      toast.error(Object.values(validationErrors)[0]);
      return;
    }
    setLoading(true);

    try {
      const phoneToTest = formData.contact_info.trim().replace(/(?!^\+)[\s-]/g, '');

      // Uniqueness Check: Check if phone number already exists in this hospital
      const { exists } = await staffApi.checkPhone(
        phoneToTest,
        hospitalId,
        editStaff ? editStaff.id : null
      );

      if (exists) {
        toast.error("A staff member with this phone number already exists in this hospital.");
        setLoading(false);
        return;
      }

      const availabilityMap = {};
      ALL_DAYS.forEach((day) => {
        const { active, sessions } = formData.availability[day];
        if (active) {
          const validRanges = sessions
            .filter(s => s.start && s.end && s.start < s.end)
            .map(s => `${s.start}-${s.end}`);

          if (validRanges.length > 0) {
            availabilityMap[day] = validRanges;
          }
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
        availability: JSON.stringify(availabilityMap),
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
          // Success handled by parent via onAdd
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
          // Success handled by parent via onAdd
        } else {
          toast.error('Staff created but role assignment failed. Please assign role manually.');
        }
      }

      onAdd(saved);
      setOpen(false);
    } catch (error) {
      console.error('Staff operation error:', error);
      toast.error(`Failed to ${editStaff ? "update" : "create"} staff: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
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
                <Input
                  name="staff_name"
                  placeholder="Enter full name"
                  value={formData.staff_name}
                  onChange={handleChange}
                  required
                  aria-invalid={!!formErrors.staff_name}
                />
                {formErrors.staff_name && <p className="text-xs text-red-500 mt-1">{formErrors.staff_name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <Select onValueChange={handleDepartmentChange} value={formData.department}>
                    <SelectTrigger aria-invalid={!!formErrors.department}>
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
                  {formErrors.department && <p className="text-xs text-red-500 mt-1">{formErrors.department}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">
                    Designation <span className="text-red-500">*</span>
                  </label>
                  <Select onValueChange={handleDesignationChange} value={formData.designation} disabled={!formData.department}>
                    <SelectTrigger aria-invalid={!!formErrors.designation}>
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
                  {formErrors.designation && <p className="text-xs text-red-500 mt-1">{formErrors.designation}</p>}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <Input
                  type="tel"
                  name="contact_info"
                  placeholder="+91 1234567890"
                  value={formData.contact_info}
                  onChange={handleChange}
                  required
                  aria-invalid={!!formErrors.contact_info}
                />
                {formErrors.contact_info && <p className="text-xs text-red-500 mt-1">{formErrors.contact_info}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  name="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  aria-invalid={!!formErrors.email}
                />
                {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
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
                  aria-invalid={!!formErrors.experience}
                />
                {formErrors.experience && <p className="text-xs text-red-500 mt-1">{formErrors.experience}</p>}
              </div>
            </div>

            {/* Availability Section */}
            <div className="space-y-4 pb-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-gray-700">
                  Weekly Availability <span className="text-red-500">*</span>
                </h3>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-800">
                    Using 24-hour format. Enable days to add time slots.
                  </div>
                </div>
                {formErrors.availability && <p className="text-xs text-red-500 mt-2 font-medium">{formErrors.availability}</p>}
              </div>

              {/* Render Day Rows */}
              <div className="space-y-4">
                {/* Weekdays Group */}
                <div className="border rounded-md p-3 space-y-3">
                  <div className="flex items-center justify-between border-b pb-2 mb-2">
                    <span className="font-medium text-sm">Weekdays</span>
                    {formData.availability["Monday"].active && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs h-6 text-blue-600 hover:text-blue-800"
                        onClick={() => copyToOtherDays("Monday", ["Tuesday", "Wednesday", "Thursday", "Friday"])}
                      >
                        Copy Mon to All Weekdays
                      </Button>
                    )}
                  </div>
                  {WEEKDAYS.map(day => (
                    <DayRow
                      key={day}
                      day={day}
                      data={formData.availability[day]}
                      errors={availabilityErrors}
                      onToggle={handleDayToggle}
                      onSessionChange={handleSessionChange}
                      onAddSession={addSession}
                      onRemoveSession={removeSession}
                    />
                  ))}
                </div>

                {/* Weekend Group */}
                <div className="border rounded-md p-3 space-y-3">
                  <div className="flex items-center justify-between border-b pb-2 mb-2">
                    <span className="font-medium text-sm">Weekend</span>
                    {formData.availability["Saturday"].active && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs h-6 text-blue-600 hover:text-blue-800"
                        onClick={() => copyToOtherDays("Saturday", ["Sunday"])}
                      >
                        Copy Sat to Sun
                      </Button>
                    )}
                  </div>
                  {WEEKEND.map(day => (
                    <DayRow
                      key={day}
                      day={day}
                      data={formData.availability[day]}
                      errors={availabilityErrors}
                      onToggle={handleDayToggle}
                      onSessionChange={handleSessionChange}
                      onAddSession={addSession}
                      onRemoveSession={removeSession}
                    />
                  ))}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t mt-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form="staff-form" className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {editStaff ? "Saving..." : "Creating..."}
              </>
            ) : (
              editStaff ? "Save Changes" : "Create Staff"
            )}
          </Button>

        </div>
      </DialogContent>
    </Dialog>
  );
}

// Process component for Day Row to keep main component clean
function DayRow({ day, data, errors, onToggle, onSessionChange, onAddSession, onRemoveSession }) {
  const { active, sessions } = data;

  return (
    <div className={`p-4 rounded-xl border transition-all duration-200 w-full ${active ? 'bg-blue-50/50 border-blue-100 shadow-sm' : 'bg-transparent border-transparent hover:bg-gray-50'}`}>
      <div className="flex flex-col sm:flex-row gap-4 w-full">
        {/* Checkbox and Label */}
        <div className="flex items-center gap-3 pt-1 sm:w-[130px] shrink-0">
          <Checkbox
            id={`day-${day}`}
            checked={active}
            onCheckedChange={(checked) => onToggle(day, checked)}
            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 mt-0.5"
          />
          <label
            htmlFor={`day-${day}`}
            className={`text-sm font-medium cursor-pointer select-none ${active ? 'text-gray-900' : 'text-gray-500'}`}
          >
            {day}
          </label>
        </div>

        {/* Sessions */}
        <div className="flex-1 min-w-0 w-full">
          {active ? (
            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-1 duration-200 w-full">
              {sessions.map((session, index) => {
                const errorKey = `${day}_${index}`;
                const hasError = errors[errorKey];

                return (
                  <div key={index} className="w-full">
                    <div className="flex items-center gap-2 w-full">
                      <div className="relative flex-1 min-w-0">
                        <Input
                          type="time"
                          value={session.start}
                          onChange={(e) => onSessionChange(day, index, 'start', e.target.value)}
                          className={`w-full h-9 bg-white text-sm transition-colors ${hasError ? 'border-red-500 focus-visible:ring-red-200' : 'focus-visible:ring-blue-200'}`}
                        />
                      </div>
                      <span className="text-gray-400 text-xs font-medium uppercase px-1 shrink-0">to</span>
                      <div className="relative flex-1 min-w-0">
                        <Input
                          type="time"
                          value={session.end}
                          onChange={(e) => onSessionChange(day, index, 'end', e.target.value)}
                          className={`w-full h-9 bg-white text-sm transition-colors ${hasError ? 'border-red-500 focus-visible:ring-red-200' : 'focus-visible:ring-blue-200'}`}
                        />
                      </div>

                      {/* Delete Button Container - Fixed Width */}
                      <div className="w-8 flex justify-center shrink-0">
                        {sessions.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            onClick={() => onRemoveSession(day, index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {hasError && <p className="text-xs text-red-500 pl-1 mt-1">{hasError}</p>}
                  </div>
                );
              })}

              <div className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onAddSession(day)}
                  className="text-xs h-8 px-3 border-dashed text-blue-600 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <Plus className="h-3 w-3 mr-1.5" /> Add Session
                </Button>
              </div>
            </div>
          ) : (
            <div className="pt-1.5 text-sm text-gray-400 italic font-light">Unavailable</div>
          )}
        </div>
      </div>
    </div>
  );
}

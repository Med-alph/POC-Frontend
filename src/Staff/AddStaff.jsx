import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, Clock, AlertCircle, Loader2, Shield } from "lucide-react";

import designationapi from "@/api/designationapi";
import staffApi from "@/api/staffapi";
import { rolesAPI } from "@/api/rolesapi";
import RoleAssignmentDropdown from "../TenantAdmin/RoleManagement/RoleAssignmentDropdown";
import { PHONE_REGEX, SUPPORTED_COUNTRY_CODES } from "@/constants/Constant";
import { ReadOnlyTooltip } from "@/components/ui/read-only-tooltip";


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
      <DialogContent className="max-w-[750px] max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b bg-gray-50/50 dark:bg-gray-900/20 shrink-0">
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
            {editStaff ? "Update Staff Member" : "Register New Staff"}
          </DialogTitle>
          <DialogDescription id="staff-form-dialog-description" className="text-xs">
            {editStaff ? "Modify account details and clinic schedule for this staff member." : "Setup profile and availability for a new hospital team member."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="px-6 py-6 space-y-10">
            <form id="staff-form" onSubmit={handleSubmit} className="space-y-10" aria-describedby="staff-form-dialog-description">
              
              {/* Basic Information */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b pb-2">
                  <div className="h-4 w-1 bg-blue-600 rounded-full" />
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Primary Details</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Full Legal Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      name="staff_name"
                      placeholder="e.g. Dr. Sarah Johnson"
                      value={formData.staff_name}
                      onChange={handleChange}
                      className="h-10 transition-shadow focus:ring-2 focus:ring-blue-500/20"
                      required
                    />
                    {formErrors.staff_name && <p className="text-[11px] font-medium text-red-500 mt-1">{formErrors.staff_name}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Primary Department <span className="text-red-500">*</span>
                    </label>
                    <Select onValueChange={handleDepartmentChange} value={formData.department}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Choose Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dep) => (
                          <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.department && <p className="text-[11px] font-medium text-red-500 mt-1">{formErrors.department}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Designation <span className="text-red-500">*</span>
                    </label>
                    <Select onValueChange={handleDesignationChange} value={formData.designation} disabled={!formData.department}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Choose Designation" />
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
                    {formErrors.designation && <p className="text-[11px] font-medium text-red-500 mt-1">{formErrors.designation}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Secure Contact Phone <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="tel"
                      name="contact_info"
                      placeholder="+91 12345 67890"
                      value={formData.contact_info}
                      onChange={handleChange}
                      className="h-10 transition-shadow focus:ring-2 focus:ring-blue-500/20"
                      required
                    />
                    {formErrors.contact_info && <p className="text-[11px] font-medium text-red-500 mt-1">{formErrors.contact_info}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Work Email Address <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      name="email"
                      placeholder="sarah@medalph.clinic"
                      value={formData.email}
                      onChange={handleChange}
                      className="h-10 transition-shadow focus:ring-2 focus:ring-blue-500/20"
                      required
                    />
                    {formErrors.email && <p className="text-[11px] font-medium text-red-500 mt-1">{formErrors.email}</p>}
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <RoleAssignmentDropdown
                      value={formData.role_id}
                      onChange={(roleId) => setFormData(prev => ({ ...prev, role_id: roleId }))}
                      required={false}
                      label="Governance Role (Optional)"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Clinical Experience (Years)</label>
                    <Input
                      type="number"
                      name="experience"
                      placeholder="0"
                      min="0"
                      max="50"
                      value={formData.experience}
                      onChange={handleChange}
                      className="h-10 transition-shadow focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Availability Section */}
              <div className="space-y-6 pb-6">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-1 bg-amber-500 rounded-full" />
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Practicing Schedule</h3>
                  </div>
                </div>

                <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-tight">Clock Configuration</p>
                    <p className="text-xs text-amber-800 dark:text-amber-300/80 leading-relaxed">
                      Schedules use military (24h) time. Enable specific days below to configure multiple consulting sessions.
                    </p>
                    {formErrors.availability && <p className="text-[11px] font-bold text-red-500 mt-2">{formErrors.availability}</p>}
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Weekdays Group */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Business Days</span>
                      {formData.availability["Monday"].active && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-[10px] h-6 font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 rounded"
                          onClick={() => copyToOtherDays("Monday", ["Tuesday", "Wednesday", "Thursday", "Friday"])}
                        >
                          Clone Monday to Weekdays
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-3">
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
                  </div>

                  {/* Weekend Group */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Weekend Schedule</span>
                      {formData.availability["Saturday"].active && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-[10px] h-6 font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 rounded"
                          onClick={() => copyToOtherDays("Saturday", ["Sunday"])}
                        >
                          Clone Sat to Sun
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-3">
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
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50/50 dark:bg-gray-900/20 flex items-center justify-between shrink-0">
          <Button type="button" variant="ghost" className="text-gray-500 hover:text-gray-700" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <ReadOnlyTooltip>
            <Button type="submit" form="staff-form" className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px] shadow-md hover:shadow-lg transition-all active:scale-95" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                editStaff ? "Update Records" : "Confirm & Register"
              )}
            </Button>
          </ReadOnlyTooltip>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Process component for Day Row to keep main component clean
function DayRow({ day, data, errors, onToggle, onSessionChange, onAddSession, onRemoveSession }) {
  const { active, sessions } = data;

  return (
    <div className={`rounded-xl border transition-colors duration-150 w-full ${active ? 'bg-blue-50/20 dark:bg-blue-900/5 border-blue-200/50 dark:border-blue-800/40 shadow-sm' : 'bg-transparent border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'}`}>
      <div className="flex flex-col sm:flex-row p-3 gap-4 w-full">
        {/* Checkbox and Label */}
        <div className="flex items-center gap-3 sm:w-[130px] shrink-0">
          <Checkbox
            id={`day-${day}`}
            checked={active}
            onCheckedChange={(checked) => onToggle(day, checked)}
            className="h-5 w-5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
          <label
            htmlFor={`day-${day}`}
            className={`text-sm font-bold cursor-pointer select-none ${active ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-600'}`}
          >
            {day}
          </label>
        </div>

        {/* Sessions */}
        <div className="flex-1 min-w-0 w-full">
          {active ? (
            <div className="flex flex-col gap-3 w-full">
              {sessions.map((session, index) => {
                const errorKey = `${day}_${index}`;
                const hasError = errors[errorKey];

                return (
                  <div key={index} className="w-full">
                    <div className="flex items-center gap-3 w-full">
                      <div className="relative flex-1 min-w-0">
                        <Input
                          type="time"
                          value={session.start}
                          onChange={(e) => onSessionChange(day, index, 'start', e.target.value)}
                          className={`h-9 bg-white dark:bg-gray-950 text-[13px] border-gray-200 dark:border-gray-800 transition-colors ${hasError ? 'border-red-500 ring-1 ring-red-100' : 'focus:ring-2 focus:ring-blue-500/20'}`}
                        />
                      </div>
                      <span className="text-gray-400 text-[10px] font-bold uppercase tracking-tighter shrink-0">to</span>
                      <div className="relative flex-1 min-w-0">
                        <Input
                          type="time"
                          value={session.end}
                          onChange={(e) => onSessionChange(day, index, 'end', e.target.value)}
                          className={`h-9 bg-white dark:bg-gray-950 text-[13px] border-gray-200 dark:border-gray-800 transition-colors ${hasError ? 'border-red-500 ring-1 ring-red-100' : 'focus:ring-2 focus:ring-blue-500/20'}`}
                        />
                      </div>

                      <div className="w-8 flex justify-center shrink-0">
                        {sessions.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-full"
                            onClick={() => onRemoveSession(day, index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {hasError && <p className="text-[10px] font-bold text-red-500 mt-1 pl-1 capitalize">{hasError.toLowerCase()}</p>}
                  </div>
                );
              })}

              <div className="pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddSession(day)}
                  className="text-[11px] h-7 px-3 font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Consulting Window
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-9 flex items-center px-1 text-xs text-gray-300 dark:text-gray-700 font-medium italic">Office Closed</div>
          )}
        </div>
      </div>
    </div>
  );
}

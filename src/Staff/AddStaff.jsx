import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { Clock, AlertCircle } from "lucide-react";
import designationAPI from "@/api/designationAPI";
import staffAPI from "@/api/staffAPI";

// Days of the week
const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

export default function CreateStaffDialog({ hospitalId, onAdd, open, setOpen }) {
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
    availability: {},
    is_archived: false,
    status: "Active"
  });
  const [availabilityErrors, setAvailabilityErrors] = useState({});

  // Fetch designations grouped by department when dialog opens
  useEffect(() => {
    async function loadDesignations() {
      try {
        console.log('[CreateStaffDialog] Loading designations...');
        const data = await designationAPI.getAllGrouped();
        console.log('[CreateStaffDialog] Designations loaded:', data);
        setDesignations(data);
        setDepartments(Object.keys(data));
      } catch (err) {
        console.error('[CreateStaffDialog] Failed to load designations:', err);
        toast.error("Failed to load designations");
      }
    }
    if (open) {
      loadDesignations();
    }
  }, [open]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        staff_name: "",
        department: "",
        contact_info: "",
        email: "",
        password: "",
        experience: "",
        designation: "",
        availability: {},
        is_archived: false,
        status: "Active"
      });
      setAvailabilityErrors({});
    }
  }, [open]);

  /**
   * Validate time format (HH:MM in 24-hour format)
   * Valid examples: 09:00, 14:30, 23:59
   * Invalid: 9:00, 25:00, 12:60
   */
  const validateTimeFormat = (time) => {
    const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
    return timeRegex.test(time);
  };

  /**
   * Validate time slot format (HH:MM-HH:MM)
   * Examples: 09:00-14:00, 16:00-18:00
   */
  const validateTimeSlot = (slot) => {
    if (!slot || slot.trim() === '') {
      return { isValid: true, error: null }; // Empty is allowed
    }

    const trimmedSlot = slot.trim();
    
    // Check basic format
    if (!trimmedSlot.includes('-')) {
      return { 
        isValid: false, 
        error: 'Use format HH:MM-HH:MM (e.g., 09:00-14:00)' 
      };
    }

    const [startTime, endTime] = trimmedSlot.split('-').map(t => t.trim());

    // Validate start time
    if (!validateTimeFormat(startTime)) {
      return { 
        isValid: false, 
        error: `Invalid start time: ${startTime}. Use 24hr format (e.g., 09:00)` 
      };
    }

    // Validate end time
    if (!validateTimeFormat(endTime)) {
      return { 
        isValid: false, 
        error: `Invalid end time: ${endTime}. Use 24hr format (e.g., 14:00)` 
      };
    }

    // Check if end time is after start time
    const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
    const endMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);

    if (endMinutes <= startMinutes) {
      return { 
        isValid: false, 
        error: 'End time must be after start time' 
      };
    }

    return { isValid: true, error: null };
  };

  /**
   * Convert time to 24-hour format if needed
   * Already in 24hr format: return as-is
   */
  const ensureTimeIn24HourFormat = (timeSlot) => {
    if (!timeSlot || timeSlot.trim() === '') {
      return '';
    }
    // Since we're validating for 24hr format, just return the trimmed value
    return timeSlot.trim();
  };

  // Handle change for simple inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // On department select, reset designation selection
  const handleDepartmentChange = (value) => {
    console.log('[CreateStaffDialog] Department changed:', value);
    setFormData(prev => ({ ...prev, department: value, designation: '' }));
  };

  // Handle designation change (stores designation id)
  const handleDesignationChange = (value) => {
    console.log('[CreateStaffDialog] Designation changed:', value);
    setFormData(prev => ({ ...prev, designation: value }));
  };

  // Handle availability input changes per day
  const handleAvailabilityChange = (day, slot) => {
    console.log(`[CreateStaffDialog] Availability changed for ${day}:`, slot);
    
    // Validate the time slot
    const validation = validateTimeSlot(slot);
    
    // Update errors state
    setAvailabilityErrors(prev => ({
      ...prev,
      [day]: validation.error
    }));

    // Update form data with the raw input (we'll validate on submit)
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: slot,
      },
    }));
  };

  // Copy time to all weekdays (Monday-Friday)
  const copyToWeekdays = (sourceDay) => {
    const sourceTime = formData.availability[sourceDay];
    if (!sourceTime) {
      toast.error("Please enter a time slot first");
      return;
    }

    const validation = validateTimeSlot(sourceTime);
    if (!validation.isValid) {
      toast.error("Please fix the time format before copying");
      return;
    }

    const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const newAvailability = { ...formData.availability };
    
    weekdays.forEach(day => {
      newAvailability[day] = sourceTime;
    });

    setFormData(prev => ({ ...prev, availability: newAvailability }));
    
    // Clear errors for weekdays
    const newErrors = { ...availabilityErrors };
    weekdays.forEach(day => {
      delete newErrors[day];
    });
    setAvailabilityErrors(newErrors);
    
    toast.success("Time copied to all weekdays");
  };

  // Copy time to weekend (Saturday-Sunday)
  const copyToWeekend = (sourceDay) => {
    const sourceTime = formData.availability[sourceDay];
    if (!sourceTime) {
      toast.error("Please enter a time slot first");
      return;
    }

    const validation = validateTimeSlot(sourceTime);
    if (!validation.isValid) {
      toast.error("Please fix the time format before copying");
      return;
    }

    const weekend = ["Saturday", "Sunday"];
    const newAvailability = { ...formData.availability };
    
    weekend.forEach(day => {
      newAvailability[day] = sourceTime;
    });

    setFormData(prev => ({ ...prev, availability: newAvailability }));
    
    // Clear errors for weekend
    const newErrors = { ...availabilityErrors };
    weekend.forEach(day => {
      delete newErrors[day];
    });
    setAvailabilityErrors(newErrors);
    
    toast.success("Time copied to weekend");
  };

  // Validate entire form
  const validateForm = () => {
    const errors = [];

    if (!formData.staff_name.trim()) {
      errors.push("Staff name is required");
    }

    if (!formData.department) {
      errors.push("Department is required");
    }

    if (!formData.designation) {
      errors.push("Designation is required");
    }

    if (!formData.contact_info.trim()) {
      errors.push("Contact information is required");
    }

    if (formData.email && !isValidEmail(formData.email)) {
      errors.push("Invalid email format");
    }

    if (!formData.password || formData.password.length < 6) {
      errors.push("Password must be at least 6 characters");
    }

    if (formData.experience && isNaN(Number(formData.experience))) {
      errors.push("Experience must be a number");
    }

    // Validate all availability slots
    let hasAvailability = false;
    const availabilityValidationErrors = {};

    WEEKDAYS.forEach(day => {
      const slot = formData.availability[day];
      if (slot && slot.trim() !== '') {
        hasAvailability = true;
        const validation = validateTimeSlot(slot);
        if (!validation.isValid) {
          availabilityValidationErrors[day] = validation.error;
          errors.push(`${day}: ${validation.error}`);
        }
      }
    });

    if (!hasAvailability) {
      errors.push("Please specify availability for at least one day");
    }

    setAvailabilityErrors(availabilityValidationErrors);

    return errors;
  };

  // Submit form
 // Submit form
const handleSubmit = async (e) => {
  e.preventDefault();

  console.log('[CreateStaffDialog] Form submitted');
  console.log('[CreateStaffDialog] Form data:', formData);

  // Validate form
  const validationErrors = validateForm();
  if (validationErrors.length > 0) {
    console.error('[CreateStaffDialog] Validation errors:', validationErrors);
    toast.error(validationErrors[0]); // Show first error
    return;
  }

  try {
    // Build availability object in correct format
    const availabilityObject = {};
    
    WEEKDAYS.forEach(day => {
      const slot = formData.availability[day];
      if (slot && slot.trim() !== '') {
        // Ensure 24-hour format
        availabilityObject[day] = ensureTimeIn24HourFormat(slot);
      }
    });

    console.log('[CreateStaffDialog] Final availability object:', availabilityObject);

    const payload = {
      hospital_id: hospitalId,
      staff_name: formData.staff_name.trim(),
      department: formData.department,
      designation_id: formData.designation,
      contact_info: formData.contact_info.trim(),
      email: formData.email.trim() || null,
      password: formData.password,
      experience: formData.experience ? Number(formData.experience) : 0,
      availability: JSON.stringify(availabilityObject), // 👈 STRINGIFY HERE
      is_archived: false,
      status: "active"
    };

    console.log('[CreateStaffDialog] Payload to send:', payload);
    console.log('[CreateStaffDialog] Availability string:', payload.availability);

    const createdStaff = await staffAPI.create(payload);
    
    console.log('[CreateStaffDialog] Staff created successfully:', createdStaff);
    
    onAdd(createdStaff);
    toast.success(`Staff created successfully! Availability set for ${Object.keys(availabilityObject).length} days.`);
    setOpen(false);
    
    // Reset form
    setFormData({
      staff_name: "",
      department: "",
      contact_info: "",
      email: "",
      password: "",
      experience: "",
      designation: "",
      availability: {},
      is_archived: false,
      status: "Active"
    });
    setAvailabilityErrors({});

  } catch (error) {
    console.error("[CreateStaffDialog] Failed to create staff:", error);
    toast.error(`Failed to create staff: ${error.message || 'Unknown error'}`);
  }
};


  // Email validation helper
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[700px] h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-semibold">Create New Staff</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto mt-4 pr-2 space-y-1">
          <form id="staff-form" onSubmit={handleSubmit} className="space-y-4">
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
                />
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
                      {departments.map(dep => (
                        <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">
                    Designation <span className="text-red-500">*</span>
                  </label>
                  <Select
                    onValueChange={handleDesignationChange}
                    value={formData.designation}
                    disabled={!formData.department}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Designation" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.department && designations[formData.department]?.map(designation => (
                        <SelectItem key={designation.id} value={designation.id}>
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
                <Input
                  name="contact_info"
                  placeholder="+91 1234567890"
                  value={formData.contact_info}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">
                  Email
                </label>
                <Input
                  type="email"
                  name="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">
                  Password <span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  name="password"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">
                  Experience (Years)
                </label>
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
                      <li>Use 24-hour format: <code className="bg-blue-100 px-1 rounded">09:00-14:00</code></li>
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
                
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(day => (
                  <div key={day} className="space-y-1">
                    <div className="flex gap-2 items-center">
                      <span className="text-sm font-medium text-gray-600 min-w-[100px]">
                        {day}:
                      </span>
                      <Input
                        type="text"
                        placeholder="09:00-14:00"
                        value={formData.availability[day] || ""}
                        onChange={e => handleAvailabilityChange(day, e.target.value)}
                        className={`flex-1 ${availabilityErrors[day] ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {availabilityErrors[day] && (
                      <p className="text-xs text-red-500 ml-[108px]">
                        {availabilityErrors[day]}
                      </p>
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
                
                {["Saturday", "Sunday"].map(day => (
                  <div key={day} className="space-y-1">
                    <div className="flex gap-2 items-center">
                      <span className="text-sm font-medium text-gray-600 min-w-[100px]">
                        {day}:
                      </span>
                      <Input
                        type="text"
                        placeholder="09:00-18:00"
                        value={formData.availability[day] || ""}
                        onChange={e => handleAvailabilityChange(day, e.target.value)}
                        className={`flex-1 ${availabilityErrors[day] ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {availabilityErrors[day] && (
                      <p className="text-xs text-red-500 ml-[108px]">
                        {availabilityErrors[day]}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Preview */}
              {Object.keys(formData.availability).some(day => formData.availability[day]?.trim()) && (
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

        {/* Footer Buttons */}
        <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t mt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="staff-form" 
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Create Staff
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

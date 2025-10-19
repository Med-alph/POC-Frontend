import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-hot-toast";
import designationAPI from "@/api/designationAPI"; // Import your designation API module correctly
import staffAPI from "@/api/staffAPI";

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
    designation: "", // will store designation id here, not name
    availability: {}, // {Monday: ["09:00-12:00"], ...}
    is_archived: false,
    status: "Active"
  });

  // Fetch designations grouped by department when dialog opens
  useEffect(() => {
    async function loadDesignations() {
      try {
        const data = await designationAPI.getAllGrouped();
        setDesignations(data);
        setDepartments(Object.keys(data));  // Set department list dynamically from keys
      } catch (err) {
        console.error('Failed to load designations:', err);
        toast.error("Failed to load designations");
      }
    }
    if (open) {
      loadDesignations();
    }
  }, [open]);

  // Handle change for simple inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // On department select, reset designation selection
  const handleDepartmentChange = (value) => {
    setFormData(prev => ({ ...prev, department: value, designation: '' }));
  };

  // Handle designation change (stores designation id)
  const handleDesignationChange = (value) => {
    setFormData(prev => ({ ...prev, designation: value }));
  };

  // Handle availability input changes per day
  const handleAvailabilityChange = (day, slot) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: slot,
      },
    }));
  };

  // Submit form, sending designation id and department info
  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!formData.designation) {
    toast.error("Please select a designation");
    return;
  }

  try {
    const payload = {
      ...formData,
      hospital_id: hospitalId,
      designation_id: formData.designation,
      experience: Number(formData.experience), // Convert to number
      availability: JSON.stringify(formData.availability), // Convert availability object to string if needed
    };
    
    const createdStaff = await staffAPI.create(payload);
    onAdd(createdStaff);
    toast.success("Staff created successfully!");
    setOpen(false);
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
  } catch (error) {
    console.error("Failed to create staff:", error);
    toast.error(`Failed to create staff: ${error.message}`);
  }
};

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[600px] h-[85vh] sm:h-[90vh] flex flex-col modal-content">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Create New Staff</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto mt-4 pr-2 scrollbar-thin">
          <form id="staff-form" onSubmit={handleSubmit} className="space-y-4">
            <Input
              name="staff_name"
              placeholder="Staff Name"
              value={formData.staff_name}
              onChange={handleChange}
              required
            />

            {/* Department Dropdown */}
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

            {/* Designation Dropdown */}
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
                  <SelectItem key={designation.id} value={designation.id}>{designation.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              name="contact_info"
              placeholder="Phone Number"
              value={formData.contact_info}
              onChange={handleChange}
            />

            <Input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
            />

            <Input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />

            <Input
              type="number"
              name="experience"
              placeholder="Experience (Years)"
              value={formData.experience}
              onChange={handleChange}
            />

            <div>
              <p className="font-semibold">Availability</p>
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(day => (
                <div key={day} className="flex gap-2 items-center mb-1">
                  <span>{day}:</span>
                  <Input
                    type="text"
                    placeholder="e.g., 09:00-12:00"
                    value={formData.availability[day] || ""}
                    onChange={e => handleAvailabilityChange(day, e.target.value)}
                  />
                </div>
              ))}
              <p className="text-xs text-gray-500">Enter time slots separated by commas if multiple per day</p>
            </div>
          </form>
        </div>
        <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t mt-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="staff-form" className="bg-blue-600 hover:bg-blue-700 text-white">
            Add Staff
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

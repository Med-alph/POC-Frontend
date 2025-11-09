import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import toast from "react-hot-toast";
import hospitalsapi from "../../api/hospitalsapi";

export default function AddHospitalDialog({ onAdd, children }) {
  const [open, setOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    contact_number: "",
    email: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const response = await hospitalsapi.create(formData);
      toast.success("Hospital created successfully!");
      onAdd && onAdd(response); // Callback for parent to update table
      setOpen(false);
      setFormData({
        name: "",
        address: "",
        contact_number: "",
        email: "",
      });
    } catch (err) {
      toast.error(err.message || "Failed to create hospital");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Hospital</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Input
            name="name"
            placeholder="Hospital Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <Input
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleChange}
          />
          <Input
            name="contact_number"
            placeholder="Contact Number"
            value={formData.contact_number}
            onChange={handleChange}
          />
          <Input
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            type="email"
          />
          <div className="flex justify-end">
            <Button onClick={() => setOpen(false)} type="button" variant="outline" className="mr-2">
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={formLoading}>
              {formLoading ? "Adding..." : "Add Hospital"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
    subdomain: "",
    address: "",
    contact_number: "",
    email: "",
    logo: "",
  });

  const generateSubdomain = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-") // replace non-alphanumeric with hyphen
      .replace(/-+/g, "-") // replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ""); // remove leading/trailing hyphens
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "name" && !formData.subdomainManual) {
      const subdomain = generateSubdomain(value);
      setFormData((prev) => ({ ...prev, [name]: value, subdomain }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubdomainChange = (e) => {
    const value = generateSubdomain(e.target.value);
    setFormData((prev) => ({ ...prev, subdomain: value, subdomainManual: true }));
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
        subdomain: "",
        subdomainManual: false,
        address: "",
        contact_number: "",
        email: "",
        logo: "",
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
          <div className="space-y-1">
            <Input
              name="name"
              placeholder="Hospital Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-1">
            <Input
              name="subdomain"
              placeholder="Hospital Subdomain"
              value={formData.subdomain}
              onChange={handleSubdomainChange}
              required
            />
            {formData.subdomain && (
              <p className="text-xs text-gray-500 pl-1 italic">
                Hospital URL: <span className="text-blue-600 font-medium">{formData.subdomain}.frontend-emr.medalph.com</span>
              </p>
            )}
          </div>
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
          <Input
            name="logo"
            placeholder="Hospital Logo URL"
            value={formData.logo}
            onChange={handleChange}
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

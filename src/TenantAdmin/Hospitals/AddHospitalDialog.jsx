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
      <DialogContent className="max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b bg-gray-50/50 dark:bg-gray-900/20 shrink-0">
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">Add New Hospital</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Hospital Name *</label>
              <Input
                name="name"
                placeholder="e.g. Medalph General Hospital"
                value={formData.name}
                onChange={handleChange}
                className="h-10 transition-shadow focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Identifier (Subdomain) *</label>
              <Input
                name="subdomain"
                placeholder="e.g. general-hosp"
                value={formData.subdomain}
                onChange={handleSubdomainChange}
                className="h-10 transition-shadow focus:ring-2 focus:ring-blue-500/20 font-mono text-sm"
                required
              />
              {formData.subdomain && (
                <div className="px-3 py-2 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 rounded-lg">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Live URL: <span className="text-blue-600 dark:text-blue-400 font-bold tracking-tight">{formData.subdomain}.frontend-emr.medalph.com</span>
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Contact Number</label>
                <Input
                  name="contact_number"
                  placeholder="+X XXX XXX XXXX"
                  value={formData.contact_number}
                  onChange={handleChange}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Work Email</label>
                <Input
                  name="email"
                  placeholder="admin@hosp.com"
                  value={formData.email}
                  onChange={handleChange}
                  type="email"
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Physical Address</label>
              <Input
                name="address"
                placeholder="Building, Street, City"
                value={formData.address}
                onChange={handleChange}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Brand Logo URL</label>
              <Input
                name="logo"
                placeholder="https://example.com/logo.png"
                value={formData.logo}
                onChange={handleChange}
                className="h-10"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Button onClick={() => setOpen(false)} type="button" variant="ghost" className="text-gray-500 hover:text-gray-700 mr-2">
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 shadow-md hover:shadow-lg transition-all active:scale-95" disabled={formLoading}>
              {formLoading ? "Provisioning..." : "Add Hospital"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Copy, Link as LinkIcon, ExternalLink, AlertTriangle } from "lucide-react";
import hospitalsapi from "../../api/hospitalsapi";
import toast from "react-hot-toast";
import AddHospitalDialog from "./AddHospitalDialog";
import HospitalSettings from "./HospitalSettings";
import { Settings as SettingsIcon, ArrowLeft } from "lucide-react";

const PAGE_SIZE = 10;

export default function HospitalListTable() {
  const [hospitals, setHospitals] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [page, setPage] = useState(1);
  const [editHospital, setEditHospital] = useState(null);
  const [deleteHospital, setDeleteHospital] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showSettingsFor, setShowSettingsFor] = useState(null);

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const data = await hospitalsapi.getByTenant();
      setHospitals(data);
    } catch (error) {
      toast.error("Failed to fetch hospitals: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const filteredHospitals = useMemo(() => {
    if (!searchTerm.trim()) return hospitals;
    const term = searchTerm.toLowerCase();
    return hospitals.filter(
      (h) =>
        (h.name && h.name.toLowerCase().includes(term)) ||
        (h.email && h.email.toLowerCase().includes(term)) ||
        (h.address && h.address.toLowerCase().includes(term))
    );
  }, [hospitals, searchTerm]);

  const totalPages = Math.ceil(filteredHospitals.length / PAGE_SIZE);
  const paginatedHospitals = filteredHospitals.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const isAllSelected = paginatedHospitals.every((h) => selectedIds.has(h.id));
  const toggleSelectAll = () => {
    const newSelected = new Set(selectedIds);
    if (isAllSelected) {
      paginatedHospitals.forEach((h) => newSelected.delete(h.id));
    } else {
      paginatedHospitals.forEach((h) => newSelected.add(h.id));
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectOne = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Delete ${selectedIds.size} hospital(s)? This action cannot be undone.`
      )
    )
      return;

    try {
      await Promise.all(
        Array.from(selectedIds).map((id) => hospitalsapi.delete(id))
      );
      toast.success(`${selectedIds.size} hospital(s) deleted.`);
      setSelectedIds(new Set());
      await fetchHospitals();
      setPage(1); // reset to first page after bulk delete
    } catch (err) {
      toast.error("Failed to delete selected hospitals.");
    }
  };

  const handleAddHospital = async (newHospitalResponse) => {
    toast.success("Hospital added successfully");
    await fetchHospitals();
    setPage(1);
  };



  const handleEditHospital = async (updatedData) => {
    setEditLoading(true);
    try {
      const updatedHospital = await hospitalsapi.update(
        editHospital.id,
        updatedData
      );
      setHospitals((prev) =>
        prev.map((h) => (h.id === updatedHospital.id ? updatedHospital : h))
      );
      setEditHospital(null);
      toast.success("Hospital updated successfully");
    } catch (error) {
      toast.error("Failed to update hospital: " + error.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteHospital = async () => {
    setDeleteLoading(true);
    try {
      await hospitalsapi.delete(deleteHospital.id);
      toast.success(`Hospital ${deleteHospital.name} deleted.`);
      setDeleteHospital(null);
      await fetchHospitals();
      setPage(1); // reset to first page after delete
    } catch {
      toast.error("Failed to delete hospital.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("URL copied to clipboard!");
  };

  const getFullUrl = (subdomain) => {
    const hostname = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol; // http: or https:

    let baseDomain = hostname;
    const parts = hostname.split('.');

    // If we are on a subdomain (like admin.localhost or admin.medalph.com), 
    // we need to strip the 'admin' part to get the base domain for hospitals.
    if (hostname.endsWith('.localhost') && parts.length >= 2) {
      baseDomain = parts.slice(1).join('.'); // returns 'localhost'
    } else if (parts.length >= 3) {
      baseDomain = parts.slice(1).join('.'); // returns 'frontend-emr.medalph.com'
    }

    const portSuffix = port ? `:${port}` : '';
    return `${protocol}//${subdomain}.${baseDomain}${portSuffix}`;
  };

  // Edit Modal JSX
  const EditModal = () => {
    const [formData, setFormData] = useState({
      name: editHospital.name || "",
      email: editHospital.email || "",
      contact_number: editHospital.contact_number || "",
      address: editHospital.address || "",
      subdomain: editHospital.subdomain || "",
    });

    const onChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const onSubmit = (e) => {
      e.preventDefault();
      // Validate before sending
      if (!formData.name.trim()) {
        toast.error("Name is required");
        return;
      }
      handleEditHospital(formData);
    };

    return (
      <div className="absolute z-50 top-0 left-0 w-full flex justify-center mt-4 pointer-events-auto">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
          <h3 className="text-xl font-semibold mb-4">Edit Hospital</h3>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={onChange}
                required
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Email</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={onChange}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Phone</label>
              <input
                name="contact_number"
                value={formData.contact_number}
                onChange={onChange}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium flex items-center gap-2">
                Subdomain
                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle size={10} /> Advanced
                </span>
              </label>
              <input
                name="subdomain"
                value={formData.subdomain}
                onChange={onChange}
                className="w-full border px-3 py-2 rounded bg-gray-50 border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                placeholder="school-name"
              />
              <p className="text-[11px] text-amber-600 mt-1 flex items-start gap-1">
                <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                Changing this will break all existing links, QR codes, and bookmarks for this hospital.
              </p>
              <p className="text-[11px] text-gray-500 mt-1 italic">
                Live URL: {formData.subdomain ? getFullUrl(formData.subdomain) : "N/A"}
              </p>
            </div>
            <div>
              <label className="block mb-1 font-medium">Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={onChange}
                className="w-full border px-3 py-2 rounded"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditHospital(null)}
                disabled={editLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editLoading}>
                {editLoading ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Delete Confirmation Modal JSX
  const DeleteModal = () => (
    <div className="absolute z-50 top-0 left-0 w-full flex justify-center mt-4 pointer-events-auto">
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
        <h3 className="text-xl font-semibold mb-4">Confirm Delete</h3>
        <p className="mb-6">
          Are you sure you want to delete the hospital{" "}
          <strong>{deleteHospital.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => setDeleteHospital(null)}
            disabled={deleteLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteHospital}
            disabled={deleteLoading}
          >
            {deleteLoading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );

  if (showSettingsFor) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <Button
          variant="ghost"
          onClick={() => setShowSettingsFor(null)}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Hospital List
        </Button>
        <HospitalSettings
          hospitalId={showSettingsFor.id}
          hospitalName={showSettingsFor.name}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6 space-x-4 flex-wrap">
        <h2 className="text-2xl font-semibold text-gray-800 whitespace-nowrap">
          Hospitals Under This Tenant
        </h2>
        <div className="flex gap-2 flex-wrap items-center">
          <input
            type="text"
            placeholder="Search hospitals..."
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
          <AddHospitalDialog
            onAdd={(newHospital) => {
              handleAddHospital(newHospital);
              toast.success("Hospital added successfully");
            }}
          >
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 text-white rounded-lg px-4 py-2 transition">
              <PlusCircle size={20} /> Add Hospital
            </Button>
          </AddHospitalDialog>
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              className="px-4 py-2 rounded-lg"
            >
              Delete Selected ({selectedIds.size})
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
        <Table className="min-w-full divide-y divide-gray-200">
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all hospitals on this page"
                />
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                Name
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                Email
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                Phone
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                Address
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                Live URL
              </TableHead>
              <TableHead className="px-6 py-3 text-center text-sm font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center p-8 text-gray-600 italic"
                >
                  Loading hospitals...
                </TableCell>
              </TableRow>
            ) : paginatedHospitals.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-gray-400 p-8 italic"
                >
                  No hospitals registered for this tenant yet.
                </TableCell>
              </TableRow>
            ) : (
              paginatedHospitals.map((hospital, idx) => (
                <TableRow
                  key={hospital.id}
                  className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <TableCell className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(hospital.id)}
                      onChange={() => toggleSelectOne(hospital.id)}
                      aria-label={`Select hospital ${hospital.name}`}
                    />
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {hospital.name}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {hospital.email || "-"}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {hospital.contact_number || "-"}
                  </TableCell>
                  <TableCell className="px-6 py-4 max-w-xs truncate text-sm text-gray-600">
                    {hospital.address || "-"}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <code className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-mono border border-blue-100">
                        {hospital.subdomain || "N/A"}
                      </code>
                      {hospital.subdomain && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => copyToClipboard(getFullUrl(hospital.subdomain))}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Copy Live URL"
                          >
                            <Copy size={14} />
                          </button>
                          <a
                            href={getFullUrl(hospital.subdomain)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                            title="Open Site"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSettingsFor(hospital)}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      aria-label={`Settings for ${hospital.name}`}
                    >
                      <SettingsIcon size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditHospital(hospital)}
                      aria-label={`Edit ${hospital.name}`}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteHospital(hospital)}
                      aria-label={`Delete ${hospital.name}`}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </div>
        <div className="space-x-2">
          <Button
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
          >
            Previous
          </Button>
          <Button
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Render Edit Modal if editing */}
      {editHospital && <EditModal />}

      {/* Render Delete Modal if deleting */}
      {deleteHospital && <DeleteModal />}
    </div>
  );
}

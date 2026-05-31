import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import proceduresAPI from "../../api/proceduresapi";
import designationapi from "../../api/designationapi";
import CptAutocomplete from "../../components/CptAutocomplete";
import toast from "react-hot-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { ReadOnlyTooltip } from "@/components/ui/read-only-tooltip";
import { X } from "lucide-react";

const AddProcedureDialog = ({ open, onOpenChange, hospitalId, procedure, onSuccess }) => {
    const { isReadOnly } = useSubscription();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        category: "",
        department_id: "General",
        price: "",
        duration: "30",
        is_active: true,
        cpt_code: null,             // FK → cpt_codes.code
        cpt_description: null,      // local display only, not sent to backend
    });

    const [departments, setDepartments] = useState([]);

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const grouped = await designationapi.getAllGrouped();
                const depts = Object.keys(grouped);
                if (!depts.includes("General")) depts.push("General");
                setDepartments(depts);
            } catch (error) {
                console.error("Error fetching departments:", error);
            }
        };
        fetchDepartments();
    }, []);

    useEffect(() => {
        if (procedure) {
            setFormData({
                name: procedure.name || "",
                category: procedure.category || "",
                department_id: procedure.department_id || "General",
                price: procedure.price?.toString() || "",
                duration: procedure.duration?.toString() || "30",
                is_active: procedure.is_active ?? true,
                // cpt may come back as a nested object { code, description } or as a plain string
                cpt_code: procedure.cpt?.code || procedure.cpt_code || null,
                cpt_description: procedure.cpt?.description || null,
            });
        } else {
            setFormData({
                name: "",
                category: "",
                department_id: "General",
                price: "",
                duration: "30",
                is_active: true,
                cpt_code: null,
                cpt_description: null,
            });
        }
    }, [procedure, open]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleCptSelect = (cptObj) => {
        setFormData((prev) => ({
            ...prev,
            cpt_code: cptObj.code,
            cpt_description: cptObj.description,
        }));
    };

    const handleCptClear = () => {
        setFormData((prev) => ({ ...prev, cpt_code: null, cpt_description: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!hospitalId) {
            toast.error("Please select a hospital first");
            return;
        }

        setLoading(true);
        try {
            // Only send cpt_code to backend (FK reference) — description is master data
            const data = {
                name: formData.name,
                category: formData.category,
                department_id: formData.department_id,
                price: parseFloat(formData.price),
                duration: parseInt(formData.duration),
                is_active: formData.is_active,
                hospital_id: hospitalId,
                cpt_code: formData.cpt_code || null,
            };

            if (procedure) {
                await proceduresAPI.update(procedure.id, data);
                toast.success("Procedure updated");
            } else {
                await proceduresAPI.create(data);
                toast.success("Procedure added to master list");
            }
            onSuccess();
        } catch (error) {
            toast.error("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{procedure ? "Edit Procedure" : "Add New Procedure to Master"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Procedure Name</label>
                        <Input
                            name="name"
                            placeholder="e.g. Tooth Extraction"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Category</label>
                        <Input
                            name="category"
                            placeholder="e.g. Dental, Surgery, Lab"
                            value={formData.category}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Department</label>
                        <select
                            name="department_id"
                            className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.department_id}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Department</option>
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-gray-500 mt-1">
                            Select 'General' for procedures that apply to all departments.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Standard Price (₹)</label>
                            <Input
                                name="price"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.price}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Est. Duration (mins)</label>
                            <Input
                                name="duration"
                                type="number"
                                placeholder="30"
                                value={formData.duration}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    {/* CPT Code Mapping */}
                    <div className="space-y-1 pt-2 border-t">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">
                                CPT Code{" "}
                                <span className="text-[10px] font-normal text-gray-400">(Optional — for clinical coding)</span>
                            </label>
                            {formData.cpt_code && (
                                <button
                                    type="button"
                                    onClick={handleCptClear}
                                    className="text-[10px] text-red-500 hover:text-red-700 flex items-center gap-1"
                                >
                                    <X className="h-3 w-3" /> Clear
                                </button>
                            )}
                        </div>

                        {/* Show selected CPT badge if already mapped */}
                        {formData.cpt_code ? (
                            <div className="flex items-center gap-2 p-2.5 bg-indigo-50 border border-indigo-100 rounded-md">
                                <span className="font-bold text-sm text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                                    {formData.cpt_code}
                                </span>
                                <span className="text-xs text-gray-600 flex-1 truncate">
                                    {formData.cpt_description || "CPT code mapped"}
                                </span>
                                <button
                                    type="button"
                                    onClick={handleCptClear}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ) : (
                            <CptAutocomplete
                                onSelect={handleCptSelect}
                                onClear={handleCptClear}
                                value=""
                                placeholder="Search CPT codes (e.g. '99213', 'office visit')..."
                            />
                        )}
                        <p className="text-[10px] text-gray-400 mt-1">
                            Maps this procedure to a standard CPT billing code. Doctors won't need to select CPT manually during consultations.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            id="is_active"
                            name="is_active"
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={formData.is_active}
                            onChange={handleChange}
                        />
                        <label htmlFor="is_active" className="text-sm font-medium text-gray-700 leading-none">
                            Mark as Active (Visible to Doctors)
                        </label>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <ReadOnlyTooltip>
                            <Button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                                disabled={loading || isReadOnly}
                            >
                                {loading ? "Saving..." : procedure ? "Update Procedure" : "Add Procedure"}
                            </Button>
                        </ReadOnlyTooltip>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddProcedureDialog;

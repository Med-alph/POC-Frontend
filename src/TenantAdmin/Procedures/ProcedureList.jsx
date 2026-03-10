import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    PlusCircle,
    Edit,
    Trash2,
    Search,
    Clipboard,
    Filter,
    Activity,
    Stethoscope,
    FlaskConical
} from "lucide-react";
import proceduresAPI from "../../api/proceduresapi";
import hospitalsapi from "../../api/hospitalsapi";
import toast from "react-hot-toast";
import AddProcedureDialog from "./AddProcedureDialog";
import ConfirmationModal from "../../components/ui/confirmation-modal";

const PAGE_SIZE = 10;

export default function ProcedureList({ fixedHospitalId = null, isHospitalAdmin = false }) {
    const user = useSelector((state) => state.auth.user);
    const [procedures, setProcedures] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [selectedHospitalId, setSelectedHospitalId] = useState(fixedHospitalId || user?.hospital_id || "");
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [departmentFilter, setDepartmentFilter] = useState("all");
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [editProcedure, setEditProcedure] = useState(null);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [procedureToDelete, setProcedureToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (fixedHospitalId) {
            setSelectedHospitalId(fixedHospitalId);
        } else if (user?.hospital_id && isHospitalAdmin) {
            setSelectedHospitalId(user.hospital_id);
        }
    }, [fixedHospitalId, user, isHospitalAdmin]);

    const fetchHospitals = async () => {
        try {
            const data = await hospitalsapi.getByTenant();
            setHospitals(data);
            if (data.length > 0 && !selectedHospitalId) {
                setSelectedHospitalId(data[0].id);
            }
        } catch (error) {
            toast.error("Failed to fetch hospitals: " + error.message);
        }
    };

    const fetchProcedures = async () => {
        if (!selectedHospitalId) return;
        setLoading(true);
        try {
            const data = await proceduresAPI.getByHospital(selectedHospitalId);
            setProcedures(data);
        } catch (error) {
            toast.error("Failed to fetch procedures: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!fixedHospitalId && !isHospitalAdmin) {
            fetchHospitals();
        }
    }, [fixedHospitalId, isHospitalAdmin]);

    useEffect(() => {
        if (selectedHospitalId) {
            fetchProcedures();
        }
    }, [selectedHospitalId]);

    const filteredProcedures = useMemo(() => {
        return procedures.filter((p) => {
            const matchesSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
            const matchesDepartment = departmentFilter === "all" || p.department_id === departmentFilter;
            return matchesSearch && matchesCategory && matchesDepartment;
        });
    }, [procedures, searchTerm, categoryFilter, departmentFilter]);

    const totalPages = Math.ceil(filteredProcedures.length / PAGE_SIZE);
    const paginatedProcedures = filteredProcedures.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE
    );

    const handleDelete = (id) => {
        setProcedureToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!procedureToDelete) return;
        setIsDeleting(true);
        try {
            await proceduresAPI.delete(procedureToDelete);
            toast.success("Procedure deactivated");
            fetchProcedures();
            setIsDeleteModalOpen(false);
        } catch (error) {
            toast.error("Failed to deactivate: " + error.message);
        } finally {
            setIsDeleting(false);
            setProcedureToDelete(null);
        }
    };

    const categories = ["all", ...new Set(procedures.map((p) => p.category))];
    const departments = ["all", "General", ...new Set(procedures.filter(p => p.department_id && p.department_id !== 'General').map((p) => p.department_id))];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-800">Master Procedures</h2>
                    <p className="text-sm text-gray-500">Manage the standard procedure menu for hospitals</p>
                </div>

                <div className="flex gap-2 flex-wrap items-center">
                    {!isHospitalAdmin && !fixedHospitalId && (
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase font-bold text-gray-400 px-1">Select Hospital</span>
                            <select
                                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white min-w-[200px]"
                                value={selectedHospitalId}
                                onChange={(e) => setSelectedHospitalId(e.target.value)}
                            >
                                {hospitals.length === 0 && <option value="">Loading hospitals...</option>}
                                {hospitals.map((h) => (
                                    <option key={h.id} value={h.id}>
                                        {h.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-gray-400 px-1">Search</span>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search procedures..."
                                className="pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 w-64"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-gray-400 px-1">Category</span>
                        <select
                            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                            value={categoryFilter}
                            onChange={(e) => {
                                setCategoryFilter(e.target.value);
                                setPage(1);
                            }}
                        >
                            {categories.map((c) => (
                                <option key={c} value={c}>
                                    {c.charAt(0).toUpperCase() + c.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-gray-400 px-1">Department</span>
                        <select
                            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                            value={departmentFilter}
                            onChange={(e) => {
                                setDepartmentFilter(e.target.value);
                                setPage(1);
                            }}
                        >
                            {departments.map((d) => (
                                <option key={d} value={d}>
                                    {d === 'all' ? 'All Departments' : d}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Button
                        className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                            setEditProcedure(null);
                            setAddDialogOpen(true);
                        }}
                        disabled={!selectedHospitalId}
                    >
                        <PlusCircle size={20} /> Add Procedure
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead>Procedure Name</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Standard Price</TableHead>
                            <TableHead>Est. Duration</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center p-8 text-gray-600 italic">
                                    Loading procedures...
                                </TableCell>
                            </TableRow>
                        ) : paginatedProcedures.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center p-12">
                                    <div className="flex flex-col items-center gap-2 text-gray-400">
                                        <Clipboard size={48} />
                                        <p>No procedures found for this hospital.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedProcedures.map((proc) => (
                                <TableRow key={proc.id}>
                                    <TableCell className="font-medium text-gray-900">{proc.name}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${proc.department_id === 'General' ? 'bg-gray-100 text-gray-800' : 'bg-purple-100 text-purple-800'}`}>
                                            {proc.department_id || 'General'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {proc.category}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-gray-600 font-mono">₹{proc.price}</TableCell>
                                    <TableCell className="text-gray-600">{proc.duration} mins</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${proc.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {proc.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setEditProcedure(proc);
                                                setAddDialogOpen(true);
                                            }}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            <Edit size={16} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(proc.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {totalPages > 1 && (
                    <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50">
                        <span className="text-sm text-gray-600">
                            Page {page} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <AddProcedureDialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                hospitalId={selectedHospitalId}
                procedure={editProcedure}
                onSuccess={() => {
                    fetchProcedures();
                    setAddDialogOpen(false);
                }}
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Deactivate Procedure"
                description="Are you sure you want to deactivate this procedure? It will no longer be selectable by doctors during consultations."
                confirmText="Yes, Deactivate"
                variant="destructive"
                loading={isDeleting}
            />
        </div>
    );
}

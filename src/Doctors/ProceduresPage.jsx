import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Search, Filter } from "lucide-react";
import proceduresAPI from "../api/proceduresapi";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

const ProceduresPage = () => {
    const user = useSelector((state) => state.auth.user);
    const [procedures, setProcedures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");

    useEffect(() => {
        if (user?.hospital_id) {
            fetchProcedures();
        }
    }, [user]);

    const fetchProcedures = async () => {
        try {
            setLoading(true);
            const data = await proceduresAPI.getByHospital(user.hospital_id);
            setProcedures(data || []);
        } catch (error) {
            toast.error("Failed to load procedures list");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProcedures = procedures.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
        return matchesSearch && matchesCategory && p.is_active;
    });

    const categories = ["all", ...new Set(procedures.map(p => p.category))];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Activity className="h-8 w-8 text-blue-600" />
                            Hospital Procedures
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Browse available medical procedures and standard pricing for your hospital.
                        </p>
                    </div>
                </header>

                <Card className="border-0 shadow-lg dark:bg-gray-800 transition-all overflow-hidden bg-white/50 backdrop-blur-sm">
                    <CardHeader className="border-b border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 p-6">
                        <div className="flex flex-col md:flex-row gap-4 justify-between">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search procedures or categories..."
                                    className="pl-10 h-11 border-gray-200 focus:ring-blue-500 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                                <Filter className="h-4 w-4 text-gray-400 shrink-0" />
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setCategoryFilter(cat)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${categoryFilter === cat
                                                ? "bg-blue-600 text-white shadow-md"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                                            }`}
                                    >
                                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {loading ? (
                            <div className="py-20 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-4 text-gray-500">Loading procedures...</p>
                            </div>
                        ) : filteredProcedures.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50/50 dark:bg-gray-900/50 hover:bg-transparent border-gray-100 dark:border-gray-700">
                                            <TableHead className="w-[300px] font-bold text-gray-700 dark:text-gray-300">Procedure Name</TableHead>
                                            <TableHead className="font-bold text-gray-700 dark:text-gray-300">Category</TableHead>
                                            <TableHead className="font-bold text-gray-700 dark:text-gray-300">Duration (min)</TableHead>
                                            <TableHead className="font-bold text-gray-700 dark:text-gray-300 text-right">Standard Price</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredProcedures.map((proc, idx) => (
                                            <TableRow key={proc.id} className="group border-gray-100 dark:border-gray-700 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                                <TableCell className="font-medium text-gray-900 dark:text-white flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs uppercase">
                                                        {proc.name.charAt(0)}
                                                    </div>
                                                    {proc.name}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                                                        {proc.category}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-gray-600 dark:text-gray-400">
                                                    {proc.duration} mins
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-gray-900 dark:text-white">
                                                    ₹{proc.price.toLocaleString('en-IN')}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="py-20 text-center">
                                <div className="bg-gray-100 dark:bg-gray-700 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">No procedures found</h3>
                                <p className="text-gray-500 max-w-xs mx-auto mt-2">
                                    We couldn't find any procedures matching your search criteria.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ProceduresPage;

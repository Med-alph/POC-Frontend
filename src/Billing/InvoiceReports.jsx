import React, { useState, useEffect, useCallback } from "react";
import {
    Search,
    Calendar as CalendarIcon,
    Filter,
    Download,
    ChevronLeft,
    ChevronRight,
    Loader2,
    FileText,
    AlertCircle,
    CheckCircle2,
    Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import paymentsAPI from "../api/paymentsapi";
import { format } from "date-fns";
import * as XLSX from 'xlsx';
import toast from "react-hot-toast";

export default function InvoiceReports() {
    const [reports, setReports] = useState([]);
    const [meta, setMeta] = useState({
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        itemsPerPage: 10
    });
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: "",
        status: "all",
        date: "",
        page: 1,
        limit: 10
    });

    const [debouncedSearch, setDebouncedSearch] = useState("");

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            // Exclude the raw search value to prevent immediate API calls
            const { search: _, ...otherFilters } = filters;
            const params = {
                ...otherFilters,
                search: debouncedSearch
            };

            if (params.status === 'all') delete params.status;

            // Map single date to range for backend
            if (params.date) {
                params.start_date = params.date;
                params.end_date = params.date;
                delete params.date;
            }

            const response = await paymentsAPI.getInvoiceReports(params);
            setReports(response.items || []);
            setMeta(response.meta || {
                totalItems: 0,
                totalPages: 0,
                currentPage: 1,
                itemsPerPage: 10
            });
        } catch (error) {
            console.error("Failed to fetch invoice reports:", error);
            toast.error("Failed to load invoice reports");
        } finally {
            setLoading(false);
        }
    }, [
        filters.status,
        filters.date,
        filters.page,
        filters.limit,
        debouncedSearch
    ]);

    // Handle debouncing for search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(filters.search);
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [filters.search]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            page: 1 // Reset to first page on filter change
        }));
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({
            ...prev,
            page: newPage
        }));
    };

    const exportToExcel = () => {
        if (reports.length === 0) {
            toast.error("No data to export");
            return;
        }

        const dataToExport = reports.map(report => ({
            "Invoice ID": report.invoiceId,
            "Patient Name": report.patientName,
            "Patient Code": report.patientCode,
            "Total Amount": report.totalAmount,
            "Payment Method": report.paymentMethod || 'N/A',
            "Payment Status": report.paymentStatus,
            "Payment Date": report.paymentDate ? format(new Date(report.paymentDate), "yyyy-MM-dd HH:mm") : 'N/A',
            "Order Status": report.orderStatus,
            "Created At": report.orderCreatedAt ? format(new Date(report.orderCreatedAt), "yyyy-MM-dd HH:mm") : 'N/A'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Invoice Reports");

        // Generate filename with current date
        const filename = `Invoice_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
        XLSX.writeFile(workbook, filename);
        toast.success("Report exported successfully");
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'paid':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Paid</Badge>;
            case 'pending':
            case 'unpaid':
                return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">Pending</Badge>;
            case 'failed':
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Failed</Badge>;
            case 'created':
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">Created</Badge>;
            default:
                return <Badge variant="outline">{status || 'Unknown'}</Badge>;
        }
    };

    return (
        <div className="p-6 space-y-6 bg-gray-50/50 dark:bg-gray-900/50 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText className="h-6 w-6 text-blue-600" />
                        Invoice Reports
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">View and export all patient invoices and payment records.</p>
                </div>
                <Button
                    onClick={exportToExcel}
                    variant="outline"
                    className="flex items-center gap-2 bg-white dark:bg-gray-800"
                    disabled={loading || reports.length === 0}
                >
                    <Download className="h-4 w-4" />
                    Export Excel
                </Button>
            </div>

            <Card className="border-none shadow-sm bg-white dark:bg-gray-800">
                <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-700/50">
                    <CardTitle className="text-lg font-medium">Filters</CardTitle>
                    <CardDescription>Narrow down your report by date, status, or search keywords.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="lg:col-span-1">
                            <label className="text-xs font-medium text-gray-500 mb-1.5 block uppercase tracking-wider">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="ID, Name or Code"
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange("search", e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1.5 block uppercase tracking-wider">Status</label>
                            <Select
                                value={filters.status}
                                onValueChange={(value) => handleFilterChange("status", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="unpaid">Pending</SelectItem>
                                    <SelectItem value="created">Created</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1.5 block uppercase tracking-wider">Filter by Date</label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    type="date"
                                    value={filters.date}
                                    onChange={(e) => handleFilterChange("date", e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="flex items-end">
                            <Button
                                variant="ghost"
                                onClick={() => setFilters({
                                    search: "",
                                    status: "all",
                                    date: "",
                                    page: 1,
                                    limit: 10
                                })}
                                className="w-full text-gray-500"
                            >
                                Reset Filters
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white dark:bg-gray-800 overflow-hidden">
                <CardContent className="p-0">
                    <div className="relative min-h-[400px]">
                        {loading && (
                            <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fetching records...</p>
                                </div>
                            </div>
                        )}

                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-50/50">
                                    <TableHead className="w-[120px]">Invoice ID</TableHead>
                                    <TableHead>Patient Details</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Payment Status</TableHead>
                                    <TableHead>Payment Date</TableHead>
                                    <TableHead>Order Status</TableHead>
                                    <TableHead>Created</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reports.length === 0 && !loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                                <Filter className="h-10 w-10 mb-2 opacity-20" />
                                                <p>No invoice records found matching your filters.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    reports.map((report) => (
                                        <TableRow key={report.invoiceId} className="group transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-900/40">
                                            <TableCell className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                                                {report.invoiceId}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900 dark:text-white">{report.patientName || 'N/A'}</span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{report.patientCode || '---'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-gray-900 dark:text-white">
                                                ₹{report.totalAmount ? parseFloat(report.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize bg-gray-50">{report.paymentMethod || '---'}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(report.paymentStatus)}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                                                <div className="flex flex-col">
                                                    <span>{report.paymentDate ? format(new Date(report.paymentDate), "dd MMM yyyy") : '---'}</span>
                                                    <span className="text-[10px] opacity-70">{report.paymentDate ? format(new Date(report.paymentDate), "hh:mm a") : ''}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm capitalize text-gray-600 dark:text-gray-400 italic">
                                                    {report.orderStatus || '---'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                                                <div className="flex flex-col">
                                                    <span>{report.orderCreatedAt ? format(new Date(report.orderCreatedAt), "dd MMM yyyy") : 'N/A'}</span>
                                                    <span className="text-[10px] opacity-70">{report.orderCreatedAt ? format(new Date(report.orderCreatedAt), "hh:mm a") : ''}</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {meta.totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/30 dark:bg-gray-900/20">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Showing <span className="font-medium text-gray-900 dark:text-white">{(meta.currentPage - 1) * meta.itemsPerPage + 1}</span> to <span className="font-medium text-gray-900 dark:text-white">{Math.min(meta.currentPage * meta.itemsPerPage, meta.totalItems)}</span> of <span className="font-medium text-gray-900 dark:text-white">{meta.totalItems}</span> results
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(meta.currentPage - 1)}
                                    disabled={meta.currentPage === 1 || loading}
                                    className="h-8 w-8 p-0"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                {/* Page Numbers */}
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (meta.totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (meta.currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (meta.currentPage >= meta.totalPages - 2) {
                                            pageNum = meta.totalPages - 4 + i;
                                        } else {
                                            pageNum = meta.currentPage - 2 + i;
                                        }

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={meta.currentPage === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`h-8 w-8 p-0 ${meta.currentPage === pageNum ? 'bg-blue-600' : ''}`}
                                                disabled={loading}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(meta.currentPage + 1)}
                                    disabled={meta.currentPage === meta.totalPages || loading}
                                    className="h-8 w-8 p-0"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Banknote, Search, User, Calendar, Receipt, ShieldCheck, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import paymentsAPI from "../api/paymentsapi";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

export default function CashierDashboard() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [settlingId, setSettlingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal State
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const user = useSelector((state) => state.auth.user);

    const fetchPendingOrders = async () => {
        try {
            setLoading(true);
            const response = await paymentsAPI.getAccountsReceivable();
            setOrders(response.data || response || []);
        } catch (error) {
            console.error("Failed to fetch pending orders:", error);
            toast.error("Failed to load accounts receivable queue");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingOrders();
    }, []);

    const openConfirmModal = (order) => {
        setSelectedOrder(order);
        setIsConfirmModalOpen(true);
    };

    const handleSettle = async () => {
        if (!selectedOrder) return;

        const orderId = selectedOrder.id;
        const amount = selectedOrder.totalAmount || selectedOrder.total_amount || 0;

        try {
            setSettlingId(orderId);
            setIsConfirmModalOpen(false);
            await paymentsAPI.settleManually(orderId, user?.id);
            toast.success("Payment settled successfully!");
            fetchPendingOrders(); // Refresh queue
        } catch (error) {
            console.error("Settlement failed:", error);
            toast.error(error.message || "Failed to settle payment");
        } finally {
            setSettlingId(null);
            setSelectedOrder(null);
        }
    };

    const filteredOrders = orders.filter(order => {
        const patientName = order.patient?.patient_name || "Unknown Patient";
        const orderIdStr = order.orderNumber || order.id || "";
        const search = searchTerm.toLowerCase();

        return patientName.toLowerCase().includes(search) ||
            orderIdStr.toLowerCase().includes(search);
    });

    return (
        <div className="p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Banknote className="h-6 w-6 text-green-600" />
                        Cashier Dashboard
                    </h1>
                    <p className="text-sm text-gray-500">Manage and settle offline cash payments</p>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search patient or order..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <CardHeader className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-blue-500" />
                        Pending Payments Queue
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-2" />
                            <p className="text-sm text-gray-500">Loading queue...</p>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="text-center py-20">
                            <Banknote className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">No pending cash payments found</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50 dark:bg-gray-900/50">
                                    <TableHead className="font-bold">Order Details</TableHead>
                                    <TableHead className="font-bold">Patient</TableHead>
                                    <TableHead className="font-bold">Date</TableHead>
                                    <TableHead className="font-bold">Amount</TableHead>
                                    <TableHead className="font-bold">Status</TableHead>
                                    <TableHead className="text-right font-bold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.map((order) => {
                                    const amount = order.totalAmount || order.total_amount || 0;
                                    const date = order.createdAt || order.created_at;
                                    const orderDisplayId = order.orderNumber || `ORD-${order.id.slice(0, 8).toUpperCase()}`;

                                    return (
                                        <TableRow key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors">
                                            <TableCell className="font-mono text-xs text-blue-600">
                                                {orderDisplayId}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <User className="h-3 w-3 text-gray-400" />
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {order.patient?.patient_name || "Patient " + (order.patientId?.slice(0, 4) || "")}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <Calendar className="h-3 w-3" />
                                                    {date ? new Date(date).toLocaleDateString() : "N/A"}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-bold text-gray-900 dark:text-white">
                                                ₹{(parseFloat(amount) / 100).toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 uppercase text-[10px]">
                                                    {order.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700 text-white gap-2 h-8 px-4"
                                                    onClick={() => openConfirmModal(order)}
                                                    disabled={settlingId === order.id}
                                                >
                                                    {settlingId === order.id ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <Banknote className="h-3.5 w-3.5" />
                                                    )}
                                                    Receive Cash
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Confirmation Modal */}
            <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                            <Banknote className="h-6 w-6 text-green-600" />
                        </div>
                        <DialogTitle className="text-center text-xl">Confirm Cash Payment</DialogTitle>
                        <DialogDescription className="text-center pt-2">
                            Are you sure you want to mark this order as paid?
                            Please verify that you have received the exact amount in physical cash.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 my-4 space-y-3 border border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Patient:</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {selectedOrder.patient?.patient_name || "Unknown Patient"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Order ID:</span>
                                <span className="font-mono text-blue-600">
                                    {selectedOrder.orderNumber || selectedOrder.id.slice(0, 8)}
                                </span>
                            </div>
                            <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <span className="text-gray-900 dark:text-white font-bold">Total Amount:</span>
                                <span className="text-xl font-bold text-green-600">
                                    ₹{(parseFloat(selectedOrder.totalAmount || selectedOrder.total_amount || 0) / 100).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsConfirmModalOpen(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            className="bg-green-600 hover:bg-green-700 text-white flex-1"
                            onClick={handleSettle}
                        >
                            Confirm Receipt
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

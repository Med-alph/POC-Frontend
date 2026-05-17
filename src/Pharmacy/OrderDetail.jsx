import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, Pill, User, Stethoscope, FileText, CheckCircle2, 
  AlertCircle, ShieldCheck, Printer, RefreshCw, XCircle, ChevronRight, 
  HelpCircle, Check, Loader2, IndianRupee, Clock, ShoppingCart
} from "lucide-react";
import { useSelector } from "react-redux";
import pharmacyAPI from "../api/pharmacyapi";
import reportsAPI from "../api/reportsapi";
import ReportPreviewModal from "../components/Reports/ReportPreviewModal";
import toast from "react-hot-toast";

export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const staffId = user?.id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  
  // Local state for stock verification edits
  const [itemEdits, setItemEdits] = useState([]); // Array of { orderItemId, availability, pharmacistNotes, externalQty, partialAvailableQty }

  // Ref for polling interval to prevent duplicate triggers
  const pollingRef = useRef(null);

  const fetchOrder = useCallback(async (quiet = false) => {
    try {
      if (!quiet) setLoading(true);
      const response = await pharmacyAPI.getOrder(orderId);
      setOrder(response);
      
      // Initialize edit fields
      if (response && response.items) {
        const edits = response.items.map(item => ({
          orderItemId: item.id,
          availability: item.availability || 'AVAILABLE',
          pharmacistNotes: item.pharmacist_notes || '',
          externalQty: item.external_purchase_qty || 0,
          partialAvailableQty: item.dispensed_qty || item.prescribed_qty || item.prescribed_quantity
        }));
        setItemEdits(edits);
      }
    } catch (err) {
      console.error("Failed to load pharmacy order details", err);
      toast.error("Failed to load order details");
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [orderId]);

  // Payment status polling logic
  const checkPaymentStatus = useCallback(async () => {
    if (!orderId) return;
    try {
      const response = await pharmacyAPI.getPaymentStatus(orderId);
      if (response && (response.isPaid || response.medication_order_status === 'PAID' || response.payment_status === 'paid' || response.payment_status === 'PAID')) {
        // Stop polling
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        toast.success("Payment verified! Order is now ready to dispense.");
        fetchOrder(true);
      }
    } catch (err) {
      console.error("Payment status poll error:", err);
    }
  }, [orderId, fetchOrder]);

  // Polling hook
  useEffect(() => {
    fetchOrder();

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [fetchOrder]);

  // Handle polling trigger based on status changes
  useEffect(() => {
    if (order && order.status === 'BILLED') {
      if (!pollingRef.current) {
        // Start polling cashier database every 12 seconds
        pollingRef.current = setInterval(checkPaymentStatus, 12000);
      }
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
  }, [order, checkPaymentStatus]);

  const handleEditChange = (orderItemId, field, value) => {
    setItemEdits(prev => prev.map(edit => {
      if (edit.orderItemId === orderItemId) {
        const updated = { ...edit, [field]: value };
        // If they change availability to UNAVAILABLE, automatically flag externalQty as full prescribed qty
        if (field === 'availability' && value === 'UNAVAILABLE') {
          const item = order.items.find(i => i.id === orderItemId);
          updated.externalQty = item ? item.prescribed_quantity : 0;
          updated.partialAvailableQty = 0;
        }
        // If they change availability to AVAILABLE, clear externalQty and partialAvailableQty
        if (field === 'availability' && value === 'AVAILABLE') {
          updated.externalQty = 0;
          const item = order.items.find(i => i.id === orderItemId);
          updated.partialAvailableQty = item ? item.prescribed_quantity : 0;
        }
        return updated;
      }
      return edit;
    }));
  };

  // Stock Verification
  const handleVerifyStock = async () => {
    try {
      setSubmitting(true);
      
      const payloadItems = itemEdits.map(edit => {
        const item = order.items.find(i => i.id === edit.orderItemId);
        
        let dispensedQty = item.prescribed_quantity;
        let extQty = 0;

        if (edit.availability === 'UNAVAILABLE') {
          dispensedQty = 0;
          extQty = item.prescribed_quantity;
        } else if (edit.availability === 'PARTIAL') {
          dispensedQty = Number(edit.partialAvailableQty) || 0;
          extQty = Math.max(0, item.prescribed_quantity - dispensedQty);
        }

        return {
          id: edit.orderItemId,
          availability: edit.availability,
          dispensed_qty: dispensedQty,
          external_purchase_qty: extQty,
          pharmacist_notes: edit.pharmacistNotes
        };
      });

      await pharmacyAPI.verifyOrder(orderId, staffId, {
        items: payloadItems,
        pharmacist_notes: "Verification completed successfully."
      });

      toast.success("Stock verification complete!");
      fetchOrder();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to verify stock availability");
    } finally {
      setSubmitting(false);
    }
  };

  // Generate Cashier Billing Invoice
  const handleGenerateInvoice = async () => {
    try {
      setSubmitting(true);
      await pharmacyAPI.billOrder(orderId, staffId);
      toast.success("Invoice generated & sent to Cashier dashboard!");
      fetchOrder();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to generate cashier invoice");
    } finally {
      setSubmitting(false);
    }
  };

  // Dispense medications (Deduct stock FEFO)
  const handleDispenseMedications = async () => {
    try {
      setSubmitting(true);
      await pharmacyAPI.dispenseOrder(orderId, staffId, {
        dispense_summary: "Meds dispensed directly to patient from in-house pharmacy."
      });
      toast.success("Medications successfully dispensed & inventory stock levels updated!");
      fetchOrder();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to dispense medications");
    } finally {
      setSubmitting(false);
    }
  };

  // Preview fulfillment receipt PDF
  const handlePreviewReceipt = async () => {
    try {
      setIsGeneratingPdf(true);
      const response = await reportsAPI.generatePharmacyReceipt(orderId);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate fulfillment receipt PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Cancel order
  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please enter a valid cancellation reason");
      return;
    }
    try {
      setSubmitting(true);
      await pharmacyAPI.cancelOrder(orderId, staffId, cancelReason);
      toast.success("Medication order cancelled");
      setShowCancelDialog(false);
      fetchOrder();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to cancel order");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-slate-50/50 min-h-screen">
        <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-600 dark:text-gray-400 font-semibold">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Order Not Found</h3>
        <p className="text-slate-500 text-xs mt-1">The pharmacy order ID does not exist or you lack permission to access it.</p>
        <Button onClick={() => navigate('/pharmacy')} className="mt-4 bg-indigo-600 hover:bg-indigo-700">
          Return to Queue
        </Button>
      </div>
    );
  }

  // Work out multi-step progress bar details
  const steps = [
    { label: 'Stock Verification', status: 'PENDING', key: 1 },
    { label: 'Invoice Billing', status: 'VERIFIED', key: 2 },
    { label: 'Payment Counter', status: 'BILLED', key: 3 },
    { label: 'Medicine Dispensing', status: 'PAID', key: 4 },
  ];

  const getStepIndex = (status) => {
    switch (status) {
      case 'PENDING': return 0;
      case 'VERIFIED': return 1;
      case 'BILLED': return 2;
      case 'PAID': return 3;
      case 'DISPENSED': return 4;
      case 'CANCELLED': return -1;
      default: return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.status);

  return (
    <div className="space-y-6">
      {/* Back navigation & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button 
          onClick={() => navigate('/pharmacy/queue')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Work Queue
        </button>

        {order.status !== 'DISPENSED' && order.status !== 'CANCELLED' && (
          <Button 
            variant="ghost" 
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold gap-1.5 self-start sm:self-auto"
            onClick={() => setShowCancelDialog(true)}
          >
            <XCircle className="h-4 w-4" />
            Cancel Order
          </Button>
        )}
      </div>

      {/* Premium Step-by-Step Progress Ribbon */}
      {order.status !== 'CANCELLED' && (
        <div className="bg-white dark:bg-gray-950 p-6 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm">
          <div className="relative flex flex-col sm:flex-row justify-between items-center gap-6 sm:gap-0">
            {/* Absolute connection bar behind steps */}
            <div className="absolute top-5 left-[12%] right-[12%] h-[3px] bg-slate-100 dark:bg-gray-800 hidden sm:block">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(0, currentStepIdx * 33.33))}%` }}
              />
            </div>
            
            {steps.map((step, idx) => {
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              const isFuture = idx > currentStepIdx;

              return (
                <div key={step.key} className="flex flex-col items-center relative z-10 w-full sm:w-auto">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                    isPast 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                      : isCurrent 
                        ? 'bg-white border-indigo-600 text-indigo-600 dark:bg-gray-950 dark:border-indigo-400 dark:text-indigo-400 font-bold ring-4 ring-indigo-50 dark:ring-0 shadow-lg scale-110' 
                        : 'bg-white border-slate-200 text-slate-400 dark:bg-gray-900 dark:border-gray-800'
                  }`}>
                    {isPast ? <Check className="h-5 w-5" /> : <span>{step.key}</span>}
                  </div>
                  <span className={`text-[11px] font-bold mt-2.5 transition-colors duration-300 ${
                    isCurrent ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : isPast ? 'text-slate-800 dark:text-gray-200' : 'text-slate-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Patient & Doctor Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Patient Block */}
        <Card className="rounded-2xl border-slate-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-950">
          <CardHeader className="border-b border-slate-50 dark:border-gray-800 p-4">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-indigo-500" />
              Patient Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <h4 className="text-base font-extrabold text-slate-800 dark:text-white">
              {order.patient?.patient_name || 'Anonymous Patient'}
            </h4>
            <div className="text-xs space-y-1.5 text-slate-500 dark:text-gray-400 font-medium">
              <p><span className="font-light">Gender/Age:</span> {order.patient?.gender || 'N/A'}, {order.patient?.age || calculateAge(order.patient?.dob)} yrs</p>
              <p><span className="font-light">Mobile:</span> {order.patient?.contact_info || 'Not Available'}</p>
              <p><span className="font-light">Email:</span> {order.patient?.email || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Prescription Doctor Block */}
        <Card className="rounded-2xl border-slate-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-950">
          <CardHeader className="border-b border-slate-50 dark:border-gray-800 p-4">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Stethoscope className="h-3.5 w-3.5 text-indigo-500" />
              Consultation Doctor
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">
              {order.doctor_name || ' Consulting Doctor'}
            </h4>
            <div className="text-xs space-y-1 text-slate-500 dark:text-gray-400">
              <p><span className="font-light">Consultation Ref:</span> {order.consultation_id ? order.consultation_id.slice(0, 8).toUpperCase() : 'N/A'}</p>
              <p><span className="font-light">Ordered At:</span> {new Date(order.created_at).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Workflow Summary Block */}
        <Card className="rounded-2xl border-slate-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-950">
          <CardHeader className="border-b border-slate-50 dark:border-gray-800 p-4">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
              Prescription Order State
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex flex-col justify-between h-[100px]">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-slate-500">Status:</span>
              <Badge className={`uppercase text-[10px] font-bold ${
                order.status === 'PENDING' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                order.status === 'VERIFIED' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                order.status === 'BILLED' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                order.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse' :
                order.status === 'DISPENSED' ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {order.status}
              </Badge>
            </div>
            {order.status === 'DISPENSED' && order.dispensed_at && (
              <p className="text-[10px] text-slate-400 mt-2">
                Dispensed on {new Date(order.dispensed_at).toLocaleString()}
              </p>
            )}
            {order.status === 'CANCELLED' && order.cancelled_at && (
              <div className="text-[10px] text-rose-500 mt-2 bg-rose-50/50 p-1.5 rounded-lg border border-rose-100">
                <span className="font-bold">Reason:</span> {order.cancellation_reason || 'N/A'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Prescription Items Panel */}
      <Card className="rounded-2xl border-slate-100 dark:border-gray-800 shadow-sm overflow-hidden bg-white dark:bg-gray-950">
        <CardHeader className="bg-white dark:bg-gray-950 border-b border-slate-50 dark:border-gray-800 px-6 py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            <Pill className="h-4 w-4 text-indigo-500" />
            Medication Items & Stock Matching
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 dark:bg-gray-900/50 hover:bg-slate-50/50 border-b border-slate-100 dark:border-gray-800">
                <TableHead className="font-bold text-slate-700 dark:text-gray-300 py-3 pl-6">Medicine Name</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-gray-300 py-3">Dosage / Frequency / Duration</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-gray-300 py-3 text-center">Prescribed Qty</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-gray-300 py-3">In-House Availability</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-gray-300 py-3">Fulfillment Quantities</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-gray-300 py-3 pr-6">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items?.map((item) => {
                const edit = itemEdits.find(e => e.orderItemId === item.id) || {
                  availability: item.availability || 'AVAILABLE',
                  pharmacistNotes: item.pharmacist_notes || '',
                  externalQty: item.external_purchase_qty || 0,
                  partialAvailableQty: item.dispensed_qty || item.prescribed_quantity
                };

                const isLocked = order.status !== 'PENDING';

                return (
                  <TableRow key={item.id} className="hover:bg-slate-50/20 dark:hover:bg-gray-900/20 transition-colors border-b border-slate-100 dark:border-gray-800">
                    <TableCell className="font-extrabold text-slate-800 dark:text-white pl-6 py-4">
                      {item.medicine_name}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col text-xs text-slate-500">
                        <span className="font-bold">Dosage: {item.prescription?.dosage || item.dosage || 'N/A'}</span>
                        <span className="font-light mt-0.5">
                          {item.prescription?.frequency || item.frequency || 'N/A'} • {item.prescription?.duration || item.duration || 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-bold text-slate-800 dark:text-white py-4">
                      {item.prescribed_qty || item.prescribed_quantity}
                    </TableCell>
                    <TableCell className="py-4">
                      {isLocked ? (
                        <Badge className={`uppercase text-[9px] font-bold ${
                          item.availability === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          item.availability === 'PARTIAL' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {item.availability}
                        </Badge>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditChange(item.id, 'availability', 'AVAILABLE')}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                              edit.availability === 'AVAILABLE'
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            Available
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditChange(item.id, 'availability', 'PARTIAL')}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                              edit.availability === 'PARTIAL'
                                ? 'bg-cyan-600 border-cyan-600 text-white shadow-sm'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            Partial
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditChange(item.id, 'availability', 'UNAVAILABLE')}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                              edit.availability === 'UNAVAILABLE'
                                ? 'bg-rose-600 border-rose-600 text-white shadow-sm'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            Out of Stock
                          </button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      {isLocked ? (
                        <div className="text-[11px] text-slate-500 font-medium space-y-0.5">
                          <p><span className="font-light">Dispensed In-House:</span> <span className="font-bold text-slate-800 dark:text-white">{item.dispensed_qty ?? 0}</span></p>
                          <p><span className="font-light">External Purchase:</span> <span className="font-bold text-slate-800 dark:text-white">{Math.max(0, (item.prescribed_qty || 0) - (item.dispensed_qty || 0))}</span></p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-w-[150px]">
                          {edit.availability === 'PARTIAL' && (
                            <div className="flex items-center gap-2">
                              <Label className="text-[10px] font-medium text-slate-400 w-20 shrink-0">In-house Qty:</Label>
                              <Input
                                type="number"
                                className="h-7 py-0.5 px-2 text-xs rounded-lg text-slate-800"
                                min={1}
                                max={(item.prescribed_qty || item.prescribed_quantity || 1) - 1}
                                value={edit.partialAvailableQty}
                                onChange={(e) => {
                                  const prescribedQty = item.prescribed_qty || item.prescribed_quantity || 1;
                                  const val = Math.min(prescribedQty - 1, Math.max(1, Number(e.target.value) || 1));
                                  handleEditChange(item.id, 'partialAvailableQty', val);
                                  handleEditChange(item.id, 'externalQty', prescribedQty - val);
                                }}
                              />
                            </div>
                          )}
                          {(edit.availability === 'PARTIAL' || edit.availability === 'UNAVAILABLE') && (
                            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-medium bg-rose-50/50 p-1.5 rounded-lg border border-rose-100/60">
                              <AlertCircle className="h-3 w-3 text-rose-500 shrink-0" />
                              <span>External Qty: <strong className="text-slate-800">{edit.externalQty}</strong></span>
                            </div>
                          )}
                          {edit.availability === 'AVAILABLE' && (
                            <span className="text-[10px] text-emerald-600 font-medium">Full In-house Fulfillment</span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="pr-6 py-4">
                      {isLocked ? (
                        <span className="text-xs text-slate-500 italic font-light">{item.pharmacist_notes || '—'}</span>
                      ) : (
                        <Input
                          placeholder="Add comments..."
                          className="h-8 text-xs rounded-xl bg-slate-50 border-none"
                          value={edit.pharmacistNotes}
                          onChange={(e) => handleEditChange(item.id, 'pharmacistNotes', e.target.value)}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Contextual Bottom Action Board */}
      <Card className="rounded-2xl border-slate-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-950 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                {order.status === 'PENDING' && "Step 1: stock availability verification"}
                {order.status === 'VERIFIED' && "Step 2: Generate pharmacy billing"}
                {order.status === 'BILLED' && "Step 3: Awaiting invoice cashier payment"}
                {order.status === 'PAID' && "Step 4: Dispense matching inventory stock"}
                {order.status === 'DISPENSED' && "Fulfillment successfully completed ✓"}
                {order.status === 'CANCELLED' && "This medication order was cancelled"}
              </h4>
              <p className="text-xs text-slate-500 dark:text-gray-400 font-light max-w-xl">
                {order.status === 'PENDING' && "Match doctor's prescription items to real inventory levels. Specify if medicines are fully in stock, out of stock, or partial."}
                {order.status === 'VERIFIED' && "Pricing snapshots will be prepared. Click to generate order lines inside cashier's billing module."}
                {order.status === 'BILLED' && `Cashier invoice generated. System is polling cashier payment terminal every 12s. Ask the patient to settle billing at the cashier desk.`}
                {order.status === 'PAID' && "Invoice paid at cashier! Click Dispense to automatically deduct stock from inventory batches using FEFO priority."}
                {order.status === 'DISPENSED' && `Medications dispensed. Inventory counts correctly consumed. Print receipt below if required.`}
                {order.status === 'CANCELLED' && `This order is inactive. Cancelled by pharmacist executor.`}
              </p>
            </div>

            {/* Context Action Button Panel */}
            <div className="flex gap-3 shrink-0 w-full md:w-auto">
              {order.status === 'PENDING' && (
                <Button 
                  disabled={submitting}
                  className="w-full md:w-auto bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-6 py-2 rounded-xl text-xs font-bold gap-2"
                  onClick={handleVerifyStock}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Verify & Lock Stock
                </Button>
              )}

              {order.status === 'VERIFIED' && (
                <Button 
                  disabled={submitting}
                  className="w-full md:w-auto bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-6 py-2 rounded-xl text-xs font-bold gap-2"
                  onClick={handleGenerateInvoice}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                  Generate Cashier Invoice
                </Button>
              )}

              {order.status === 'BILLED' && (
                <div className="flex items-center gap-3 w-full md:w-auto bg-slate-50 dark:bg-gray-900 border border-slate-100 dark:border-gray-800 px-4 py-2 rounded-xl">
                  <RefreshCw className="h-4 w-4 text-indigo-600 animate-spin" />
                  <span className="text-xs font-bold text-slate-700 dark:text-gray-300">Awaiting Cashier Settlement...</span>
                </div>
              )}

              {order.status === 'PAID' && (
                <Button 
                  disabled={submitting}
                  className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-2 rounded-xl text-xs font-bold gap-2"
                  onClick={handleDispenseMedications}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Dispense & Stocks Out
                </Button>
              )}

              {order.status === 'DISPENSED' && (
                <Button 
                  variant="outline"
                  disabled={isGeneratingPdf}
                  className="w-full md:w-auto border-slate-200 text-slate-700 hover:bg-slate-50 px-6 py-2 rounded-xl text-xs font-bold gap-2"
                  onClick={handlePreviewReceipt}
                >
                  {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                  Print & Download Receipt
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cancellation Reason Modal */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-[420px] shadow-2xl border border-slate-100 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Cancel Prescription Order</h3>
              <p className="text-xs text-slate-400 font-light mt-1">
                This action is destructive and cannot be undone. Please supply a valid clinical or administrative justification.
              </p>
            </div>
            
            <textarea
              className="w-full border border-slate-150 rounded-2xl p-3 text-xs focus:ring-2 focus:ring-rose-200 outline-none text-slate-800"
              rows={4}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Patient purchased external variants instead, doctor retracted prescription..."
            />
            
            <div className="flex gap-3 justify-end mt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCancelDialog(false);
                  setCancelReason("");
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                disabled={submitting}
              >
                Close
              </Button>
              <Button
                onClick={handleCancelOrder}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
                disabled={submitting || !cancelReason.trim()}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ReportPreviewModal 
        isOpen={isPreviewOpen} 
        url={previewUrl} 
        onClose={() => {
          setIsPreviewOpen(false);
          if (previewUrl) {
            window.URL.revokeObjectURL(previewUrl);
            setPreviewUrl("");
          }
        }} 
        title="Pharmacy Fulfillment Invoice & Receipt"
      />
    </div>
  );
}

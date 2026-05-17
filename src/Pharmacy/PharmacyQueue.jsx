import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ClipboardList, Search, User, Calendar, Pill, 
  CheckCircle2, AlertCircle, ShoppingBag, Eye, RefreshCw, XCircle, ArrowRight
} from "lucide-react";
import { useSelector } from "react-redux";
import pharmacyAPI from "../api/pharmacyapi";
import toast from "react-hot-toast";

const statusTabs = [
  { id: 'ALL', label: 'All Orders' },
  { id: 'PENDING', label: 'Pending Verification' },
  { id: 'VERIFIED', label: 'Verified (Pending Bill)' },
  { id: 'BILLED', label: 'Billed (Unpaid)' },
  { id: 'PAID', label: 'Ready to Dispense' },
  { id: 'DISPENSED', label: 'Dispensed' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

export default function PharmacyQueue() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const hospitalId = user?.hospital_id;
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStatusTab, setActiveStatusTab] = useState("ALL");
  const [refreshing, setRefreshing] = useState(false);

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

  const fetchQueue = useCallback(async (showIndicator = false) => {
    if (!hospitalId) return;
    try {
      if (showIndicator) setRefreshing(true);
      else setLoading(true);
      
      const filterStatus = activeStatusTab === 'ALL' ? '' : activeStatusTab;
      const response = await pharmacyAPI.getQueue(hospitalId, filterStatus);
      setOrders(response || []);
    } catch (err) {
      console.error("Failed to load pharmacy queue", err);
      toast.error("Failed to refresh pharmacy queue");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hospitalId, activeStatusTab]);

  useEffect(() => {
    fetchQueue();
    
    // Set up auto-refresh every 30 seconds for real-time dashboard queue
    const interval = setInterval(() => {
      fetchQueue(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchQueue]);

  // Filtering based on patient name search locally
  const filteredOrders = orders.filter(order => {
    const patientName = order.patient?.patient_name || "";
    return patientName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100/50">PENDING VERIFICATION</Badge>;
      case 'VERIFIED':
        return <Badge className="bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100/50">VERIFIED</Badge>;
      case 'BILLED':
        return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100/50">BILLED / UNPAID</Badge>;
      case 'PAID':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/50 animate-pulse">READY TO DISPENSE</Badge>;
      case 'DISPENSED':
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/50">DISPENSED</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/50">CANCELLED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getActionButton = (order) => {
    const btnBaseClass = "h-8 px-3 rounded-lg text-xs font-semibold gap-1.5 flex items-center justify-center transition-all duration-300";
    
    switch (order.status) {
      case 'PENDING':
        return (
          <Button 
            size="sm" 
            className={`${btnBaseClass} bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white`}
            onClick={() => navigate(`/pharmacy/orders/${order.id}`)}
          >
            <Pill className="h-3.5 w-3.5" />
            Verify Stock
          </Button>
        );
      case 'VERIFIED':
        return (
          <Button 
            size="sm" 
            className={`${btnBaseClass} bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white`}
            onClick={() => navigate(`/pharmacy/orders/${order.id}`)}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Generate Bill
          </Button>
        );
      case 'BILLED':
        return (
          <Button 
            size="sm" 
            variant="outline"
            className={`${btnBaseClass} border-indigo-200 text-indigo-700 hover:bg-indigo-50/50`}
            onClick={() => navigate(`/pharmacy/orders/${order.id}`)}
          >
            <RefreshCw className="h-3 w-3 animate-spin-slow" />
            Awaiting Payment
          </Button>
        );
      case 'PAID':
        return (
          <Button 
            size="sm" 
            className={`${btnBaseClass} bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white`}
            onClick={() => navigate(`/pharmacy/orders/${order.id}`)}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Dispense
          </Button>
        );
      default:
        return (
          <Button 
            size="sm" 
            variant="ghost" 
            className={`${btnBaseClass} hover:bg-slate-100 text-slate-600`}
            onClick={() => navigate(`/pharmacy/orders/${order.id}`)}
          >
            <Eye className="h-3.5 w-3.5" />
            View Detail
          </Button>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Tabs Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-950 p-4 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 md:pb-0">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveStatusTab(tab.id);
                setLoading(true);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
                activeStatusTab === tab.id
                  ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-gray-800/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="relative min-w-[280px]">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by patient name..."
            className="pl-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-slate-300 dark:bg-gray-900 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table Queue Card */}
      <Card className="border border-slate-100 dark:border-gray-800 shadow-sm overflow-hidden rounded-2xl">
        <CardHeader className="bg-white dark:bg-gray-950 border-b border-slate-50 dark:border-gray-800 px-6 py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            <ClipboardList className="h-4 w-4 text-indigo-500" />
            Fulfillment Queue
            {refreshing && <span className="text-[10px] font-normal text-slate-400 animate-pulse ml-2">(Refreshing...)</span>}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 rounded-lg text-slate-500 hover:text-slate-800"
            onClick={() => fetchQueue(true)}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-600 dark:text-gray-400">Fetching live queue...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-gray-950">
              <Pill className="h-14 w-14 text-slate-200 dark:text-gray-800 mx-auto mb-4 animate-bounce-slow" />
              <p className="text-slate-500 dark:text-gray-400 font-semibold text-sm">No pharmacy orders in this queue status</p>
              <p className="text-xs text-slate-400 mt-1">Prescriptions submitted by doctors show up here in real-time.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 dark:bg-gray-900/50 hover:bg-slate-50/50 border-b border-slate-100 dark:border-gray-800">
                  <TableHead className="font-bold text-slate-700 dark:text-gray-300 py-4 pl-6">Order ID</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-gray-300 py-4">Patient Details</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-gray-300 py-4">Consultation Doctor</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-gray-300 py-4 text-center">Medicines</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-gray-300 py-4">Ordered Date</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-gray-300 py-4">Status</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-gray-300 py-4 text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const displayId = `PHM-${order.id.slice(0, 8).toUpperCase()}`;
                  const createdDate = new Date(order.created_at);
                  const itemsCount = order.items?.length || 0;

                  return (
                    <TableRow key={order.id} className="hover:bg-slate-50/40 dark:hover:bg-gray-900/40 transition-colors border-b border-slate-100 dark:border-gray-800">
                      <TableCell className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 pl-6 py-4">
                        {displayId}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 text-sm">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            {order.patient?.patient_name || 'Anonymous'}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-gray-400 font-light mt-0.5 pl-5">
                            {order.patient?.gender || 'N/A'}, {calculateAge(order.patient?.dob)} yrs • {order.patient?.contact_info || 'No Phone'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-slate-600 dark:text-gray-300 text-xs font-medium">
                          {order.doctor_name || 'Assigned Physician'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 dark:bg-gray-800 dark:text-gray-300">
                          {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col text-xs text-slate-500 dark:text-gray-400">
                          <span className="font-medium">{createdDate.toLocaleDateString()}</span>
                          <span className="font-light text-[10px] mt-0.5">{createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell className="text-right pr-6 py-4">
                        <div className="flex items-center justify-end">
                          {getActionButton(order)}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

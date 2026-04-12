import React, { useState, useEffect } from "react";
import { 
  TrendingUp, TrendingDown, DollarSign, Users, 
  ArrowUpRight, ArrowDownRight, Filter, Calendar, 
  Download, PieChart as PieChartIcon, BarChart3, 
  CreditCard, Banknote, Smartphone, Receipt, 
  Loader2, ChevronRight, Stethoscope
} from "lucide-react";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import paymentsAPI from "../api/paymentsapi";
import { format, subDays, startOfMonth, endOfMonth, startOfToday } from "date-fns";
import toast from "react-hot-toast";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

import * as XLSX from "xlsx";

const RevenueDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState("today");
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [dateRange, setDateRange] = useState({
    start: format(startOfToday(), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  const fetchData = async (page = 1) => {
    try {
      setLoading(page === 1); // Only show full loader on first load/date change
      const response = await paymentsAPI.getRevenueSummary(dateRange.start, dateRange.end, page, itemsPerPage);
      setData(response.data || response);
      setCurrentPage(page);
    } catch (error) {
      console.error("Failed to fetch revenue data", error);
      toast.error("Failed to load revenue analytics");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!data) return;
    
    const fileName = `revenue_report_${format(new Date(), 'yyyy-MM-dd')}`;
    
    // 1. Prepare Export Data (Transactions)
    const exportData = data.recentTransactions.map(tx => ({
      Transaction_ID: `TX-${tx.id.slice(0, 8).toUpperCase()}`,
      Patient: tx.patientName,
      Amount: tx.amount,
      Mode: tx.mode,
      Doctor: tx.doctor,
      Date: format(new Date(tx.date), 'yyyy-MM-dd HH:mm')
    }));

    // 2. Create Sheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Revenue Report");
    
    // 3. Trigger Download
    XLSX.writeFile(wb, `${fileName}.csv`);
    toast.success("CSV Report downloaded");
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    let start = dateRange.start;
    let end = format(new Date(), 'yyyy-MM-dd');

    if (newPeriod === "today") {
      start = format(startOfToday(), 'yyyy-MM-dd');
    } else if (newPeriod === "last7") {
      start = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    } else if (newPeriod === "thisMonth") {
      start = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    }

    setDateRange({ start, end });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-gray-500 font-medium animate-pulse">Analyzing financial records...</p>
        </div>
      </div>
    );
  }

  // --- Chart Data Preparation ---
  const lineChartData = {
    labels: data?.trend?.map(t => format(new Date(t.date), 'MMM dd')) || [],
    datasets: [{
      label: 'Daily Revenue (₹)',
      data: data?.trend?.map(t => t.amount) || [],
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#2563eb',
    }]
  };

  const doughnutData = {
    labels: data?.breakdown?.map(b => b.mode.toUpperCase()) || [],
    datasets: [{
      data: data?.breakdown?.map(b => b.amount) || [],
      backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#6366f1', '#ef4444'],
      hoverOffset: 10,
      borderWidth: 0
    }]
  };

  const barChartData = {
    labels: data?.breakdown?.map(b => b.mode.toUpperCase()) || [],
    datasets: [{
      label: 'Volume (#)',
      data: data?.breakdown?.map(b => b.count) || [],
      backgroundColor: '#3b82f6',
      borderRadius: 8
    }]
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-600" /> Revenue Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Financial performance and collection insights</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-gray-900 p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          {[
            { id: "today", label: "Today" },
            { id: "last7", label: "7 Days" },
            { id: "thisMonth", label: "Month" },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => handlePeriodChange(p.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                period === p.id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none" 
                  : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {p.label}
            </button>
          ))}
          <div className="h-6 w-[1px] bg-gray-200 dark:bg-gray-800 mx-1" />
          <button 
            onClick={handleDownload}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 transition-colors"
            title="Download CSV Report"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard 
          title="Total Revenue" 
          value={`₹${data?.summary?.totalRevenue?.toLocaleString('en-IN')}`} 
          icon={<DollarSign className="w-6 h-6" />}
          color="bg-blue-600"
          explanation="The total monetary value collected over the selected period."
        />
        <KpiCard 
          title="Total Collections" 
          value={data?.summary?.totalTransactions} 
          icon={<Receipt className="w-6 h-6" />}
          color="bg-emerald-500"
          explanation="The total number of individual payments processed."
        />
        <KpiCard 
          title="Avg. Ticket Size" 
          value={`₹${Math.round(data?.summary?.avgTransactionValue || 0)?.toLocaleString('en-IN')}`} 
          icon={<TrendingUp className="w-6 h-6" />}
          color="bg-amber-500"
          explanation="The average amount collected per patient transaction."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-xl">
          <div className="flex items-center justify-between mb-8">
             <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Revenue Trend</h3>
                <p className="text-sm text-gray-400 font-medium">Daily collection overview</p>
             </div>
          </div>
          <div className="h-[400px]">
            <Line 
              data={lineChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                  x: { grid: { display: false } }
                }
              }} 
            />
          </div>
        </div>

        {/* Collection Modes Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-xl flex flex-col items-center">
          <div className="w-full text-left mb-8">
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Payment Modes</h3>
            <p className="text-sm text-gray-400 font-medium">Revenue split by source</p>
          </div>
          <div className="w-full max-w-[280px] aspect-square mb-8">
             <Doughnut 
              data={doughnutData} 
              options={{ cutout: '75%', plugins: { legend: { display: false } } }} 
             />
          </div>
          <div className="w-full space-y-4">
            {data?.breakdown?.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm group">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: doughnutData.datasets[0].backgroundColor[i] }} />
                  <span className="font-bold text-gray-600 dark:text-gray-400 group-hover:text-blue-600 transition-colors uppercase text-xs">{item.mode}</span>
                </div>
                <span className="font-black text-gray-900 dark:text-white">₹{item.amount.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent High-Value Transactions */}
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
           <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Recent Ledger</h3>
              <p className="text-sm text-gray-400 font-medium">Live transaction activity</p>
           </div>
           <div className="flex items-center gap-4">
             {data?.recentTransactions?.length > 5 && (
               <button 
                 onClick={() => setShowAllTransactions(!showAllTransactions)}
                 className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline"
               >
                 {showAllTransactions ? "Show Less" : "View All"}
               </button>
             )}
           </div>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-left">
              <thead>
                 <tr className="border-b border-gray-50 dark:border-gray-800">
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Patient</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Mode</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Provider</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                 {data?.recentTransactions?.slice(0, showAllTransactions ? undefined : 5).map((tx, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                       <td className="px-8 py-5">
                          <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">TX-{tx.id.slice(0, 8).toUpperCase()}</div>
                          <div className="text-[10px] font-medium text-gray-400">{format(new Date(tx.date), 'MMM dd, HH:mm')}</div>
                       </td>
                       <td className="px-8 py-5 text-sm font-bold text-gray-700 dark:text-gray-300">
                           {tx.patientName}
                       </td>
                       <td className="px-8 py-5">
                          <div className="text-sm font-black text-gray-900 dark:text-white">₹{tx.amount.toLocaleString('en-IN')}</div>
                       </td>
                       <td className="px-8 py-5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter ${
                            tx.mode === 'online' || tx.mode === 'digital' ? "bg-blue-50 text-blue-600 dark:bg-blue-900/10" :
                            tx.mode === 'cash' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/10" : "bg-gray-100 text-gray-600 dark:bg-gray-800 text-gray-400"
                          }`}>
                             {tx.mode}
                          </span>
                       </td>
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm" />
                             <span className="text-xs font-bold text-gray-500">{tx.doctor}</span>
                          </div>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
           
           {/* Pagination Footer */}
           {data?.pagination?.totalPages > 1 && (
              <div className="p-6 bg-gray-50/50 dark:bg-gray-800/20 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                <p className="text-xs font-bold text-gray-400">
                  Showing page <span className="text-gray-900 dark:text-white">{data.pagination.page}</span> of <span className="text-gray-900 dark:text-white">{data.pagination.totalPages}</span>
                </p>
                <div className="flex items-center gap-2">
                   <button 
                     disabled={data.pagination.page <= 1}
                     onClick={() => fetchData(data.pagination.page - 1)}
                     className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-600 disabled:opacity-30"
                   >
                     Previous
                   </button>
                   <button 
                     disabled={data.pagination.page >= data.pagination.totalPages}
                     onClick={() => fetchData(data.pagination.page + 1)}
                     className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-600 disabled:opacity-30"
                   >
                     Next
                   </button>
                </div>
              </div>
           )}

           {(!data?.recentTransactions || data.recentTransactions.length === 0) && (
              <div className="py-20 text-center flex flex-col items-center">
                 <Receipt className="w-12 h-12 text-gray-100 dark:text-gray-800 mb-4" />
                 <p className="text-gray-400 font-bold">No transactions logged for this period</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

// --- Helper Components ---

const KpiCard = ({ title, value, icon, color, explanation }) => (
  <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl transition-all hover:translate-y-[-4px]">
    <div className={`p-4 ${color} rounded-2xl w-fit text-white mb-6 shadow-lg shadow-gray-100 dark:shadow-none`}>
       {icon}
    </div>
    <div className="space-y-1">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
      <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{value}</div>
      {explanation && <p className="text-[11px] text-gray-500 font-medium leading-tight pt-1">{explanation}</p>}
    </div>
  </div>
);

const Card = ({ children, className = "" }) => (
  <div className={`rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-6 ${className}`}>
    {children}
  </div>
);

const ShieldCheck = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>
  </svg>
);

export default RevenueDashboard;

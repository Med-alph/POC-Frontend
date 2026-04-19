import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Search, UserCircle2, Phone, CalendarDays, FileText, ArrowRight, Loader2, RefreshCw, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import patientsAPI from "../api/patientsapi";
import { useDebounce } from "../hooks/useDebounce";
import toast from "react-hot-toast";

export default function PatientRecordsList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 12;
  
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const hospitalId = user?.hospital_id;

  const fetchPatients = async () => {
    if (!hospitalId) return;
    try {
      setLoading(true);
      const params = {
        hospital_id: hospitalId,
        limit: PAGE_SIZE,
        offset: (currentPage - 1) * PAGE_SIZE,
        search: debouncedSearch
      };
      const result = await patientsAPI.getAll(params);
      setPatients(result?.data || []);
      setTotalCount(result?.total || 0);
    } catch (err) {
      console.error("Error fetching patients:", err);
      toast.error("Failed to load patient directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [hospitalId, debouncedSearch, currentPage]);

  const handlePatientClick = (patientId) => {
    navigate(`/doctor-patient-record/${patientId}`);
  };

  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" /> Patient Directory
            </h1>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Access total clinical history for all hospital records</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={fetchPatients} disabled={loading} className="rounded-xl font-bold uppercase text-[10px] tracking-widest">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="border-0 shadow-lg bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search patient records by name, phone, or insurance ID..."
                className="pl-12 h-14 bg-gray-50 dark:bg-gray-700/50 border-0 rounded-xl font-bold text-lg focus-visible:ring-blue-500 transition-all shadow-inner"
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page on search
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Results Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Scanning Repository...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-20 text-center border-2 border-dashed border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase">No records found</h3>
            <p className="text-gray-500 font-bold mt-2">Try searching with a different name or phone number.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients.map((patient) => (
              <Card 
                key={patient.id} 
                className="group border-0 shadow-sm hover:shadow-2xl transition-all duration-300 bg-white dark:bg-gray-800 rounded-3xl border-b-4 border-transparent hover:border-blue-500 overflow-hidden"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-black text-xl group-hover:scale-110 transition-transform">
                      {patient.patient_name?.charAt(0) || "P"}
                    </div>
                    <Badge variant="outline" className="rounded-lg font-black uppercase tracking-tight py-1 px-3 bg-gray-50 text-gray-400 border-gray-100">
                        {patient.patient_code || 'REG-USER'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 mb-6">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase truncate">{patient.patient_name}</h3>
                    <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-gray-400">
                       <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {calculateAge(patient.dob)} YRS</span>
                       <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                       <span className="flex items-center gap-1"><UserCircle2 className="h-3 w-3" /> {patient.gender || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gray-50 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-gray-400 font-bold uppercase text-[10px] tracking-widest"><Phone className="h-3 w-3" /> Contact</span>
                        <span className="font-bold text-gray-700 dark:text-gray-300">{patient.contact_info || "Not set"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-gray-400 font-bold uppercase text-[10px] tracking-widest"><FileText className="h-3 w-3" /> Last Visit</span>
                        <span className="font-bold text-blue-600">{patient.last_visit ? new Date(patient.last_visit).toLocaleDateString() : 'New Entry'}</span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => handlePatientClick(patient.id)}
                    className="w-full mt-6 h-12 rounded-2xl bg-gray-900 hover:bg-blue-600 text-white font-black uppercase tracking-widest text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Open Full History <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalCount > PAGE_SIZE && (
          <div className="flex items-center justify-center gap-4 py-8">
            <Button 
              variant="outline" 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-xl font-black uppercase text-[10px] tracking-widest"
            >
              Previous
            </Button>
            <div className="px-5 py-2 bg-white dark:bg-gray-800 rounded-xl font-black text-sm shadow-sm">
                Page {currentPage} of {Math.ceil(totalCount / PAGE_SIZE)}
            </div>
            <Button 
              variant="outline"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage >= Math.ceil(totalCount / PAGE_SIZE)}
              className="rounded-xl font-black uppercase text-[10px] tracking-widest"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Syringe, CheckCircle, Clock, AlertCircle, Loader2, Download, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import pediatricsAPI from "../api/pediatricsapi";
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const PatientVaccinePanel = ({ patient }) => {
    const [vaccines, setVaccines] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (patient?.id) fetchVaccines();
    }, [patient?.id]);

    const fetchVaccines = async () => {
        try {
            setLoading(true);
            const data = await pediatricsAPI.getVaccines(patient.id);
            setVaccines(data);
        } catch (err) {
            console.error("Failed to fetch vaccines:", err);
            toast.error("Failed to load immunization records");
        } finally {
            setLoading(false);
        }
    };

    const downloadVaccineCard = () => {
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(20);
        doc.setTextColor(30, 58, 138); // Indigo-900
        doc.text("Immunization Record", 105, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 28, { align: 'center' });
        
        // Patient Info
        doc.setDrawColor(226, 232, 240);
        doc.line(14, 35, 196, 35);

        doc.setFontSize(10);
        doc.setTextColor(40);
        doc.setFont(undefined, 'bold');
        doc.text("PATIENT DETAILS", 14, 45);
        doc.setFont(undefined, 'normal');
        
        doc.text(`Name: ${patient?.name || patient?.patient_name || 'N/A'}`, 14, 52);
        doc.text(`UHID: ${patient?.uhid || 'N/A'}`, 14, 58);
        doc.text(`DOB: ${patient?.dob ? new Date(patient.dob).toLocaleDateString() : 'N/A'}`, 105, 52);
        doc.text(`Gender: ${patient?.gender || 'N/A'}`, 105, 58);

        doc.line(14, 65, 196, 65);

        // Table
        const tableData = vaccines.map(v => [
            v.name,
            v.dose_number || 'N/A',
            v.administered ? 'Completed' : v.status,
            v.administered ? v.administered_date : v.due_date,
            v.administered ? (v.batch_number || '-') : '-'
        ]);

        autoTable(doc, {
            startY: 75,
            head: [['Vaccine', 'Dose', 'Status', 'Date', 'Batch']],
            body: tableData,
            headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
            alternateRowStyles: { fillColor: [248, 250, 252] },
        });

        const today = new Date().toISOString().split('T')[0];
        const fileName = `Immunization_Record_${patient?.name?.replace(/\s+/g, '_') || 'Patient'}_${today}.pdf`;
        doc.save(fileName);
        toast.success("Vaccine card downloaded");
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-sm font-medium text-slate-500">Loading records...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">My Immunization</h2>
                    <p className="text-sm text-slate-500">View and track your child's vaccination history.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border border-emerald-100 bg-emerald-50/30">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-emerald-700 uppercase">Completed</p>
                            <p className="text-2xl font-bold text-emerald-900">{vaccines.filter(v => v.administered).length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border border-amber-100 bg-amber-50/30">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-amber-700 uppercase">Upcoming</p>
                            <p className="text-2xl font-bold text-amber-900">{vaccines.filter(v => !v.administered && v.status !== 'Overdue').length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border border-red-100 bg-red-50/30">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-red-700 uppercase">Overdue</p>
                            <p className="text-2xl font-bold text-red-900">{vaccines.filter(v => v.status === 'Overdue').length}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border border-slate-200/60 shadow-sm bg-white rounded-[2rem] overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-6 bg-slate-50/50">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-800">
                        <Syringe className="h-5 w-5 text-indigo-500" />
                        Vaccination Timeline
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/30">
                            <TableRow>
                                <TableHead className="pl-6">Vaccine</TableHead>
                                <TableHead>Dose</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="pr-6">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vaccines.map((v) => (
                                <TableRow key={v.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-medium text-slate-900 pl-6">{v.name}</TableCell>
                                    <TableCell className="text-slate-600">{v.dose_number}</TableCell>
                                    <TableCell className="text-slate-600">
                                        {v.administered ? v.administered_date : v.due_date}
                                    </TableCell>
                                    <TableCell className="pr-6">
                                        {v.administered ? (
                                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 rounded-lg">
                                                <CheckCircle className="h-3 w-3" /> Completed
                                            </Badge>
                                        ) : v.status === 'Overdue' ? (
                                            <Badge className="bg-red-50 text-red-700 border-red-200 gap-1 rounded-lg">
                                                <AlertCircle className="h-3 w-3" /> Overdue
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-amber-50 text-amber-700 border-amber-200 gap-1 rounded-lg">
                                                <Clock className="h-3 w-3" /> Upcoming
                                            </Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex gap-3">
                <Info className="h-5 w-5 text-indigo-500 shrink-0" />
                <p className="text-xs text-indigo-700 leading-relaxed">
                    This immunization record follows the latest clinical guidelines. Please consult your pediatrician if you have questions about specific doses or intervals.
                </p>
            </div>
        </div>
    );
};

export default PatientVaccinePanel;

import React, { useState, useEffect } from 'react';
import { Syringe, CheckCircle, Clock, AlertCircle, Plus, Loader2, Info, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import pediatricsAPI from "../../api/pediatricsapi";
import toast from 'react-hot-toast';

const VaccinePanel = ({ patientId, onUpdate }) => {
    const [vaccines, setVaccines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [administering, setAdministering] = useState(null);
    const [formData, setFormData] = useState({
        batch_number: '',
        site: '',
        administered_date: new Date().toISOString().split('T')[0]
    });
    const [submitting, setSubmitting] = useState(false);
    const [remindingId, setRemindingId] = useState(null);

    const handleRemind = async (v) => {
        try {
            setRemindingId(v.id);
            await pediatricsAPI.remindVaccine(patientId, v.id);
            toast.success(`Reminder sent for ${v.name}`);
        } catch (err) {
            toast.error("Failed to send reminder");
        } finally {
            setRemindingId(null);
        }
    };

    useEffect(() => {
        fetchVaccines();
    }, [patientId]);

    const fetchVaccines = async () => {
        try {
            setLoading(true);
            const data = await pediatricsAPI.getVaccines(patientId);
            setVaccines(data);
        } catch (err) {
            console.error("Failed to fetch vaccines:", err);
            toast.error("Failed to load vaccine schedule");
        } finally {
            setLoading(false);
        }
    };

    const handleAdminister = async () => {
        if (!formData.batch_number || !formData.site) {
            toast.error("Please fill all required fields");
            return;
        }

        try {
            setSubmitting(true);
            await pediatricsAPI.administerVaccine(patientId, {
                vaccine_id: administering.id,
                ...formData
            });
            toast.success(`${administering.name} administered successfully`);
            setAdministering(null);
            setFormData({ batch_number: '', site: '', administered_date: new Date().toISOString().split('T')[0] });
            fetchVaccines();
            if (onUpdate) onUpdate(); // Refresh parent (e.g. for ChildHeader)
        } catch (err) {
            toast.error(err.message || "Failed to administer vaccine");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-sm font-medium text-slate-500">Loading vaccine schedule...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border border-slate-200/60 shadow-sm bg-white rounded-[2rem] overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-6 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-800">
                            <Syringe className="h-5 w-5 text-indigo-500" />
                            Immunization Schedule (IAP 2024)
                        </CardTitle>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Administered
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                <div className="w-2 h-2 rounded-full bg-amber-500"></div> Due
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div> Overdue
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/30">
                            <TableRow>
                                <TableHead className="w-[300px] pl-6">Vaccine Name</TableHead>
                                <TableHead>Dose</TableHead>
                                <TableHead>Recommended Age</TableHead>
                                <TableHead>Status / Due Date</TableHead>
                                <TableHead className="text-right pr-6">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vaccines.map((v) => (
                                <TableRow key={v.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-medium text-slate-900 pl-6">
                                        <div className="flex flex-col">
                                            <span>{v.name}</span>
                                            {v.administered && (
                                                <span className="text-[10px] text-slate-400 font-normal mt-0.5">
                                                    Batch: {v.batch_number} • Site: {v.site}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-600">{v.dose_number || 'N/A'}</TableCell>
                                    <TableCell className="text-slate-600 text-sm">
                                        {v.min_age_weeks === 0 ? 'At Birth' : `${v.min_age_weeks} Weeks`}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {v.administered ? (
                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 rounded-lg py-1">
                                                    <CheckCircle className="h-3 w-3" /> {v.administered_date}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className={`rounded-lg py-1 gap-1 ${
                                                    v.status === 'Overdue' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}>
                                                    <Clock className="h-3 w-3" /> {v.due_date}
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        {!v.administered ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="rounded-xl border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700 h-8 w-8 p-0"
                                                    onClick={() => handleRemind(v)}
                                                    disabled={remindingId === v.id}
                                                    title="Send Reminder"
                                                >
                                                    {remindingId === v.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 font-medium"
                                                    onClick={() => setAdministering(v)}
                                                >
                                                    <Plus className="h-4 w-4 mr-1" /> Administer
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="text-emerald-600 flex items-center justify-end gap-1 font-medium text-sm">
                                                <CheckCircle className="h-4 w-4" /> Done
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!administering} onOpenChange={() => setAdministering(null)}>
                <DialogContent className="sm:max-w-md rounded-[2rem] p-6 shadow-2xl bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Syringe className="h-5 w-5 text-indigo-500" />
                            Administer {administering?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="batch" className="text-sm font-semibold text-slate-700">Batch Number</Label>
                            <Input 
                                id="batch" 
                                placeholder="e.g. VN-2024-001" 
                                className="rounded-xl border-slate-200"
                                value={formData.batch_number}
                                onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="site" className="text-sm font-semibold text-slate-700">Site</Label>
                                <Input 
                                    id="site" 
                                    placeholder="e.g. Left Thigh" 
                                    className="rounded-xl border-slate-200"
                                    value={formData.site}
                                    onChange={(e) => setFormData({...formData, site: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date" className="text-sm font-semibold text-slate-700">Date</Label>
                                <Input 
                                    id="date" 
                                    type="date" 
                                    className="rounded-xl border-slate-200"
                                    value={formData.administered_date}
                                    onChange={(e) => setFormData({...formData, administered_date: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex gap-3">
                            <Info className="h-5 w-5 text-blue-500 shrink-0" />
                            <p className="text-xs text-blue-700 leading-relaxed">
                                Ensure the vaccine batch is checked for expiration and the cold chain integrity is verified before administration.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAdministering(null)} className="rounded-xl font-medium border-slate-200">Cancel</Button>
                        <Button 
                            onClick={handleAdminister} 
                            disabled={submitting} 
                            className="rounded-xl font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                        >
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                            Confirm Administration
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default VaccinePanel;

import React, { useState, useEffect } from 'react';
import { Syringe, CheckCircle2, Clock, AlertCircle, Loader2, Save, CheckCircle, Info } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import pediatricsAPI from "../../api/pediatricsapi";
import toast from 'react-hot-toast';

const VaccineConsultationWidget = ({ patientId, appointmentId }) => {
    const [dueVaccines, setDueVaccines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [administering, setAdministering] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        batch_number: '',
        site: '',
        administered_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (patientId) fetchSchedule();
    }, [patientId]);

    const fetchSchedule = async () => {
        try {
            setLoading(true);
            const schedule = await pediatricsAPI.getVaccineSchedule(patientId);
            // Filter for vaccines that are either OVERDUE or DUE TODAY (Case-insensitive)
            const actionable = schedule.filter(v => 
                v.status?.toUpperCase() === 'OVERDUE' || 
                v.status?.toUpperCase() === 'DUE'
            );
            setDueVaccines(actionable);
        } catch (err) {
            console.error("Failed to fetch vaccine widget data:", err);
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
                ...formData,
                appointment_id: appointmentId
            });
            toast.success(`${administering.name} administered successfully`);
            setAdministering(null);
            setFormData({ batch_number: '', site: '', administered_date: new Date().toISOString().split('T')[0] });
            fetchSchedule();
        } catch (err) {
            toast.error(err.message || "Failed to administer vaccine");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
    );

    if (dueVaccines.length === 0) return (
        <div className="p-6 text-center bg-emerald-50/50 rounded-3xl border border-emerald-100 border-dashed">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-emerald-800">Immunization Up to Date</p>
            <p className="text-xs text-emerald-600 mt-0.5">No vaccines are due for this visit.</p>
        </div>
    );

    return (
        <>
            <Card className="border-none shadow-sm bg-indigo-50/30 rounded-3xl overflow-hidden">
                <CardHeader className="bg-white/50 border-b border-indigo-100/50 p-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-900">
                        <Syringe className="h-4 w-4 text-indigo-600" />
                        Vaccines Due Today
                    </CardTitle>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className="text-[10px] font-medium text-slate-500 uppercase">Overdue</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-[10px] font-medium text-slate-500 uppercase">Due</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                    {dueVaccines.map((v) => (
                        <div key={v.id} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-indigo-100 shadow-sm transition-all hover:border-indigo-300">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${v.status?.toUpperCase() === 'OVERDUE' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                    {v.status?.toUpperCase() === 'OVERDUE' ? <AlertCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">{v.name}</p>
                                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{v.dose_number}</p>
                                </div>
                            </div>
                            <Button 
                                size="sm" 
                                variant={v.status?.toUpperCase() === 'OVERDUE' ? 'destructive' : 'default'}
                                className={`h-8 text-[10px] font-bold rounded-xl px-4 ${v.status?.toUpperCase() === 'OVERDUE' ? '' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                onClick={() => setAdministering(v)}
                            >
                                Administer
                            </Button>
                        </div>
                    ))}
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
        </>
    );
};

export default VaccineConsultationWidget;

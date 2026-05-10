import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Activity, Plus, Loader2 } from 'lucide-react';
import pediatricsAPI from "../../api/pediatricsapi";
import toast from 'react-hot-toast';

const GrowthConsultationWidget = ({ patientId, onSave }) => {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        weight: '',
        height: '',
        head_circumference: ''
    });

    const handleSave = async () => {
        if (!formData.weight || !formData.height) {
            toast.error("Weight and Height are required.");
            return;
        }

        try {
            setSubmitting(true);
            await pediatricsAPI.saveGrowthEntry(patientId, formData);
            toast.success("Growth data recorded.");
            setFormData({ weight: '', height: '', head_circumference: '' });
            if (onSave) onSave();
        } catch (error) {
            toast.error(error.message || "Failed to record growth data.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card className="border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden bg-white mb-4">
            <CardHeader className="border-b border-slate-100 p-4 bg-gradient-to-br from-indigo-50/50 to-white">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                    <Activity className="h-4 w-4 text-indigo-500" />
                    Quick Growth Entry
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
                <div className="flex gap-3">
                    <div className="flex-1 space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Weight (kg) *</label>
                        <Input 
                            type="number" 
                            step="0.1" 
                            className="h-8 text-sm" 
                            placeholder="kg"
                            value={formData.weight}
                            onChange={e => setFormData({...formData, weight: e.target.value})}
                        />
                    </div>
                    <div className="flex-1 space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Height (cm) *</label>
                        <Input 
                            type="number" 
                            step="0.1" 
                            className="h-8 text-sm" 
                            placeholder="cm"
                            value={formData.height}
                            onChange={e => setFormData({...formData, height: e.target.value})}
                        />
                    </div>
                </div>
                <div className="flex gap-3 items-end">
                    <div className="flex-1 space-y-1">
                        <label className="text-xs font-semibold text-slate-600">HC (cm)</label>
                        <Input 
                            type="number" 
                            step="0.1" 
                            className="h-8 text-sm" 
                            placeholder="Optional"
                            value={formData.head_circumference}
                            onChange={e => setFormData({...formData, head_circumference: e.target.value})}
                        />
                    </div>
                    <Button 
                        size="sm" 
                        className="h-8 px-4 bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={handleSave}
                        disabled={submitting}
                    >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default GrowthConsultationWidget;

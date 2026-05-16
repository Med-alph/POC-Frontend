import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Activity, Plus, TrendingUp, TrendingDown, Minus, Loader2, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import pediatricsAPI from "../../api/pediatricsapi";
import toast from 'react-hot-toast';
import ReportExportButton from "../../components/Reports/ReportExportButton";
import ReportPreviewModal from "../../components/Reports/ReportPreviewModal";

const GrowthPanel = ({ patientId, isParentView = false, patientDob }) => {
    const getDetailedAge = (dob, targetDate) => {
        if (!dob || !targetDate) return "N/A";
        const birthDate = new Date(dob);
        const tDate = new Date(targetDate);
        
        let years = tDate.getFullYear() - birthDate.getFullYear();
        let months = tDate.getMonth() - birthDate.getMonth();

        if (tDate.getDate() < birthDate.getDate()) {
            months--;
        }
        if (months < 0) {
            years--;
            months += 12;
        }

        const parts = [];
        if (years > 0) parts.push(`${years}y`);
        if (months > 0) parts.push(`${months}m`);
        if (parts.length === 0) return "< 1m";
        
        return parts.join(' ');
    };

    const [growthData, setGrowthData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    const [previewUrl, setPreviewUrl] = useState(null);
    
    const [formData, setFormData] = useState({
        weight: '',
        height: '',
        head_circumference: '',
        measurement_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (patientId) {
            fetchGrowthData();
        }
    }, [patientId]);

    const fetchGrowthData = async () => {
        try {
            setLoading(true);
            const data = await pediatricsAPI.getGrowthHistory(patientId);
            setGrowthData(data);
        } catch (error) {
            console.error("Error fetching growth data:", error);
            toast.error("Failed to load growth history.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEntry = async () => {
        if (!formData.weight || !formData.height) {
            toast.error("Weight and Height are required.");
            return;
        }

        try {
            setSubmitting(true);
            await pediatricsAPI.saveGrowthEntry(patientId, formData);
            toast.success("Growth record saved successfully.");
            setIsEntryModalOpen(false);
            setFormData({
                weight: '',
                height: '',
                head_circumference: '',
                measurement_date: new Date().toISOString().split('T')[0]
            });
            fetchGrowthData();
        } catch (error) {
            toast.error(error.message || "Failed to save growth record.");
        } finally {
            setSubmitting(false);
        }
    };

    const latestRecord = growthData.length > 0 ? growthData[growthData.length - 1] : null;
    const previousRecord = growthData.length > 1 ? growthData[growthData.length - 2] : null;

    const renderTrendIcon = (trend) => {
        if (trend === 'up') return <TrendingUp className="h-4 w-4 text-emerald-500 inline-block ml-1" />;
        if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500 inline-block ml-1" />;
        return <Minus className="h-4 w-4 text-slate-400 inline-block ml-1" />;
    };

    let status = "Normal Growth";
    let statusColor = "bg-slate-100 text-slate-700 border-slate-200";
    
    if (latestRecord) {
        if (latestRecord.weightTrend === 'up' && latestRecord.heightTrend === 'up') {
            status = "Growth Improving";
            statusColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
        } else if (latestRecord.weightTrend === 'down') {
            status = "Watch Growth";
            statusColor = "bg-amber-50 text-amber-700 border-amber-200";
        } else if (latestRecord.weightTrend === 'neutral' && growthData.length > 1) {
             status = "Growth Slowing";
             statusColor = "bg-blue-50 text-blue-700 border-blue-200";
        } else {
             status = "Normal Growth";
             statusColor = "bg-slate-50 text-slate-700 border-slate-200";
        }
    }

    let weightDiffStr = "";
    let heightDiffStr = "";
    if (latestRecord && previousRecord) {
        const wDiff = (latestRecord.weight - previousRecord.weight).toFixed(2);
        const hDiff = (latestRecord.height - previousRecord.height).toFixed(2);
        if (wDiff > 0) weightDiffStr = `↑ +${wDiff}kg since last visit`;
        else if (wDiff < 0) weightDiffStr = `↓ ${wDiff}kg since last visit`;
        else weightDiffStr = `Stable since last visit`;
        
        if (hDiff > 0) heightDiffStr = `↑ +${hDiff}cm since last visit`;
        else if (hDiff < 0) heightDiffStr = `↓ ${hDiff}cm since last visit`;
        else heightDiffStr = `Stable since last visit`;
    }

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-sm font-medium text-slate-500">Loading clinical growth data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50 to-white">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                        <div>
                            <p className="text-sm font-medium text-indigo-600/80 mb-1">Status</p>
                            {latestRecord ? (
                                <Badge variant="outline" className={`px-3 py-1 text-sm ${statusColor}`}>
                                    {status}
                                </Badge>
                            ) : (
                                <p className="text-lg font-bold text-slate-800">No Data</p>
                            )}
                        </div>
                        {latestRecord && (
                            <p className="text-[10px] font-medium text-slate-400 mt-3">
                                Last Updated: {formatDate(latestRecord.measurement_date)}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="border border-slate-100 shadow-sm">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Latest Weight</p>
                            <div className="flex items-center">
                                <span className="text-2xl font-bold text-slate-800">
                                    {latestRecord ? `${latestRecord.weight} kg` : '--'}
                                </span>
                                {latestRecord && renderTrendIcon(latestRecord.weightTrend)}
                            </div>
                        </div>
                        {weightDiffStr && (
                            <p className={`text-xs font-medium mt-2 ${weightDiffStr.includes('↑') ? 'text-emerald-600' : weightDiffStr.includes('↓') ? 'text-amber-600' : 'text-slate-500'}`}>
                                {weightDiffStr}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="border border-slate-100 shadow-sm">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Latest Height</p>
                            <div className="flex items-center">
                                <span className="text-2xl font-bold text-slate-800">
                                    {latestRecord ? `${latestRecord.height} cm` : '--'}
                                </span>
                                {latestRecord && renderTrendIcon(latestRecord.heightTrend)}
                            </div>
                        </div>
                        {heightDiffStr && (
                            <p className={`text-xs font-medium mt-2 ${heightDiffStr.includes('↑') ? 'text-emerald-600' : heightDiffStr.includes('↓') ? 'text-amber-600' : 'text-slate-500'}`}>
                                {heightDiffStr}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="border border-slate-100 shadow-sm">
                    <CardContent className="p-6 flex flex-col justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Latest BMI</p>
                            <span className="text-2xl font-bold text-slate-800">
                                {latestRecord ? latestRecord.bmi : '--'}
                            </span>
                        </div>
                        {!isParentView && (
                            <Button 
                                size="sm" 
                                className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm"
                                onClick={() => setIsEntryModalOpen(true)}
                            >
                                <Plus className="w-4 h-4 mr-1" /> Add Entry
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Combined Chart Section */}
            {growthData.length > 0 ? (
                <Card className="border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden bg-white">
                    <CardHeader className="border-b border-slate-100 p-6 bg-slate-50/50">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-800">
                            <Activity className="h-5 w-5 text-indigo-500" />
                            Growth Trend Analysis
                        </CardTitle>
                        <ReportExportButton 
                            type="GROWTH_REPORT" 
                            patientId={patientId} 
                            label="Export Trends"
                            onPreview={(url) => setPreviewUrl(url)}
                        />
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={growthData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis 
                                        dataKey="measurement_date" 
                                        tick={{ fill: '#64748B', fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={{ stroke: '#E2E8F0' }}
                                    />
                                    <YAxis 
                                        yAxisId="left" 
                                        tick={{ fill: '#3B82F6', fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                        label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', fill: '#3B82F6', style: { textAnchor: 'middle' } }}
                                    />
                                    <YAxis 
                                        yAxisId="right" 
                                        orientation="right" 
                                        tick={{ fill: '#10B981', fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                        label={{ value: 'Height (cm)', angle: 90, position: 'insideRight', fill: '#10B981', style: { textAnchor: 'middle' } }}
                                    />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                                        labelStyle={{ fontWeight: 'bold', color: '#1E293B', marginBottom: '4px' }}
                                        labelFormatter={(label) => `Age: ${getDetailedAge(patientDob, label)} (${formatDate(label)})`}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <ReferenceLine yAxisId="left" y={growthData.length > 0 ? (growthData.reduce((acc, curr) => acc + parseFloat(curr.weight), 0) / growthData.length) : 0} stroke="#94A3B8" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Avg Weight', fill: '#94A3B8', fontSize: 12 }} />
                                    <Line 
                                        yAxisId="left" 
                                        type="monotone" 
                                        name="Weight (kg)" 
                                        dataKey="weight" 
                                        stroke="#3B82F6" 
                                        strokeWidth={3} 
                                        activeDot={{ r: 6, strokeWidth: 0, fill: '#3B82F6' }} 
                                    />
                                    <Line 
                                        yAxisId="right" 
                                        type="monotone" 
                                        name="Height (cm)" 
                                        dataKey="height" 
                                        stroke="#10B981" 
                                        strokeWidth={3} 
                                        activeDot={{ r: 6, strokeWidth: 0, fill: '#10B981' }} 
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="p-12 text-center border border-dashed border-slate-300 rounded-2xl bg-slate-50">
                    <Activity className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-slate-800">No Growth Data Found</h3>
                    <p className="text-slate-500 mb-4 max-w-sm mx-auto">Track the patient's weight, height, and head circumference over time to visualize their growth trajectory.</p>
                </div>
            )}

            {/* History Table */}
            <Card className="border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardHeader className="border-b border-slate-100 p-6 bg-slate-50/50">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-800">
                        Clinical Growth History
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/30">
                            <TableRow>
                                <TableHead className="pl-6">Age / Date</TableHead>
                                <TableHead>Weight (kg)</TableHead>
                                <TableHead>Height (cm)</TableHead>
                                <TableHead>HC (cm)</TableHead>
                                <TableHead>BMI</TableHead>
                                <TableHead className="pr-6 text-right">Recorded By</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...growthData].reverse().map((record) => (
                                <TableRow key={record.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="pl-6">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900">Age: {getDetailedAge(patientDob, record.measurement_date)}</span>
                                            <span className="text-xs text-slate-500">{formatDate(record.measurement_date)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center font-medium">
                                            {record.weight}
                                            {renderTrendIcon(record.weightTrend)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center">
                                            {record.height}
                                            {renderTrendIcon(record.heightTrend)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-600">{record.head_circumference || '-'}</TableCell>
                                    <TableCell className="text-slate-600">
                                        <Badge variant="secondary" className="font-normal bg-slate-100 text-slate-700">{record.bmi}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right pr-6 text-sm text-slate-500 font-medium">
                                        {record.recorded_by}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {growthData.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                                        No growth records available.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Entry Dialog */}
            <Dialog open={isEntryModalOpen} onOpenChange={setIsEntryModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Activity className="h-5 w-5 text-indigo-500" />
                            New Growth Entry
                        </DialogTitle>
                        <DialogDescription>
                            Enter the latest measurements. BMI will be calculated automatically.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="weight" className="text-sm font-semibold text-slate-700">Weight (kg) *</Label>
                                <Input 
                                    id="weight" 
                                    type="number" 
                                    step="0.1"
                                    placeholder="e.g. 12.5" 
                                    className="rounded-xl"
                                    value={formData.weight}
                                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="height" className="text-sm font-semibold text-slate-700">Height (cm) *</Label>
                                <Input 
                                    id="height" 
                                    type="number" 
                                    step="0.1"
                                    placeholder="e.g. 85.0" 
                                    className="rounded-xl"
                                    value={formData.height}
                                    onChange={(e) => setFormData({...formData, height: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="hc" className="text-sm font-semibold text-slate-700">Head Circ. (cm)</Label>
                                <Input 
                                    id="hc" 
                                    type="number" 
                                    step="0.1"
                                    placeholder="Optional" 
                                    className="rounded-xl"
                                    value={formData.head_circumference}
                                    onChange={(e) => setFormData({...formData, head_circumference: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date" className="text-sm font-semibold text-slate-700">Date</Label>
                                <Input 
                                    id="date" 
                                    type="date" 
                                    className="rounded-xl"
                                    value={formData.measurement_date}
                                    onChange={(e) => setFormData({...formData, measurement_date: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEntryModalOpen(false)} className="rounded-xl font-medium">Cancel</Button>
                        <Button 
                            onClick={handleSaveEntry} 
                            disabled={submitting} 
                            className="rounded-xl font-medium bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                            Save Entry
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ReportPreviewModal 
                isOpen={!!previewUrl} 
                url={previewUrl} 
                onClose={() => setPreviewUrl(null)} 
                title="Growth Trends Report"
            />
        </div>
    );
};

export default GrowthPanel;

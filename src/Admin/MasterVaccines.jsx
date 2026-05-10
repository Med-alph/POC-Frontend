import React, { useState, useEffect } from 'react';
import { Syringe, Plus, Trash2, Loader2, Save, FileUp, Globe, Download, Info, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from "@/components/ui/dialog";
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import pediatricsAPI from "../api/pediatricsapi";
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const MasterVaccines = () => {
    const [vaccines, setVaccines] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showManualForm, setShowManualForm] = useState(false);
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const limit = 10;

    // Manual Form State
    const [newVaccine, setNewVaccine] = useState({
        name: '',
        dose_number: 'Dose 1',
        min_age_weeks: 0,
        min_interval_weeks: 4
    });

    const [editingVaccine, setEditingVaccine] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    // Template Modal State
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [loadMode, setLoadMode] = useState('REPLACE');
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

    // CSV Modal State
    const [csvData, setCsvData] = useState([]);
    const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
    const [importStep, setImportStep] = useState(0); // 0: Upload, 1: Processing, 2: Preview
    const [uploadProgress, setUploadProgress] = useState(0);
    const [csvImportMode, setCsvImportMode] = useState('MERGE');

    useEffect(() => {
        fetchData();
    }, [currentPage]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [rulesResponse, templateList] = await Promise.all([
                pediatricsAPI.getVaccineMaster(currentPage, limit),
                pediatricsAPI.getTemplates()
            ]);
            setVaccines(rulesResponse.data);
            setTotalRecords(rulesResponse.total);
            setTemplates(templateList);
        } catch (err) {
            toast.error("Failed to load clinical data");
        } finally {
            setLoading(false);
        }
    };

    const handleManualAdd = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            await pediatricsAPI.createVaccineMaster(newVaccine);
            toast.success("Vaccine added manually");
            setNewVaccine({ name: '', dose_number: 'Dose 1', min_age_weeks: 0, min_interval_weeks: 4 });
            setShowManualForm(false);
            setCurrentPage(1); // Go to first page to see new entry
            fetchData();
        } catch (err) {
            toast.error("Failed to add vaccine");
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingVaccine) return;
        try {
            setActionLoading(true);
            await pediatricsAPI.updateVaccineMaster(editingVaccine.id, editingVaccine);
            toast.success("Vaccine updated successfully");
            setEditingVaccine(null);
            fetchData();
        } catch (err) {
            toast.error("Failed to update vaccine");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            setActionLoading(true);
            await pediatricsAPI.deleteVaccineMaster(deletingId);
            toast.success("Vaccine deactivated successfully");
            setDeletingId(null);
            fetchData();
        } catch (err) {
            toast.error("Failed to deactivate vaccine");
        } finally {
            setActionLoading(false);
        }
    };

    const handleLoadTemplate = async () => {
        if (!selectedTemplate) return toast.error("Please select a standard");
        try {
            setActionLoading(true);
            await pediatricsAPI.loadTemplate(selectedTemplate, loadMode);
            toast.success(`Successfully loaded ${selectedTemplate} schedule`);
            setIsTemplateModalOpen(false);
            setCurrentPage(1);
            fetchData();
        } catch (err) {
            toast.error("Failed to load standard schedule");
        } finally {
            setActionLoading(false);
        }
    };

    const startProcessing = (data) => {
        setImportStep(1);
        setUploadProgress(0);
        setCsvData(data);
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            setUploadProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => setImportStep(2), 500);
            }
        }, 50);
    };

    const onFileSelect = (e) => {
        const file = e.target.files[0] || e.dataTransfer?.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length > 0 && (data[0].name === undefined || data[0].min_age_weeks === undefined)) {
                    throw new Error("Invalid format. Use headers: name, dose_number, min_age_weeks, min_interval_weeks");
                }
                startProcessing(data);
            } catch (err) {
                toast.error(err.message);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleConfirmImport = async () => {
        try {
            setActionLoading(true);
            await pediatricsAPI.importCSV(csvData, csvImportMode);
            toast.success(`Imported ${csvData.length} vaccines successfully`);
            setIsCsvModalOpen(false);
            resetImportWizard();
            setCurrentPage(1);
            fetchData();
        } catch (err) {
            toast.error("Failed to import data");
        } finally {
            setActionLoading(false);
        }
    };

    const resetImportWizard = () => {
        setImportStep(0);
        setCsvData([]);
        setUploadProgress(0);
        setCsvImportMode('MERGE');
    };

    const downloadTemplate = () => {
        const data = [
            { name: 'BCG', dose_number: 'Dose 1', min_age_weeks: 0, min_interval_weeks: 0 },
            { name: 'OPV', dose_number: 'Dose 1', min_age_weeks: 6, min_interval_weeks: 4 },
            { name: 'Pentavalent', dose_number: 'Dose 1', min_age_weeks: 6, min_interval_weeks: 4 }
        ];
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "vaccine_import_template.csv");
    };

    const totalPages = Math.ceil(totalRecords / limit);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <Syringe className="h-8 w-8 text-indigo-600" />
                        Clinical Masters
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Configure immunization rules, standards, and bulk imports.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button 
                        variant="outline" 
                        className="bg-white border-slate-200 shadow-sm hover:bg-slate-50"
                        onClick={downloadTemplate}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Template
                    </Button>
                    
                    <Dialog open={isCsvModalOpen} onOpenChange={(val) => { if(!val) resetImportWizard(); setIsCsvModalOpen(val); }}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="border-slate-200 bg-white hover:bg-slate-50 shadow-sm">
                                <FileUp className="h-4 w-4 mr-2 text-green-600" />
                                Import CSV
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
                            <DialogHeader className="p-6 border-b bg-slate-50">
                                <DialogTitle>CSV Import Wizard</DialogTitle>
                                <DialogDescription>
                                    Step {importStep + 1} of 3: {
                                        importStep === 0 ? "Upload File" : 
                                        importStep === 1 ? "Processing Data" : 
                                        "Preview & Settings"
                                    }
                                </DialogDescription>
                            </DialogHeader>
                            
                            <div className="flex-1 p-6 overflow-y-auto">
                                {importStep === 0 && (
                                    <div 
                                        className="border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-300 transition-all cursor-pointer group"
                                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onFileSelect(e); }}
                                    >
                                        <input type="file" className="hidden" id="csv-upload" accept=".csv,.xlsx" onChange={onFileSelect} />
                                        <label htmlFor="csv-upload" className="flex flex-col items-center cursor-pointer">
                                            <div className="h-16 w-16 rounded-full bg-indigo-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <FileUp className="h-8 w-8 text-indigo-600" />
                                            </div>
                                            <h3 className="mt-4 font-bold text-slate-900">Click to upload or drag and drop</h3>
                                            <p className="text-sm text-slate-500 mt-1">Excel or CSV files supported (max 10MB)</p>
                                        </label>
                                    </div>
                                )}

                                {importStep === 1 && (
                                    <div className="py-12 flex flex-col items-center gap-6">
                                        <div className="h-2 w-full max-w-md bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="font-bold text-slate-900">Parsing Vaccine Data...</h3>
                                            <p className="text-sm text-slate-500 mt-1">Validating clinical rules and structure</p>
                                        </div>
                                    </div>
                                )}

                                {importStep === 2 && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div 
                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${csvImportMode === 'MERGE' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 bg-white'}`}
                                                onClick={() => setCsvImportMode('MERGE')}
                                            >
                                                <h4 className="font-bold text-slate-900 text-sm">Merge & Append</h4>
                                                <p className="text-xs text-slate-500 mt-1">Only add new rules that don't already exist.</p>
                                            </div>
                                            <div 
                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${csvImportMode === 'REPLACE' ? 'border-red-600 bg-red-50/50' : 'border-slate-100 bg-white'}`}
                                                onClick={() => setCsvImportMode('REPLACE')}
                                            >
                                                <h4 className="font-bold text-red-900 text-sm">Replace All</h4>
                                                <p className="text-xs text-red-500 mt-1">Delete all current rules and replace with this file.</p>
                                            </div>
                                        </div>

                                        <div className="border rounded-lg overflow-hidden">
                                            <Table>
                                                <TableHeader className="bg-slate-50">
                                                    <TableRow>
                                                        <TableHead>Vaccine</TableHead>
                                                        <TableHead>Dose</TableHead>
                                                        <TableHead>Age</TableHead>
                                                        <TableHead>Gap</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {csvData.map((row, idx) => (
                                                        <TableRow key={idx}>
                                                            <TableCell className="font-bold">{row.name}</TableCell>
                                                            <TableCell>{row.dose_number}</TableCell>
                                                            <TableCell>{row.min_age_weeks}w</TableCell>
                                                            <TableCell>{row.min_interval_weeks}w</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="p-6 border-t bg-slate-50">
                                <Button variant="ghost" onClick={() => { setIsCsvModalOpen(false); resetImportWizard(); }}>Cancel</Button>
                                {importStep === 2 && (
                                    <Button 
                                        onClick={handleConfirmImport} 
                                        disabled={actionLoading}
                                        className={csvImportMode === 'REPLACE' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}
                                    >
                                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                        Finalize Import ({csvData.length} Rules)
                                    </Button>
                                )}
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
                                <Globe className="h-4 w-4 mr-2" />
                                Load Standard
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Load Clinical Standard</DialogTitle>
                                <DialogDescription>
                                    Choose a standard schedule (IAP, WHO, etc.) to automatically populate your rules.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Select Standard</label>
                                    <Select onValueChange={setSelectedTemplate} value={selectedTemplate}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a template..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {templates.map(t => (
                                                <SelectItem key={t.name} value={t.name}>{t.name.replace('_', ' ')}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Conflict Mode</label>
                                    <Select onValueChange={setLoadMode} value={loadMode}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="REPLACE">Replace All (Delete existing)</SelectItem>
                                            <SelectItem value="MERGE">Merge (Add new rules only)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex gap-3">
                                    <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                                    <p className="text-xs text-amber-800 leading-relaxed">
                                        Loading a standard will create a hospital-specific copy. You can still manually edit these rules later.
                                    </p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsTemplateModalOpen(false)}>Cancel</Button>
                                <Button 
                                    onClick={handleLoadTemplate} 
                                    disabled={actionLoading}
                                    className="bg-indigo-600 text-white"
                                >
                                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load Schedule"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid lg:grid-cols-4 gap-8">
                {/* Manual Add Card */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-none shadow-xl bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b p-4">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Plus className="h-4 w-4 text-indigo-600" />
                                Add Manual Rule
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <form onSubmit={handleManualAdd} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vaccine Name</label>
                                    <Input 
                                        placeholder="e.g. BCG, HepB" 
                                        value={newVaccine.name}
                                        onChange={(e) => setNewVaccine({...newVaccine, name: e.target.value})}
                                        className="h-9"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dose</label>
                                    <Input 
                                        placeholder="e.g. Dose 1, Booster" 
                                        value={newVaccine.dose_number}
                                        onChange={(e) => setNewVaccine({...newVaccine, dose_number: e.target.value})}
                                        className="h-9"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Min Age (Wk)</label>
                                        <Input 
                                            type="number"
                                            value={newVaccine.min_age_weeks}
                                            onChange={(e) => setNewVaccine({...newVaccine, min_age_weeks: parseInt(e.target.value)})}
                                            className="h-9 text-center"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Min Gap (Wk)</label>
                                        <Input 
                                            type="number"
                                            value={newVaccine.min_interval_weeks}
                                            onChange={(e) => setNewVaccine({...newVaccine, min_interval_weeks: parseInt(e.target.value)})}
                                            className="h-9 text-center"
                                            required
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white h-9 text-xs" disabled={actionLoading}>
                                    {actionLoading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Save className="h-3 w-3 mr-2" />}
                                    Save Rule
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 flex flex-col gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                            <Info className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 text-sm">Pro Tip</h4>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                Use standardized naming (e.g. "OPV") for all doses in a series to ensure the gap rule works correctly.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main List Table */}
                <div className="lg:col-span-3">
                    <Card className="border-none shadow-2xl bg-white overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="pl-6 py-4">Vaccine Series</TableHead>
                                    <TableHead>Dose</TableHead>
                                    <TableHead>Recommended Age</TableHead>
                                    <TableHead>Min Interval</TableHead>
                                    <TableHead>Source</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-96 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="h-10 w-10 animate-spin text-slate-200" />
                                                <p className="text-slate-400 font-medium">Syncing master rules...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : vaccines.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-96 text-center">
                                            <div className="max-w-xs mx-auto space-y-4">
                                                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                                    <Syringe className="h-8 w-8 text-slate-300" />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-900">No active rules</h3>
                                                <p className="text-sm text-slate-500">Load a standard schedule or upload a CSV to get started.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : vaccines.map((v) => (
                                    <TableRow key={v.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="pl-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${v.is_active ? 'bg-indigo-50' : 'bg-slate-100'}`}>
                                                    <span className={`text-[10px] font-bold ${v.is_active ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                        {v.name.substring(0, 2).toUpperCase()}
                                                    </span>
                                                </div>
                                                <span className={`font-bold ${v.is_active ? 'text-slate-900' : 'text-slate-400 line-through'}`}>{v.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className={`${v.is_active ? 'text-slate-600' : 'text-slate-400'} font-medium`}>{v.dose_number}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${v.is_active ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                                                {v.min_age_weeks === 0 ? 'Birth' : `${v.min_age_weeks} Weeks`}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-sm">
                                            {v.min_interval_weeks > 0 ? `${v.min_interval_weeks} Week Gap` : 'No Gap'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                    !v.is_active ? 'bg-slate-50 text-slate-300' :
                                                    v.source_type === 'TEMPLATE' ? 'bg-purple-100 text-purple-700' :
                                                    v.source_type === 'CSV' ? 'bg-emerald-100 text-emerald-700' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {v.source_type === 'TEMPLATE' && v.template_name 
                                                        ? v.template_name.replace('_', ' ') 
                                                        : v.source_type || 'MANUAL'
                                                    }
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${v.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                                <span className={`text-xs font-bold ${v.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                    {v.is_active ? 'Active' : 'Archived'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="h-8 w-8 p-0 hover:bg-indigo-50 hover:text-indigo-600"
                                                    onClick={() => setEditingVaccine(v)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className={`h-8 w-8 p-0 ${v.is_active ? 'hover:bg-red-50 hover:text-red-600' : 'opacity-30 cursor-not-allowed'}`}
                                                    onClick={() => v.is_active && setDeletingId(v.id)}
                                                    disabled={!v.is_active}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {/* Pagination Footer */}
                        {!loading && vaccines.length > 0 && (
                            <div className="px-6 py-4 bg-slate-50 border-t flex items-center justify-between">
                                <p className="text-xs font-medium text-slate-500">
                                    Showing <span className="font-bold text-slate-900">{(currentPage-1)*limit + 1}</span> to <span className="font-bold text-slate-900">{Math.min(currentPage*limit, totalRecords)}</span> of <span className="font-bold text-slate-900">{totalRecords}</span> vaccines
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => prev - 1)}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <Button
                                                key={page}
                                                variant={currentPage === page ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrentPage(page)}
                                                className={`h-8 w-8 p-0 text-xs ${currentPage === page ? 'bg-indigo-600' : ''}`}
                                            >
                                                {page}
                                            </Button>
                                        ))}
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deletingId} onOpenChange={(val) => !val && setDeletingId(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-5 w-5" />
                            Confirm Deactivation
                        </DialogTitle>
                        <DialogDescription className="py-3">
                            Are you sure you want to archive this vaccine rule? 
                            <br /><br />
                            If patients have already been administered this vaccine, it will be <strong>archived</strong> for historical records. If unused, it will be <strong>permanently removed</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
                        <Button 
                            variant="destructive"
                            onClick={handleDelete} 
                            disabled={actionLoading}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Deactivate Rule
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Vaccine Dialog */}
            <Dialog open={!!editingVaccine} onOpenChange={(val) => !val && setEditingVaccine(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Vaccine Rule</DialogTitle>
                        <DialogDescription>
                            Modify the clinical parameters for this vaccine dose.
                        </DialogDescription>
                    </DialogHeader>
                    {editingVaccine && (
                        <div className="grid gap-6 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Vaccine Name</label>
                                <Input 
                                    value={editingVaccine.name}
                                    onChange={(e) => setEditingVaccine({...editingVaccine, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Dose</label>
                                <Input 
                                    value={editingVaccine.dose_number}
                                    onChange={(e) => setEditingVaccine({...editingVaccine, dose_number: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Min Age (Wk)</label>
                                    <Input 
                                        type="number"
                                        value={editingVaccine.min_age_weeks}
                                        onChange={(e) => setEditingVaccine({...editingVaccine, min_age_weeks: parseInt(e.target.value)})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Min Gap (Wk)</label>
                                    <Input 
                                        type="number"
                                        value={editingVaccine.min_interval_weeks}
                                        onChange={(e) => setEditingVaccine({...editingVaccine, min_interval_weeks: parseInt(e.target.value)})}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <input 
                                    type="checkbox" 
                                    id="is_active_check"
                                    checked={editingVaccine.is_active}
                                    onChange={(e) => setEditingVaccine({...editingVaccine, is_active: e.target.checked})}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                />
                                <label htmlFor="is_active_check" className="text-sm font-medium text-blue-900">Active / Enable Rule</label>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingVaccine(null)}>Cancel</Button>
                        <Button 
                            onClick={handleUpdate} 
                            disabled={actionLoading}
                            className="bg-indigo-600 text-white"
                        >
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MasterVaccines;

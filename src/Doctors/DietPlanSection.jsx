import React, { useState, useEffect } from "react";
import { Utensils, Sparkles, ChevronDown, Trash2, PlusCircle, Save } from "lucide-react";
import dietAPI from "../api/dietapi";
import toast from "react-hot-toast";

const DietPlanSection = ({ 
    hospitalId, 
    consultationId, 
    isConsultationStarted, 
    isCompleted,
    isReadOnly,
    onDataChange, // Callback to parent to sync state
    initialData = null // NEW: Allow initial data from parent (drafts)
}) => {
    const [isEnabled, setIsEnabled] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState("");
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState("");
    
    const [dietPlan, setDietPlan] = useState({
        morning: "",
        breakfast: "",
        lunch: "",
        snack: "",
        dinner: "",
        instructions: ""
    });

    // Fetch templates on load
    useEffect(() => {
        const fetchTemplates = async () => {
            if (!hospitalId) return;
            try {
                const data = await dietAPI.getTemplates(hospitalId);
                setTemplates(data || []);
            } catch (err) {
                console.error("Failed to fetch diet templates:", err);
            }
        };
        fetchTemplates();
    }, [hospitalId]);

    // RESTORE FROM DRAFT: Listen for external data changes (e.g. from parent draft restore)
    useEffect(() => {
        if (initialData) {
            console.log("🥗 DietPlanSection: Restoring from initialData/draft...", initialData);
            setDietPlan({
                morning: initialData.morning || "",
                breakfast: initialData.breakfast || "",
                lunch: initialData.lunch || "",
                snack: initialData.snack || "",
                dinner: initialData.dinner || "",
                instructions: initialData.instructions || ""
            });
            setIsEnabled(true); // Automatically toggle on if draft data exists
        }
    }, [initialData]);

    // Handle template selection
    const handleTemplateSelect = (templateId) => {
        setSelectedTemplateId(templateId);
        if (!templateId) return;
        
        const template = templates.find(t => t.id === templateId);
        if (template && template.plan_data) {
            const newPlan = {
                morning: template.plan_data.morning || "",
                breakfast: template.plan_data.breakfast || "",
                lunch: template.plan_data.lunch || "",
                snack: template.plan_data.snack || "",
                dinner: template.plan_data.dinner || "",
                instructions: template.plan_data.instructions || ""
            };
            setDietPlan(newPlan);
            onDataChange(newPlan);
            toast.success(`Applied template: ${template.template_name}`);
        }
    };

    const handleInputChange = (field, value) => {
        const updatedPlan = { ...dietPlan, [field]: value };
        setDietPlan(updatedPlan);
        onDataChange(updatedPlan);
    };

    const handleSaveAsTemplate = async () => {
        if (!newTemplateName.trim()) {
            toast.error("Template name is required");
            return;
        }

        try {
            setIsSavingTemplate(true);
            await dietAPI.createTemplate({
                hospital_id: hospitalId,
                template_name: newTemplateName,
                plan_data: dietPlan
            });
            toast.success("Template saved successfully!");
            // Refresh templates list
            const data = await dietAPI.getTemplates(hospitalId);
            setTemplates(data || []);
            setShowSaveModal(false);
            setNewTemplateName("");
        } catch (err) {
            toast.error("Failed to save template: " + err.message);
        } finally {
            setIsSavingTemplate(false);
        }
    };

    const mealFields = [
        { id: 'morning', label: 'Early Morning', icon: '🌅' },
        { id: 'breakfast', label: 'Breakfast', icon: '🍳' },
        { id: 'lunch', label: 'Lunch', icon: '🍱' },
        { id: 'snack', label: 'Evening Snack', icon: '☕' },
        { id: 'dinner', label: 'Dinner', icon: '🌙' },
    ];

    if (!isConsultationStarted && !isCompleted && !isEnabled) {
        return (
            <div className="bg-white shadow rounded-lg p-5 opacity-60 pointer-events-none">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                    <Utensils className="h-5 w-5 text-blue-500" /> Clinical Diet Plan
                    <span className="text-xs text-gray-500 font-normal ml-2">(Start consultation to edit)</span>
                </h2>
            </div>
        );
    }

    return (
        <div className={`bg-white shadow rounded-lg p-5 border-l-4 border-emerald-500 transition-all ${!isConsultationStarted && !isCompleted ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Utensils className="h-5 w-5 text-emerald-600" />
                    <h2 className="text-lg font-semibold text-gray-800">Clinical Diet Plan</h2>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Include Diet Chart?</span>
                        <button
                            onClick={() => {
                                setIsEnabled(!isEnabled);
                                if (!isEnabled) onDataChange(dietPlan);
                                else onDataChange(null);
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isEnabled ? 'bg-emerald-600' : 'bg-gray-200'}`}
                            disabled={isCompleted || isReadOnly}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
            </div>

            {isEnabled && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* Template Toolbar - Fixed Alignment */}
                    <div className="flex flex-wrap items-end gap-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-[10px] font-bold uppercase text-emerald-700 mb-1 leading-none">Quick Load Template</label>
                            <select 
                                className="w-full bg-white border border-emerald-200 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-emerald-400 outline-none h-[38px]"
                                value={selectedTemplateId}
                                onChange={(e) => handleTemplateSelect(e.target.value)}
                                disabled={isCompleted}
                            >
                                <option value="">-- Select a Saved Plan --</option>
                                {templates.map(t => (
                                    <option key={t.id} value={t.id}>{t.template_name}</option>
                                ))}
                            </select>
                        </div>
                        <button 
                            onClick={() => setShowSaveModal(true)}
                            disabled={isCompleted || isSavingTemplate}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-emerald-200 text-emerald-700 rounded-md text-xs font-bold hover:bg-emerald-100 transition-colors h-[38px] whitespace-nowrap shadow-sm"
                        >
                            <Save className="h-3.5 w-3.5" />
                            Save as New Template
                        </button>
                    </div>

                    {/* Meal Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {mealFields.map((field) => (
                            <div key={field.id} className="space-y-2">
                                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 uppercase tracking-wider">
                                    <span>{field.icon}</span>
                                    {field.label}
                                </label>
                                <textarea
                                    className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-400 outline-none min-h-[120px] bg-gray-50/50 shadow-inner"
                                    placeholder={`e.g. 1 glass warm water...`}
                                    value={dietPlan[field.id]}
                                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                                    disabled={isCompleted}
                                />
                            </div>
                        ))}
                    </div>

                    {/* General Instructions */}
                    <div className="bg-emerald-50/30 rounded-lg p-5 border border-emerald-100/50">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                            <PlusCircle className="h-4 w-4 text-emerald-600" />
                            General Nutritional Advice & Restrictions
                        </label>
                        <textarea
                            className="w-full border border-gray-200 rounded-lg p-4 text-sm focus:ring-2 focus:ring-emerald-400 outline-none min-h-[100px] shadow-inner bg-white"
                            placeholder="e.g. Avoid outside food, Drink 3L water daily, 30 min brisk walk..."
                            value={dietPlan.instructions}
                            onChange={(e) => handleInputChange('instructions', e.target.value)}
                            disabled={isCompleted}
                        />
                    </div>
                </div>
            )}

            {/* Custom Modal for Saving Template */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[9999] animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl p-6 w-[400px] shadow-2xl border border-gray-100 scale-in-center">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-100 rounded-full">
                                <Save className="h-5 w-5 text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 tracking-tight">Save Diet Template</h3>
                        </div>
                        
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            Create a reusable master plan that you can load for other patients in the future.
                        </p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 ml-1">
                                    Template Name
                                </label>
                                <input
                                    autoFocus
                                    className="w-full border border-gray-300 rounded-lg py-3 px-4 text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                    placeholder="e.g. Post-Op Protein Diet"
                                    value={newTemplateName}
                                    onChange={(e) => setNewTemplateName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setShowSaveModal(false)}
                                className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 font-bold text-sm transition-colors"
                                disabled={isSavingTemplate}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveAsTemplate}
                                className="flex-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
                                disabled={isSavingTemplate}
                            >
                                {isSavingTemplate ? "Saving..." : "Create Master Plan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DietPlanSection;

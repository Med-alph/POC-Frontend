import React, { useState, useEffect } from 'react';
import {
    Mail,
    Edit2,
    RotateCcw,
    ChevronLeft,
    Save,
    Eye,
    Code,
    Info,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import emailTemplatesAPI from '../../api/emailTemplatesApi';
import { EMAIL_TEMPLATE_TYPES, TEMPLATE_LABELS, PLACEHOLDERS } from './constants';
import toast from 'react-hot-toast';

// Import ReactQuill with fallback for robustness
let ReactQuill = null;
let ReactQuillLoaded = false;

// Fallback textarea component (used when ReactQuill is not available)
const FallbackTextarea = ({ value, onChange, className, ...props }) => {
  return (
    <textarea
      value={value || ''}
      onChange={(e) => onChange && onChange(e.target.value)}
      className={`w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${className || ''}`}
      style={{ minHeight: '320px', fontFamily: 'monospace' }}
      placeholder="Rich text editor not available. Using plain textarea."
      {...props}
    />
  );
};

// Try to load ReactQuill - uses dynamic import to handle missing package gracefully
const loadReactQuill = async () => {
  if (ReactQuillLoaded) return ReactQuill;
  
  try {
    // Dynamic import to avoid build-time errors if package is missing
    const quillModule = await import('react-quill-new');
    ReactQuill = quillModule.default || quillModule;
    
    // Load styles
    try {
      await import('react-quill-new/dist/quill.snow.css');
    } catch (cssError) {
      // Styles optional
    }
    
    ReactQuillLoaded = true;
    return ReactQuill;
  } catch (error) {
    console.warn('ReactQuill not available, using fallback textarea:', error.message);
    ReactQuill = FallbackTextarea;
    ReactQuillLoaded = true;
    return FallbackTextarea;
  }
};

const EmailTemplateManagement = () => {
    const [loading, setLoading] = useState(true);
    const [templates, setTemplates] = useState({});
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [ReactQuill, setReactQuill] = useState(() => FallbackTextarea);
    const [formData, setFormData] = useState({
        subject: '',
        html_body: '',
        text_body: '',
        mail_format: 'html'
    });
    const [previewData, setPreviewData] = useState({
        doctor_name: 'Dr. Smith',
        patient_name: 'John Doe',
        appointment_date: '2026-05-20',
        appointment_time: '10:30 AM',
        clinic_address: '123 Health St, Medical City',
        old_date: '2026-05-18',
        new_date: '2026-05-20',
        new_time: '10:30 AM'
    });

    const [livePreview, setLivePreview] = useState({
        html: '',
        text: '',
        loading: false
    });

    // Load ReactQuill on mount
    useEffect(() => {
        loadReactQuill().then((Quill) => {
            setReactQuill(() => Quill);
        });
    }, []);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const results = {};
            for (const type of Object.values(EMAIL_TEMPLATE_TYPES)) {
                try {
                    const data = await emailTemplatesAPI.getTemplate(type);
                    results[type] = data;
                } catch (err) {
                    console.error(`Error fetching template ${type}:`, err);
                }
            }
            setTemplates(results);
        } catch (error) {
            toast.error('Failed to fetch templates');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (type) => {
        const template = templates[type];
        setEditingTemplate(type);
        setFormData({
            subject: template?.subject || '',
            html_body: template?.html_body || '',
            text_body: template?.text_body || '',
            mail_format: template?.mail_format || 'html'
        });
    };

    const handleRevert = async (type) => {
        if (!window.confirm('Are you sure you want to revert to the system default? This will delete your customizations.')) {
            return;
        }

        try {
            await emailTemplatesAPI.resetTemplate(type);
            toast.success('Template reverted to default');
            fetchTemplates();
        } catch (error) {
            toast.error(error.message || 'Failed to revert template');
        }
    };

    const handleSave = async () => {
        try {
            await emailTemplatesAPI.updateTemplate(editingTemplate, formData);
            toast.success('Template updated successfully');
            setEditingTemplate(null);
            fetchTemplates();
        } catch (error) {
            toast.error(error.message || 'Failed to update template');
        }
    };

    const fetchLivePreview = async () => {
        if (!editingTemplate) return;
        setLivePreview(prev => ({ ...prev, loading: true }));
        try {
            const data = await emailTemplatesAPI.getPreview(editingTemplate, {
                ...formData,
                variables: previewData
            });
            setLivePreview({
                html: data.html,
                text: data.text,
                loading: false
            });
        } catch (error) {
            console.error('Failed to fetch preview:', error);
            setLivePreview(prev => ({ ...prev, loading: false }));
        }
    };

    // Debounced preview update
    useEffect(() => {
        if (editingTemplate) {
            const timeoutId = setTimeout(() => {
                fetchLivePreview();
            }, 800);
            return () => clearTimeout(timeoutId);
        }
    }, [formData, previewData, editingTemplate]);

    const quillRef = React.useRef(null);

    const insertPlaceholder = (placeholder) => {
        if (quillRef.current) {
            const quill = quillRef.current.getEditor();
            const range = quill.getSelection();
            if (range) {
                quill.insertText(range.index, placeholder);
            } else {
                quill.insertText(quill.getLength() - 1, placeholder);
            }
            toast.success(`Inserted ${placeholder}`);
        } else {
            setFormData(prev => ({
                ...prev,
                html_body: prev.html_body + ' ' + placeholder
            }));
        }
    };

    const renderPreview = (content) => {
        if (!content) return '';
        let preview = content;
        Object.entries(previewData).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            preview = preview.replace(regex, value);
        });
        return preview;
    };

    if (loading && !editingTemplate) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (editingTemplate) {
        const availablePlaceholders = [
            ...PLACEHOLDERS.ALL,
            ...(PLACEHOLDERS[editingTemplate] || [])
        ];

        return (
            <div className="space-y-6 max-w-6xl mx-auto p-4">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={() => setEditingTemplate(null)} className="flex items-center gap-2">
                        <ChevronLeft className="h-4 w-4" />
                        Back to Templates
                    </Button>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setEditingTemplate(null)}>Cancel</Button>
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-none shadow-lg bg-white dark:bg-gray-800">
                            <CardHeader>
                                <CardTitle className="text-xl font-bold flex items-center gap-2">
                                    <Edit2 className="h-5 w-5 text-blue-600" />
                                    Edit {TEMPLATE_LABELS[editingTemplate]}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Subject Line</label>
                                    <input
                                        type="text"
                                        className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        placeholder="e.g. Appointment Confirmed: {{patient_name}}"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Send Email As</label>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setFormData({ ...formData, mail_format: 'html' })}
                                            className={`flex-1 p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${formData.mail_format === 'html'
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                                : ' border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500'
                                                }`}
                                        >
                                            <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${formData.mail_format === 'html' ? 'border-blue-500' : 'border-gray-300'}`}>
                                                {formData.mail_format === 'html' && <div className="h-2 w-2 rounded-full bg-blue-500" />}
                                            </div>
                                            <span className="font-semibold text-sm">Rich HTML</span>
                                        </button>
                                        <button
                                            onClick={() => setFormData({ ...formData, mail_format: 'text' })}
                                            className={`flex-1 p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${formData.mail_format === 'text'
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                                : ' border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500'
                                                }`}
                                        >
                                            <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${formData.mail_format === 'text' ? 'border-blue-500' : 'border-gray-300'}`}>
                                                {formData.mail_format === 'text' && <div className="h-2 w-2 rounded-full bg-blue-500" />}
                                            </div>
                                            <span className="font-semibold text-sm">Plain Text Only</span>
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-gray-400 italic">
                                        {formData.mail_format === 'html'
                                            ? 'Standard rich-text email. Best for modern client engagement.'
                                            : 'Conservative plain-text choice. Best for maximum deliverability and clinical feel.'}
                                    </p>
                                </div>

                                <Tabs defaultValue="edit" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 mb-4">
                                        <TabsTrigger value="edit" className="flex items-center gap-2">
                                            <Code className="h-4 w-4" />
                                            HTML Editor
                                        </TabsTrigger>
                                        <TabsTrigger value="preview" className="flex items-center gap-2">
                                            <Eye className="h-4 w-4" />
                                            Preview
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="edit" className="space-y-4 mt-0">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Message Content</label>
                                                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Visual WYSIWYG Editor</span>
                                            </div>
                                            <div className="quill-premium-wrapper bg-white dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                                <ReactQuill
                                                    ref={quillRef}
                                                    theme="snow"
                                                    value={formData.html_body}
                                                    onChange={(content) => setFormData({ ...formData, html_body: content })}
                                                    className="h-80"
                                                    modules={{
                                                        toolbar: [
                                                            [{ 'header': [1, 2, 3, false] }],
                                                            ['bold', 'italic', 'underline', 'strike'],
                                                            [{ 'color': [] }, { 'background': [] }],
                                                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                            ['clean']
                                                        ],
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="preview" className="mt-0">
                                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white min-h-[550px] flex flex-col relative">
                                            {livePreview.loading && (
                                                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all">
                                                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                                </div>
                                            )}

                                            <div className="bg-gray-50 p-3 border-b border-gray-200 flex items-center justify-between">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Subject:</span>
                                                    <span className="text-sm font-semibold text-gray-700 truncate">
                                                        {livePreview.html ? (livePreview.html.match(/<title>(.*?)<\/title>/)?.[1] || formData.subject) : formData.subject}
                                                    </span>
                                                </div>
                                                <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-600 border-blue-100">
                                                    Live Backend Render
                                                </Badge>
                                            </div>

                                            <div className="flex-1 min-h-[500px]">
                                                {formData.mail_format === 'html' ? (
                                                    <iframe
                                                        title="Email Preview"
                                                        srcDoc={livePreview.html}
                                                        className="w-full h-full border-none"
                                                        style={{ minHeight: '500px' }}
                                                    />
                                                ) : (
                                                    <div className="p-8 prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">
                                                        {livePreview.text || renderPreview(formData.text_body)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <p className="mt-3 text-[11px] text-gray-400 flex items-center gap-1">
                                            <Info className="h-3 w-3" />
                                            Preview matches exact delivery engine output including master layout and dummies.
                                        </p>
                                    </TabsContent>
                                </Tabs>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Plain Text Version (Fallback)</label>
                                        <Info className="h-4 w-4 text-gray-400 cursor-help" title="Used for older email clients and best deliverability." />
                                    </div>
                                    <textarea
                                        className="w-full h-32 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none resize-none"
                                        value={formData.text_body}
                                        onChange={(e) => setFormData({ ...formData, text_body: e.target.value })}
                                        placeholder="Hello {{patient_name}}, your appointment is confirmed..."
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="border-none shadow-lg bg-white dark:bg-gray-800 sticky top-6">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold">Smart Placeholders</CardTitle>
                                <p className="text-xs text-gray-500">Click a tag below to insert it at your current cursor position.</p>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {availablePlaceholders.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => insertPlaceholder(tag)}
                                            className="px-3 py-1.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-2"
                                        >
                                            {tag}
                                            <Copy className="h-3 w-3" />
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Live Preview Data</h4>
                                    <div className="space-y-3">
                                        {availablePlaceholders.map(tag => {
                                            const key = tag.replace('{{', '').replace('}}', '');
                                            return (
                                                <div key={tag} className="flex flex-col gap-1">
                                                    <span className="text-[10px] text-gray-500 font-mono">{tag}</span>
                                                    <input
                                                        type="text"
                                                        className="text-xs p-1.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                                                        value={previewData[key] || ''}
                                                        onChange={(e) => setPreviewData({ ...previewData, [key]: e.target.value })}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Email Notifications</h1>
                <p className="text-gray-500 dark:text-gray-400">Configure custom email templates for patient communications.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {Object.values(EMAIL_TEMPLATE_TYPES).map((type) => {
                    const template = templates[type];
                    const isCustomized = template && template.is_customized;

                    return (
                        <Card key={type} className="border-none shadow-sm bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
                            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${isCustomized ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                                        <Mail className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                                            {TEMPLATE_LABELS[type]}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            {isCustomized ? (
                                                <Badge className="bg-green-100 text-green-700 border-none flex items-center gap-1">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Customized
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-gray-500 flex items-center gap-1">
                                                    System Default
                                                </Badge>
                                            )}
                                            <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-none uppercase text-[9px] font-bold">
                                                {template?.mail_format || 'html'}
                                            </Badge>
                                            <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                                                Last modified: {template?.updated_at ? new Date(template.updated_at).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 ml-auto">
                                    {isCustomized && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRevert(type)}
                                            className="border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                                        >
                                            <RotateCcw className="h-4 w-4 mr-2" />
                                            Revert
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        onClick={() => handleEdit(type)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                    >
                                        <Edit2 className="h-4 w-4 mr-2" />
                                        Edit Template
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex items-start gap-4">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                    <p className="font-semibold text-blue-900 dark:text-blue-300">Pro Tip</p>
                    <p className="text-blue-800 dark:text-blue-400">
                        Customizing templates overrides the system-wide defaults for your hospital. If you delete a custom template,
                        the system will immediately revert to showing the default version.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EmailTemplateManagement;

import React, { useState } from 'react';
import { Download, Share2, Loader2, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import reportsAPI from "../../api/reportsapi";
import toast from 'react-hot-toast';

const ReportExportButton = ({ 
    type, 
    patientId, 
    consultationId,
    label = "Export Report", 
    variant = "outline", 
    className = "",
    showShare = true,
    onPreview
}) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    const handleDownload = async () => {
        try {
            setIsGenerating(true);
            let response;
            if (type === 'VISIT_SUMMARY' && consultationId) {
                response = await reportsAPI.generateEncounterReport(consultationId, { download: true });
            } else {
                response = await reportsAPI.generateReport(type, patientId, { download: true });
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const filename = consultationId ? `encounter_${consultationId}.pdf` : `${type}_${patientId}.pdf`;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            toast.success("Report downloaded successfully");
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Failed to generate report");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleShare = async () => {
        try {
            setIsSharing(true);
            const data = await reportsAPI.shareOnWhatsApp(type, patientId);
            // Open WhatsApp with the message and link
            const encodedText = encodeURIComponent(`${data.message}\n${data.link}`);
            window.open(`https://wa.me/?text=${encodedText}`, '_blank');
            toast.success("Opening WhatsApp...");
        } catch (error) {
            console.error("Share error:", error);
            toast.error("Failed to share report");
        } finally {
            setIsSharing(false);
        }
    };

    const handlePreview = async () => {
        if (onPreview) {
            try {
                setIsGenerating(true);
                let response;
                if (type === 'VISIT_SUMMARY' && consultationId) {
                    response = await reportsAPI.generateEncounterReport(consultationId, { preview: true });
                } else {
                    response = await reportsAPI.generateReport(type, patientId, { preview: true });
                }
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                onPreview(url);
            } catch (error) {
                toast.error("Failed to load preview");
            } finally {
                setIsGenerating(false);
            }
        }
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <Button 
                variant={variant} 
                size="sm" 
                onClick={onPreview ? handlePreview : handleDownload}
                disabled={isGenerating}
                className="rounded-xl font-medium gap-2"
            >
                {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <FileText className="h-4 w-4" />
                )}
                {label}
            </Button>

            {/* {showShare && (
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleShare}
                    disabled={isSharing}
                    className="rounded-xl font-medium gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                    title="Share via WhatsApp"
                >
                    {isSharing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Share2 className="h-4 w-4" />
                    )}
                    Share
                </Button>
            )} */}
        </div>
    );
};

export default ReportExportButton;

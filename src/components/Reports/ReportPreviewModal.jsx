import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, Printer } from 'lucide-react';

const ReportPreviewModal = ({ url, isOpen, onClose, title = "Report Preview" }) => {
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${title.replace(/\s+/g, '_')}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
    };

    const handlePrint = () => {
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
            printWindow.print();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2rem] bg-white border-none shadow-2xl">
                <DialogHeader className="p-6 pr-14 border-b border-slate-100 flex-row items-center justify-between space-y-0">
                    <DialogTitle className="text-xl font-bold text-slate-800">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        This modal provides a preview of the generated medical report. You can print or download the PDF from here.
                    </DialogDescription>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-xl gap-2">
                            <Printer className="h-4 w-4" /> Print
                        </Button>
                        <Button variant="default" size="sm" onClick={handleDownload} className="rounded-xl gap-2 bg-indigo-600 hover:bg-indigo-700">
                            <Download className="h-4 w-4" /> Download
                        </Button>
                    </div>
                </DialogHeader>
                <div className="flex-1 bg-slate-100/50 p-4">
                    {url ? (
                        <iframe 
                            src={`${url}#toolbar=0`} 
                            className="w-full h-full rounded-xl border border-slate-200 shadow-inner bg-white"
                            title="Report Preview"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <p className="text-slate-500 font-medium">Loading preview...</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ReportPreviewModal;

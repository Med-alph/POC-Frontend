import React, { useState, useEffect } from "react";
import {
    CheckCircle2, CalendarDays, ArrowRight, User, FileText,
    Image as ImageIcon, CornerLeftDown, CornerRightDown, Focus, Download, Trash2, Pencil, Eye, EyeOff
} from "lucide-react";
// Assuming you have these components configured via Shadcn/UI or similar setup
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Required external libraries
import ReactCompareImage from "react-compare-image";
import { Resizable } from "re-resizable";
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import toast from 'react-hot-toast';
import ComparisonNotesModal from '@/components/ComparisonNotesModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import ImageAnnotation from '@/components/ImageAnnotation';
import AnnotationOverlay from '@/components/AnnotationOverlay';
import imagesAPI from '@/api/imagesapi';
import { generateComparisonReport } from '@/utils/pdfGenerator';
import { getUserData } from '@/utils/auth';

// --- DUMMY PATIENT DATA (Using the URLs you provided) ---
const dummyPatient = {
    name: "John Doe",
    age: 32,
    id: "P-123456",
    images: [
        { date: "2024-05-10", imageUrl: "https://hsc.unm.edu/medicine/departments/dermatology/_images/skin-atlas/atopic-dermatitis/atopic-dermatitis-type-v.jpg", notes: "Initial observation: Very small, light brown lesion on left arm. Baseline image." },
        { date: "2024-07-25", imageUrl: "https://hsc.unm.edu/medicine/departments/dermatology/_images/skin-atlas/atopic-dermatitis/atopic-dermatitis-type-iv-2.jpg", notes: "Follow-up: Lesion appears slightly darker and the border is less regular." },
        { date: "2024-09-01", imageUrl: "https://hsc.unm.edu/medicine/departments/dermatology/_images/skin-atlas/atopic-dermatitis/atopic-dermatitis-type-i.jpg", notes: "Significant increase in size and uneven pigmentation noted. Biopsy recommended." },
        { date: "2024-11-15", imageUrl: "https://hsc.unm.edu/medicine/departments/dermatology/_images/skin-atlas/atopic-dermatitis/atopic-dermatitis-type-vi-2.jpg", notes: "Post-excision site: Healing well, minimal residual pigment. Clean margins." },

    ],
};

// --- HELPER COMPONENTS ---

// Custom button for selecting comparison images
const SelectionButton = ({ label, isSelected, onClick, className }) => (
    <Button
        variant={isSelected ? "default" : "outline"}
        size="sm"
        onClick={onClick}
        className={`w-full ${className} ${isSelected ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-gray-300 hover:bg-gray-100'}`}
    >
        {label}
    </Button>
);

// Component for rendering the vertical list of selected images (now includes a 'Focus' button)
const ImageListColumn = ({ title, images, icon: Icon, colorClass, patientImages, setIndex, currentIndex }) => (
    <div className={`flex flex-col gap-3 p-2 border rounded-xl shadow-md ${colorClass} bg-white/70 h-[500px] overflow-y-auto`}>
        <h4 className="font-bold text-sm flex items-center gap-1 border-b pb-1 text-gray-700">
            <Icon className="w-4 h-4" /> {title} ({images.length})
        </h4>
        {images.length === 0 ? (
            <p className="text-gray-500 italic text-xs">No images selected.</p>
        ) : (
            <div className="flex flex-col gap-3">
                {images.map((img, index) => {
                    // Find the original index using unique ID and check if this image is currently displayed in the main slider
                    const originalIndex = patientImages.findIndex(pImg => pImg.id === img.id);
                    const isFocused = originalIndex === currentIndex;

                    return (
                        <div
                            key={img.id || index}
                            className={`flex gap-2 items-center p-2 rounded-lg cursor-pointer transition-colors duration-150 
                                ${isFocused ? 'bg-yellow-100 border-yellow-500 shadow-inner' : 'hover:bg-gray-50'}`}
                            onClick={() => setIndex(originalIndex)}
                        >
                            <img
                                src={img.imageUrl}
                                alt={img.date}
                                className="w-16 h-16 object-cover rounded-lg flex-shrink-0 border"
                            />
                            <div className="text-xs flex-grow">
                                <p className={`font-semibold ${isFocused ? 'text-yellow-700' : 'text-gray-800'}`}>{img.date}</p>
                                <p className="text-gray-500 line-clamp-2">{img.notes}</p>
                            </div>
                            {/* Focus Indicator / Button */}
                            <Focus className={`w-4 h-4 flex-shrink-0 ${isFocused ? 'text-yellow-600' : 'text-gray-400'}`} />
                        </div>
                    );
                })}
            </div>
        )}
    </div>
);

// --- MAIN COMPONENT ---

const DermImageComparison = ({ patient = dummyPatient, canManage = false }) => {
    // Helper function to get base URL without query parameters
    const getBaseUrl = (url) => {
        if (!url) return url;
        return url.split('?')[0];
    };

    // Existing States - Initialize with different images if possible
    const [selectedLeft, setSelectedLeft] = useState(() => {
        // Start with first image
        return [patient.images[0]];
    });
    const [selectedRight, setSelectedRight] = useState(() => {
        // Start with last image, or first if only one image
        const lastIndex = patient.images.length - 1;
        // If only one image, still use it but user will need to upload more
        return [patient.images[lastIndex]];
    });
    const [leftCollectionIndex, setLeftCollectionIndex] = useState(0);
    const [rightCollectionIndex, setRightCollectionIndex] = useState(0);
    const [sliderHeight, setSliderHeight] = useState(500);

    // NEW ZOOM STATES
    const [zoomActive, setZoomActive] = useState(false);
    const [zoomTarget, setZoomTarget] = useState(null); // 'left' or 'right'
    
    // COLLAPSIBLE MONTHS STATE
    const [expandedMonths, setExpandedMonths] = useState(() => {
        // By default, expand only the most recent month
        if (patient.sessions && patient.sessions.length > 0) {
            const latestMonth = patient.sessions[patient.sessions.length - 1].sessionDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            return { [latestMonth]: true };
        }
        return {};
    });

    // COMPARISON NOTES STATE
    const [notesModalOpen, setNotesModalOpen] = useState(false);
    const [comparisonNotes, setComparisonNotes] = useState('');
    const [savedNotes, setSavedNotes] = useState(null);

    // DELETE MODAL STATE
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // ANNOTATION STATE
    const [annotationModalOpen, setAnnotationModalOpen] = useState(false);
    const [annotatingImage, setAnnotatingImage] = useState(null); // { imageUrl, label, side, patientId, baseUrl }
    const [currentAnnotations, setCurrentAnnotations] = useState(null);
    const [showAnnotations, setShowAnnotations] = useState(true);
    const [leftAnnotations, setLeftAnnotations] = useState(null);
    const [rightAnnotations, setRightAnnotations] = useState(null);
    const zoomImageRef = React.useRef(null); // Ref for the zoom image to get exact dimensions

    // Fetch existing comparison notes on mount
    useEffect(() => {
        const fetchData = async () => {
            if (patient.patientId || patient.id) {
                const patientId = patient.patientId || patient.id;
                
                // Fetch comparison notes
                try {
                    const notes = await imagesAPI.getComparisonNotes(patientId);
                    if (notes && notes.length > 0) {
                        setSavedNotes(notes[0]);
                    }
                } catch (error) {
                    console.error('Failed to fetch comparison notes:', error);
                }
            }
        };

        fetchData();
    }, [patient.patientId, patient.id]);

    // Get current images from the selected collections
    const leftImage = selectedLeft[leftCollectionIndex] || selectedLeft[0];
    const rightImage = selectedRight[rightCollectionIndex] || selectedRight[0];
    
    // Toggle month expansion
    const toggleMonth = (monthYear) => {
        setExpandedMonths(prev => ({
            ...prev,
            [monthYear]: !prev[monthYear]
        }));
    };

    // Notes handlers
    const handleOpenNotes = () => {
        setComparisonNotes(savedNotes?.notes || '');
        setNotesModalOpen(true);
    };

    const handleSaveNotes = async (notes) => {
        const comparisonData = {
            left_images: selectedLeft.map(img => img.id),
            right_images: selectedRight.map(img => img.id),
            notes: notes,
            comparison_date: new Date().toISOString()
        };

        try {
            const result = await imagesAPI.saveComparisonNotes(patient.patientId || patient.id, comparisonData);
            setSavedNotes(result);
            toast.success('Notes saved successfully');
        } catch (error) {
            console.error('Failed to save notes:', error);
            throw error;
        }
    };

    // PDF Download handler
    const handleDownloadPDF = async () => {
        if (selectedLeft.length === 0 || selectedRight.length === 0) {
            toast.error('Please select images for both LEFT and RIGHT to generate report');
            return;
        }

        try {
            toast.loading('Generating PDF report...', { id: 'pdf-gen' });
            await generateComparisonReport(
                patient,
                selectedLeft,
                selectedRight,
                savedNotes?.notes || ''
            );
            toast.success('PDF downloaded successfully!', { id: 'pdf-gen' });
        } catch (error) {
            console.error('Failed to generate PDF:', error);
            toast.error('Failed to generate PDF report', { id: 'pdf-gen' });
        }
    };

    // Mark session as reviewed (doctors only)
    const handleMarkReviewed = async (sessionId) => {
        console.log('🔍 handleMarkReviewed called with sessionId:', sessionId);
        console.log('🔍 sessionId type:', typeof sessionId);
        
        try {
            const currentUser = getUserData();
            console.log('🔍 Current user:', currentUser);
            
            if (!currentUser || !currentUser.id) {
                toast.error('User not authenticated');
                return;
            }
            
            if (!sessionId || sessionId === 'undefined') {
                console.error('❌ Invalid sessionId:', sessionId);
                toast.error('Invalid session ID');
                return;
            }
            
            console.log('✅ Calling API with sessionId:', sessionId, 'userId:', currentUser.id);
            await imagesAPI.markSessionReviewed(sessionId, currentUser.id);
            toast.success('Session marked as reviewed');
            // Reload to refresh data
            setTimeout(() => window.location.reload(), 500);
        } catch (error) {
            console.error('Failed to mark session as reviewed:', error);
            toast.error('Failed to mark as reviewed');
        }
    };

    // Delete session handler (doctors only)
    const handleDeleteClick = (session) => {
        setSessionToDelete(session);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!sessionToDelete) return;

        setIsDeleting(true);
        try {
            await imagesAPI.deleteSession(sessionToDelete.sessionId);
            toast.success('Session deleted successfully');
            setDeleteModalOpen(false);
            setSessionToDelete(null);
            // Reload page to refresh data
            setTimeout(() => window.location.reload(), 500);
        } catch (error) {
            console.error('Failed to delete session:', error);
            toast.error('Failed to delete session');
        } finally {
            setIsDeleting(false);
        }
    };

    // Annotation handlers
    const handleOpenAnnotation = async (imageUrl, label, side) => {
        const patientId = patient.patientId || patient.id;
        const baseUrl = getBaseUrl(imageUrl);
        
        // Fetch existing annotations
        try {
            const annotation = await imagesAPI.getAnnotations(patientId, baseUrl);
            if (annotation && annotation.side === side) {
                setCurrentAnnotations(annotation.annotations);
            } else {
                setCurrentAnnotations(null);
            }
        } catch (error) {
            setCurrentAnnotations(null);
        }

        setAnnotatingImage({ imageUrl, label, side, patientId, baseUrl });
        setAnnotationModalOpen(true);
    };

    const handleSaveAnnotation = async (annotationData) => {
        console.log('🔵 handleSaveAnnotation called in PatientGallery');
        console.log('📦 Received annotation data:', {
            hasAnnotations: !!annotationData.annotations,
            annotationCount: annotationData.annotationCount
        });
        
        try {
            const { patientId, baseUrl, side } = annotatingImage;
            console.log('📍 Context:', { patientId, baseUrl, side });
            
            // Handle different annotation formats
            let annotationCount = 0;
            if (Array.isArray(annotationData.annotations)) {
                annotationCount = annotationData.annotations.length;
            } else if (annotationData.annotations?.shapes) {
                annotationCount = annotationData.annotations.shapes.length;
            } else if (annotationData.annotations?.objects) {
                annotationCount = annotationData.annotations.objects.length;
            }
            
            // Check if annotation exists
            console.log('🔍 Checking for existing annotations...');
            const existing = await imagesAPI.getAnnotations(patientId, baseUrl);
            console.log('📥 Existing annotation:', existing ? 'Found' : 'Not found');
            
            if (existing && existing.side === side) {
                // Update
                console.log('🔄 Updating existing annotation, ID:', existing.id);
                await imagesAPI.updateAnnotations(existing.id, {
                    annotations: annotationData.annotations,
                    annotationCount: annotationCount
                });
                console.log('✅ Update successful');
            } else {
                // Create
                console.log('➕ Creating new annotation');
                const currentUser = getUserData();
                console.log('👤 Current user:', currentUser?.id);
                
                await imagesAPI.saveAnnotations(
                    patientId,
                    baseUrl,
                    side,
                    {
                        annotations: annotationData.annotations,
                        annotationCount: annotationCount
                    },
                    currentUser.id
                );
                console.log('✅ Create successful');
            }

            // Reload annotations for the current side
            console.log('💾 Storing annotations in state for side:', side);
            if (side === 'left') {
                setLeftAnnotations(annotationData.annotations);
            } else {
                setRightAnnotations(annotationData.annotations);
            }

            console.log('🎉 Closing modal and showing success');
            setAnnotationModalOpen(false);
            setAnnotatingImage(null);
            setCurrentAnnotations(null);
            toast.success('Annotations saved');
        } catch (error) {
            console.error('❌ Failed to save annotations:', error);
            toast.error('Failed to save annotations: ' + error.message);
        }
    };

    // Load annotations for current images
    useEffect(() => {
        const loadAnnotations = async () => {
            if (!leftImage || !rightImage) return;
            
            const patientId = patient.patientId || patient.id;
            const leftBaseUrl = getBaseUrl(leftImage.imageUrl);
            const rightBaseUrl = getBaseUrl(rightImage.imageUrl);

            console.log('📥 Loading annotations for:', { leftBaseUrl, rightBaseUrl });

            try {
                const leftAnn = await imagesAPI.getAnnotations(patientId, leftBaseUrl);
                console.log('📥 Left annotations:', leftAnn);
                if (leftAnn && leftAnn.side === 'left') {
                    setLeftAnnotations(leftAnn.annotations);
                } else {
                    setLeftAnnotations(null);
                }
            } catch (error) {
                console.log('❌ Failed to load left annotations:', error);
                setLeftAnnotations(null);
            }

            try {
                const rightAnn = await imagesAPI.getAnnotations(patientId, rightBaseUrl);
                console.log('📥 Right annotations:', rightAnn);
                if (rightAnn && rightAnn.side === 'right') {
                    setRightAnnotations(rightAnn.annotations);
                } else {
                    setRightAnnotations(null);
                }
            } catch (error) {
                console.log('❌ Failed to load right annotations:', error);
                setRightAnnotations(null);
            }
        };

        loadAnnotations();
    }, [leftImage, rightImage, patient.patientId, patient.id]);

    // Helper functions
    const toggleImageSelection = (image, isLeft) => {
        console.log('🔵 toggleImageSelection called');
        console.log('  Image ID:', image.id);
        console.log('  Image Date:', image.date);
        console.log('  isLeft:', isLeft);
        console.log('  Current selectedLeft:', selectedLeft.map(img => `${img.date} (${img.id?.slice(0, 20)}...)`));
        console.log('  Current selectedRight:', selectedRight.map(img => `${img.date} (${img.id?.slice(0, 20)}...)`));
        
        const setArray = isLeft ? setSelectedLeft : setSelectedRight;
        const currentArray = isLeft ? selectedLeft : selectedRight;
        const setIndexFunc = isLeft ? setLeftCollectionIndex : setRightCollectionIndex;

        console.log('  Current collection:', currentArray.map(img => `${img.date} (${img.id?.slice(0, 20)}...)`));
        
        // Use unique ID instead of date for comparison
        const imageExists = currentArray.some(img => img.id === image.id);
        console.log('  Image exists in collection:', imageExists);
        
        if (imageExists) {
            console.log('  ❌ Removing from collection');
            // Toggle off - remove from collection
            const newArray = currentArray.filter(img => img.id !== image.id);
            console.log('  New array after removal:', newArray.map(img => `${img.date} (${img.id?.slice(0, 20)}...)`));
            
            if (newArray.length > 0) {
                setArray(newArray);
                setIndexFunc(0);
                console.log('  ✅ Collection updated');
            } else {
                console.log('  ⚠️ Cannot remove - would be empty');
                toast.error('Collection must have at least one image');
            }
        } else {
            console.log('  ✅ Adding to collection');
            const newArray = [...currentArray, image].sort((a, b) => new Date(a.date) - new Date(b.date));
            console.log('  New array after addition:', newArray.map(img => `${img.date} (${img.id?.slice(0, 20)}...)`));
            
            setArray(newArray);
            const newIndex = newArray.findIndex(img => img.id === image.id);
            console.log('  New index:', newIndex);
            setIndexFunc(newIndex >= 0 ? newIndex : 0);
            console.log('  ✅ Collection updated');
        }
        
        console.log('🔵 toggleImageSelection complete\n');
    };

    const handleSetLeftIndex = (imageIndex) => {
        // Find this image in the selectedLeft collection using unique ID
        const collectionIndex = selectedLeft.findIndex(img => 
            img.id === patient.images[imageIndex]?.id
        );
        if (collectionIndex >= 0) {
            setLeftCollectionIndex(collectionIndex);
        }
    };
    
    const handleSetRightIndex = (imageIndex) => {
        // Find this image in the selectedRight collection using unique ID
        const collectionIndex = selectedRight.findIndex(img => 
            img.id === patient.images[imageIndex]?.id
        );
        if (collectionIndex >= 0) {
            setRightCollectionIndex(collectionIndex);
        }
    };

    // NEW Zoom Handlers
    const handleZoom = (target) => {
        setZoomTarget(target);
        setZoomActive(true);
    };

    const handleCloseZoom = () => {
        setZoomActive(false);
        setZoomTarget(null);
    };

    // Determine the image and date for the current zoom target
    const currentZoomImage = zoomTarget === 'left' ? leftImage : rightImage;
    const currentZoomImageDate = zoomTarget === 'left' ? leftImage?.date : rightImage?.date;
    const currentZoomTitleColor = zoomTarget === 'left' ? 'text-blue-600' : 'text-green-600';

    // Check if patient has only one image
    const hasOnlyOneImage = patient.images.length === 1;

    return (
        <Card className="space-y-6 shadow-lg rounded-xl p-4 bg-white max-w-7xl mx-auto">
            <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold flex items-center gap-2 text-blue-800">
                    <ImageIcon className="w-6 h-6" /> Dermatology Image Comparison
                </CardTitle>
                {hasOnlyOneImage && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800">
                            ⚠️ This patient has only 1 image. Upload more images to enable comparison features.
                        </p>
                    </div>
                )}
                <div className="flex justify-between items-center mt-4">
                    <div className="flex flex-wrap items-center gap-6 text-gray-700 dark:text-gray-300 text-base">
                        <div className="flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-600" />
                            <span className="font-semibold">{patient.name}</span>
                            <span className="text-gray-500">•</span>
                            <span>{patient.age} years</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <span>Patient ID:</span>
                            <span className="font-semibold">{patient.id}</span>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-6">
                {/* --- Session-Based Timeline --- */}
                <h3 className="text-lg font-semibold border-b pb-2 text-gray-800">Session Timeline & Selection</h3>
                
                {patient.sessions && patient.sessions.length > 0 ? (
                    <div className="space-y-6">
                        {/* Group sessions by month */}
                        {Object.entries(
                            patient.sessions.reduce((acc, session) => {
                                const monthYear = session.sessionDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                                if (!acc[monthYear]) acc[monthYear] = [];
                                acc[monthYear].push(session);
                                return acc;
                            }, {})
                        ).map(([monthYear, sessions]) => (
                            <div key={monthYear} className="space-y-3">
                                {/* Month Header with Collapse/Expand */}
                                <button
                                    onClick={() => toggleMonth(monthYear)}
                                    className="w-full flex items-center gap-2 hover:bg-gray-50 p-2 rounded-lg transition-colors"
                                >
                                    <CalendarDays className="w-4 h-4 text-blue-600" />
                                    <h4 className="font-semibold text-sm text-gray-700">{monthYear}</h4>
                                    <span className="text-xs text-gray-500">({sessions.length} session{sessions.length > 1 ? 's' : ''})</span>
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                    <div className={`transform transition-transform ${expandedMonths[monthYear] ? 'rotate-180' : ''}`}>
                                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </button>
                                
                                {/* Sessions in this month - Only show if expanded */}
                                {expandedMonths[monthYear] && (
                                    <div className="flex overflow-x-auto gap-4 py-2 px-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                        {sessions.map((session) => {
                                            // Check if any image from this session is selected
                                        const sessionImagesInLeft = session.images.filter(img => 
                                            selectedLeft.some(item => item.id === img.id)
                                        ).length;
                                        const sessionImagesInRight = session.images.filter(img => 
                                            selectedRight.some(item => item.id === img.id)
                                        ).length;
                                        
                                        return (
                                            <div key={session.sessionId} className="flex-shrink-0 w-64 border-2 rounded-xl p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
                                                {/* Session Header */}
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${session.isBaseline ? 'bg-yellow-500' : 'bg-blue-600'}`}>
                                                            {session.sessionNumber}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-semibold text-gray-800">{session.sessionLabel}</p>
                                                            <p className="text-[10px] text-gray-500">{session.dateFormatted}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {session.isBaseline && (
                                                            <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                                                                Baseline
                                                            </span>
                                                        )}
                                                        {session.isReviewed && (
                                                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                                                <CheckCircle2 className="w-2.5 h-2.5" /> Reviewed
                                                            </span>
                                                        )}
                                                        {canManage && (
                                                            <button
                                                                onClick={() => handleDeleteClick(session)}
                                                                className="p-1 hover:bg-red-50 rounded transition-colors"
                                                                title="Delete session"
                                                            >
                                                                <Trash2 className="w-3 h-3 text-red-600" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* Session Info */}
                                                <div className="text-[10px] text-gray-600 mb-2 space-y-1">
                                                    <p>📍 {session.bodyPart}</p>
                                                    <p>👤 {session.uploadedBy}</p>
                                                    {session.notes && <p className="line-clamp-2">📝 {session.notes}</p>}
                                                </div>
                                                
                                                {/* Images Grid */}
                                                <div className="grid grid-cols-2 gap-2 mb-2">
                                                    {session.images.map((img) => {
                                                        const isSelectedLeft = selectedLeft.some(item => item.id === img.id);
                                                        const isSelectedRight = selectedRight.some(item => item.id === img.id);
                                                        
                                                        return (
                                                            <div key={img.id} className={`relative border-2 rounded-lg overflow-hidden ${
                                                                isSelectedLeft && isSelectedRight ? "border-purple-500" :
                                                                isSelectedLeft ? "border-blue-500" :
                                                                isSelectedRight ? "border-green-500" :
                                                                "border-gray-200"
                                                            }`}>
                                                                <img 
                                                                    src={img.imageUrl} 
                                                                    alt={`Image ${img.imageIndex + 1}`} 
                                                                    className="w-full h-20 object-cover"
                                                                />
                                                                {/* Selection badges */}
                                                                <div className="absolute top-1 right-1 flex gap-1">
                                                                    {isSelectedLeft && (
                                                                        <span className="bg-blue-600 text-white text-[8px] px-1 py-0.5 rounded font-bold">L</span>
                                                                    )}
                                                                    {isSelectedRight && (
                                                                        <span className="bg-green-600 text-white text-[8px] px-1 py-0.5 rounded font-bold">R</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                
                                                {/* Selection Buttons for All Images in Session */}
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => session.images.forEach(img => {
                                                            const imgData = patient.images.find(i => i.id === img.id);
                                                            if (imgData && !selectedLeft.some(item => item.id === img.id)) {
                                                                toggleImageSelection(imgData, true);
                                                            }
                                                        })}
                                                        className="flex-1 text-[10px] py-1 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-medium transition-colors"
                                                    >
                                                        + All to LEFT
                                                    </button>
                                                    <button
                                                        onClick={() => session.images.forEach(img => {
                                                            const imgData = patient.images.find(i => i.id === img.id);
                                                            if (imgData && !selectedRight.some(item => item.id === img.id)) {
                                                                toggleImageSelection(imgData, false);
                                                            }
                                                        })}
                                                        className="flex-1 text-[10px] py-1 px-2 bg-green-50 hover:bg-green-100 text-green-700 rounded font-medium transition-colors"
                                                    >
                                                        + All to RIGHT
                                                    </button>
                                                </div>

                                                {/* Mark as Reviewed Button (Doctors only) */}
                                                {canManage && !session.isReviewed && (
                                                    <button
                                                        onClick={() => {
                                                            console.log('🔵 Button clicked for session:', session);
                                                            console.log('🔵 Session ID:', session.sessionId);
                                                            handleMarkReviewed(session.sessionId);
                                                        }}
                                                        className="w-full mt-2 text-[10px] py-1.5 px-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        <CheckCircle2 className="w-3 h-3" /> Mark as Reviewed
                                                    </button>
                                                )}

                                                {/* Review Info (if reviewed) */}
                                                {session.isReviewed && session.reviewedAt && (
                                                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-[9px] text-green-800">
                                                        <p className="font-medium">✓ Reviewed</p>
                                                        <p>{new Date(session.reviewedAt).toLocaleString()}</p>
                                                    </div>
                                                )}
                                                
                                                {/* Individual Image Selection */}
                                                <div className="mt-2 grid grid-cols-2 gap-1">
                                                    {session.images.map((img, idx) => {
                                                        const imgData = patient.images.find(i => i.id === img.id);
                                                        const isSelectedLeft = selectedLeft.some(item => item.id === img.id);
                                                        const isSelectedRight = selectedRight.some(item => item.id === img.id);
                                                        
                                                        return (
                                                            <div key={img.id} className="flex gap-1">
                                                                <button
                                                                    onClick={() => imgData && toggleImageSelection(imgData, true)}
                                                                    className={`flex-1 text-[9px] py-0.5 px-1 rounded font-medium transition-colors ${
                                                                        isSelectedLeft 
                                                                            ? 'bg-blue-600 text-white' 
                                                                            : 'bg-gray-100 hover:bg-blue-50 text-gray-600'
                                                                    }`}
                                                                >
                                                                    L{idx + 1}
                                                                </button>
                                                                <button
                                                                    onClick={() => imgData && toggleImageSelection(imgData, false)}
                                                                    className={`flex-1 text-[9px] py-0.5 px-1 rounded font-medium transition-colors ${
                                                                        isSelectedRight 
                                                                            ? 'bg-green-600 text-white' 
                                                                            : 'bg-gray-100 hover:bg-green-50 text-gray-600'
                                                                    }`}
                                                                >
                                                                    R{idx + 1}
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-8">No sessions available</p>
                )}

                {/* --- Unified Comparison View (Sidebars + Center Slider/Zoom) --- */}
                <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5" /> Active Comparison
                </h3>

                {/* Main 3-Column Layout */}
                <div className="grid grid-cols-12 gap-3 items-start">
                    {/* LEFT SIDEBAR */}
                    <div className="col-span-3">
                        <ImageListColumn
                            title="Left Collection (Old)"
                            images={selectedLeft} icon={CornerLeftDown} colorClass="border-blue-500/50"
                            patientImages={patient.images} 
                            setIndex={(idx) => setLeftCollectionIndex(selectedLeft.findIndex(img => img.id === patient.images[idx]?.id))} 
                            currentIndex={selectedLeft.findIndex(img => img.id === leftImage?.id)}
                        />
                    </div>

                    {/* CENTER VIEW: Conditional rendering for Zoom or Slider */}
                    <div className="col-span-6">
                        {zoomActive && currentZoomImage ? (
                            // 1. DEDICATED ZOOM VIEW
                            <Card className="p-4 shadow-xl border-2 rounded-xl bg-white" style={{ height: sliderHeight + 'px' }}>
                                <div className="flex justify-between items-center border-b-2 pb-3 mb-4">
                                    <div>
                                        <h4 className={`font-bold text-xl ${currentZoomTitleColor} flex items-center gap-2`}>
                                            <Focus className="w-6 h-6" />
                                            {zoomTarget === 'left' ? 'LEFT' : 'RIGHT'} Image Zoom
                                        </h4>
                                        <p className="text-sm text-gray-600 mt-1">Date: {currentZoomImageDate}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {canManage && (
                                            <Button 
                                                onClick={() => handleOpenAnnotation(
                                                    currentZoomImage.imageUrl, 
                                                    `${zoomTarget === 'left' ? 'LEFT' : 'RIGHT'} - ${currentZoomImageDate}`,
                                                    zoomTarget
                                                )}
                                                className="bg-orange-600 hover:bg-orange-700 text-white"
                                            >
                                                <Pencil className="w-4 h-4 mr-2" /> Annotate
                                            </Button>
                                        )}
                                        <Button 
                                            onClick={() => setShowAnnotations(!showAnnotations)}
                                            variant="outline"
                                            className="border-blue-500 text-blue-600 hover:bg-blue-50"
                                        >
                                            {showAnnotations ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                                            {showAnnotations ? 'Hide' : 'Show'} Annotations
                                        </Button>
                                        <Button onClick={handleCloseZoom} variant="outline" className="text-gray-700 hover:bg-gray-200 font-semibold">
                                            <ArrowRight className="w-4 h-4 mr-2 rotate-180" /> Back
                                        </Button>
                                    </div>
                                </div>

                                <div className="relative" style={{ height: sliderHeight - 80, width: '100%', overflow: 'hidden', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                                    <TransformWrapper
                                        initialScale={1}
                                        minScale={0.5}
                                        maxScale={8}
                                        limitToBounds={false}
                                        doubleClick={{ disabled: true }}
                                    >
                                        <TransformComponent wrapperStyle={{ width: "100%", height: "100%", display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            <div className="relative">
                                                <img
                                                    ref={zoomImageRef}
                                                    src={currentZoomImage.imageUrl}
                                                    alt={`${zoomTarget === 'left' ? 'Left' : 'Right'} Image Zoom`}
                                                    style={{ maxWidth: '100%', maxHeight: '100%', display: 'block', objectFit: 'contain' }}
                                                />
                                                {showAnnotations && (zoomTarget === 'left' ? leftAnnotations : rightAnnotations) ? (
                                                    <AnnotationOverlay 
                                                        annotations={zoomTarget === 'left' ? leftAnnotations : rightAnnotations}
                                                        imageRef={zoomImageRef}
                                                    />
                                                ) : null}
                                            </div>
                                        </TransformComponent>
                                    </TransformWrapper>
                                </div>
                                <p className="text-xs text-gray-500 text-center mt-2">
                                    💡 Use mouse wheel to zoom, click and drag to pan
                                </p>
                            </Card>
                        ) : (
                            // 2. NORMAL COMPARISON SLIDER VIEW
                            <div className="relative">
                                <Resizable
                                    size={{ width: '100%', height: sliderHeight }}
                                    minHeight={400} maxHeight={800}
                                    onResizeStop={(e, direction, ref, d) => { setSliderHeight(sliderHeight + d.height); }}
                                    handleStyles={{ bottom: { height: 10, bottom: -5, background: '#3b82f6', borderRadius: '0 0 5px 5px', cursor: 's-resize' }, }}
                                    className="border rounded-xl p-4 shadow-xl bg-gray-50 overflow-hidden"
                                >
                                    <div className="w-full h-full flex flex-col">
                                        {/* Header */}
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-sm font-semibold text-blue-600">LEFT (Old): {leftImage?.date}</span>
                                            <span className="text-sm font-semibold text-green-600">RIGHT (New): {rightImage?.date}</span>
                                        </div>

                                        {/* Comparison View - Always use slider */}
                                        <div className="flex-1 mb-16">
                                            <ReactCompareImage
                                                leftImage={leftImage?.imageUrl || ''}
                                                rightImage={rightImage?.imageUrl || ''}
                                                sliderLineColor="#3b82f6"
                                                handleSize={30}
                                            />
                                            

                                        </div>
                                    </div>
                                </Resizable>
                                {/* --- ZOOM CONTROLS - Fixed at bottom --- */}
                                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4 z-10">
                                    <Button 
                                        variant="outline" 
                                        onClick={() => handleZoom('left')} 
                                        className="text-blue-600 border-2 border-blue-600 hover:bg-blue-50 bg-white shadow-lg font-semibold"
                                    >
                                        <Focus className="w-4 h-4 mr-2" /> Zoom Left Image
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        onClick={() => handleZoom('right')} 
                                        className="text-green-600 border-2 border-green-600 hover:bg-green-50 bg-white shadow-lg font-semibold"
                                    >
                                        <Focus className="w-4 h-4 mr-2" /> Zoom Right Image
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT SIDEBAR */}
                    <div className="col-span-3">
                        <ImageListColumn
                            title="Right Collection (New)"
                            images={selectedRight} icon={CornerRightDown} colorClass="border-green-500/50"
                            patientImages={patient.images} 
                            setIndex={(idx) => setRightCollectionIndex(selectedRight.findIndex(img => img.id === patient.images[idx]?.id))} 
                            currentIndex={selectedRight.findIndex(img => img.id === rightImage?.id)}
                        />
                    </div>
                </div>

                {/* --- Saved Notes Display --- */}
                {savedNotes && (
                    <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" />
                                <h4 className="font-semibold text-blue-900">Comparison Notes</h4>
                            </div>
                            <button
                                onClick={handleOpenNotes}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Edit
                            </button>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{savedNotes.notes}</p>
                        <p className="text-xs text-gray-500 mt-2">
                            Saved on {new Date(savedNotes.comparison_date).toLocaleString()}
                        </p>
                    </div>
                )}

                {/* --- Action Buttons --- */}
                <div className="flex flex-wrap gap-3 mt-4 border-t pt-4">
                    <Button 
                        onClick={handleOpenNotes}
                        variant="default" 
                        className="flex-1 sm:flex-auto bg-blue-500 hover:bg-blue-600 text-white"
                    >
                        <FileText className="w-4 h-4 mr-1" /> {savedNotes ? 'Edit Notes' : 'Add Notes'}
                    </Button>
                    <Button 
                        onClick={handleDownloadPDF}
                        variant="default" 
                        className="flex-1 sm:flex-auto bg-gray-500 hover:bg-gray-600 text-white"
                        disabled={selectedLeft.length === 0 || selectedRight.length === 0}
                    >
                        <Download className="w-4 h-4 mr-1" /> Download Report PDF
                    </Button>
                </div>
            </CardContent>

            {/* Comparison Notes Modal */}
            <ComparisonNotesModal
                isOpen={notesModalOpen}
                onClose={() => setNotesModalOpen(false)}
                onSave={handleSaveNotes}
                existingNotes={comparisonNotes}
                leftImages={selectedLeft}
                rightImages={selectedRight}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setSessionToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                title="Delete Session"
                message="Are you sure you want to delete this session? This will remove all images in this session."
                itemName={sessionToDelete ? `${sessionToDelete.sessionLabel} - ${sessionToDelete.dateFormatted}` : ''}
                isDeleting={isDeleting}
            />

            {/* Image Annotation Modal */}
            {annotationModalOpen && annotatingImage && (
                <ImageAnnotation
                    imageUrl={annotatingImage.imageUrl}
                    imageLabel={annotatingImage.label}
                    existingAnnotations={currentAnnotations}
                    onSave={handleSaveAnnotation}
                    onClose={() => {
                        setAnnotationModalOpen(false);
                        setAnnotatingImage(null);
                        setCurrentAnnotations(null);
                    }}
                />
            )}
        </Card>
    );
};

export default DermImageComparison;
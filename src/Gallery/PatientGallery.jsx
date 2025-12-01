import React, { useState } from "react";
import {
    CheckCircle2, CalendarDays, ArrowRight, User, FileText,
    Image as ImageIcon, CornerLeftDown, CornerRightDown, Focus
} from "lucide-react";
// Assuming you have these components configured via Shadcn/UI or similar setup
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Required external libraries
import ReactCompareImage from "react-compare-image";
import { Resizable } from "re-resizable";
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

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
                    // Find the original index and check if this image is currently displayed in the main slider
                    const originalIndex = patientImages.findIndex(pImg => pImg.date === img.date);
                    const isFocused = originalIndex === currentIndex;

                    return (
                        <div
                            key={index}
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

const DermImageComparison = ({ patient = dummyPatient }) => {
    // Existing States
    const [selectedLeft, setSelectedLeft] = useState([patient.images[0]]);
    const [selectedRight, setSelectedRight] = useState([patient.images[patient.images.length - 1]]);
    const [leftImageIndex, setLeftImageIndex] = useState(0);
    const [rightImageIndex, setRightImageIndex] = useState(patient.images.length - 1);
    const [sliderHeight, setSliderHeight] = useState(500);

    // NEW ZOOM STATES
    const [zoomActive, setZoomActive] = useState(false);
    const [zoomTarget, setZoomTarget] = useState(null); // 'left' or 'right'

    const leftImage = patient.images[leftImageIndex];
    const rightImage = patient.images[rightImageIndex];

    // Helper functions
    const toggleImageSelection = (image, isLeft) => {
        const setArray = isLeft ? setSelectedLeft : setSelectedRight;
        const currentArray = isLeft ? selectedLeft : selectedRight;

        if (currentArray.some(img => img.date === image.date)) {
            setArray(currentArray.filter(img => img.date !== image.date));
        } else {
            const newArray = [...currentArray, image].sort((a, b) => new Date(a.date) - new Date(b.date));
            setArray(newArray);
        }
    };

    const handleSetLeftIndex = (idx) => setLeftImageIndex(idx);
    const handleSetRightIndex = (idx) => setRightImageIndex(idx);

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

    return (
        <Card className="space-y-6 shadow-lg rounded-xl p-4 bg-white max-w-7xl mx-auto">
            <CardHeader className="pb-2">
                {/* ... (Header remains the same) ... */}
                <CardTitle className="text-2xl font-bold flex items-center gap-2 text-blue-800">
                    <ImageIcon className="w-6 h-6" /> Dermatology Image Comparison
                </CardTitle>
                <div className="flex justify-between items-center mt-2">
                    <div className="flex flex-wrap items-center gap-4 text-gray-600 text-sm">
                        <div className="flex items-center gap-1"><User className="w-5 h-5" /> **{patient.name}**, {patient.age} yrs</div>
                        <div className="flex items-center gap-1"><FileText className="w-5 h-5" /> Patient ID: **{patient.id}**</div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-6">
                {/* --- Image Selection / Timeline Gallery (Unchanged) --- */}
                <h3 className="text-lg font-semibold border-b pb-2 text-gray-800">Image Timeline & Selection</h3>
                <div className="flex overflow-x-auto gap-3 py-2 px-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {patient.images.map((img, idx) => {
                        const isSelectedLeft = selectedLeft.some(item => item.date === img.date);
                        const isSelectedRight = selectedRight.some(item => item.date === img.date);
                        return (
                            <div key={idx} className={`flex-shrink-0 w-36 p-1 border rounded-lg transition-shadow duration-200 
                                    ${isSelectedLeft && isSelectedRight ? "border-purple-500 shadow-lg" :
                                    isSelectedLeft ? "border-blue-500 shadow-md" :
                                        isSelectedRight ? "border-green-500 shadow-md" :
                                            "border-gray-200 hover:shadow"
                                }`}>
                                <img src={img.imageUrl} alt={`Visit ${img.date}`} className="w-full h-24 object-cover rounded-lg" />
                                <p className="text-xs text-center mt-1 font-medium text-gray-700">{img.date}</p>
                                <div className="flex justify-between gap-1 mt-2">
                                    <SelectionButton label="LEFT" isSelected={isSelectedLeft} onClick={() => toggleImageSelection(img, true)} className="!text-xs !p-1 !h-6 bg-blue-500 flex-1" />
                                    <SelectionButton label="RIGHT" isSelected={isSelectedRight} onClick={() => toggleImageSelection(img, false)} className="!text-xs !p-1 !h-6 bg-green-500 flex-1" />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{img.notes}</p>
                            </div>
                        );
                    })}
                </div>

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
                            patientImages={patient.images} setIndex={handleSetLeftIndex} currentIndex={leftImageIndex}
                        />
                    </div>

                    {/* CENTER VIEW: Conditional rendering for Zoom or Slider */}
                    <div className="col-span-6">
                        {zoomActive && currentZoomImage ? (
                            // 1. DEDICATED ZOOM VIEW
                            <Card className="p-3 shadow-xl border rounded-xl bg-gray-50" style={{ height: sliderHeight + 'px' }}>
                                <div className="flex justify-between items-center border-b pb-2 mb-3">
                                    <h4 className={`font-bold text-lg ${currentZoomTitleColor}`}>
                                        <Focus className="w-5 h-5 inline mr-1" /> Zoom View: {currentZoomImageDate}
                                    </h4>
                                    <Button onClick={handleCloseZoom} variant="outline" className="text-gray-700 hover:bg-gray-200">
                                        <ArrowRight className="w-4 h-4 mr-1 rotate-180" /> Back to Comparison
                                    </Button>
                                </div>

                                <div style={{ height: sliderHeight - 60, width: '100%', overflow: 'hidden' }}>
                                    <TransformWrapper
                                        initialScale={1}
                                        minScale={0.5}
                                        maxScale={8} // Up to 8x magnification
                                        limitToBounds={false}
                                        doubleClick={{ disabled: true }} // Disable double click for cleaner interaction
                                    >
                                        {/* Use TransformComponent to wrap the image for pan/zoom functionality */}
                                        <TransformComponent wrapperStyle={{ width: "100%", height: "100%", display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            <img
                                                src={currentZoomImage.imageUrl}
                                                alt="Zoom Target"
                                                style={{ maxWidth: '100%', maxHeight: '100%', display: 'block' }}
                                            />
                                        </TransformComponent>
                                    </TransformWrapper>
                                </div>
                            </Card>
                        ) : (
                            // 2. NORMAL COMPARISON SLIDER VIEW
                            <Resizable
                                size={{ width: '100%', height: sliderHeight }}
                                minHeight={300} maxHeight={800}
                                onResizeStop={(e, direction, ref, d) => { setSliderHeight(sliderHeight + d.height); }}
                                handleStyles={{ bottom: { height: 10, bottom: -5, background: '#3b82f6', borderRadius: '0 0 5px 5px', cursor: 's-resize' }, }}
                                className="border rounded-xl p-3 shadow-xl bg-gray-50 overflow-hidden"
                            >
                                <div className="w-full h-full">
                                    <p className="font-semibold text-sm flex justify-between mb-2 text-gray-700">
                                        <span className="text-blue-600">LEFT (Old): {leftImage?.date}</span>
                                        <span className="text-green-600">RIGHT (New): {rightImage?.date}</span>
                                    </p>
                                    <div className="w-full h-[calc(100%-60px)]">
                                        <ReactCompareImage
                                            leftImage={leftImage?.imageUrl || ''}
                                            rightImage={rightImage?.imageUrl || ''}
                                            sliderLineColor="#3b82f6"
                                            handleSize={30}
                                        />
                                    </div>
                                    {/* --- NEW ZOOM CONTROLS --- */}
                                    <div className="flex justify-center gap-4 mt-3">
                                        <Button variant="outline" onClick={() => handleZoom('left')} className="text-blue-600 border-blue-600 hover:bg-blue-50/50">
                                            <Focus className="w-4 h-4 mr-1" /> Zoom Left Image
                                        </Button>
                                        <Button variant="outline" onClick={() => handleZoom('right')} className="text-green-600 border-green-600 hover:bg-green-50/50">
                                            <Focus className="w-4 h-4 mr-1" /> Zoom Right Image
                                        </Button>
                                    </div>
                                </div>
                            </Resizable>
                        )}
                    </div>

                    {/* RIGHT SIDEBAR */}
                    <div className="col-span-3">
                        <ImageListColumn
                            title="Right Collection (New)"
                            images={selectedRight} icon={CornerRightDown} colorClass="border-green-500/50"
                            patientImages={patient.images} setIndex={handleSetRightIndex} currentIndex={rightImageIndex}
                        />
                    </div>
                </div>

                {/* --- Action Buttons (Unchanged) --- */}
                <div className="flex flex-wrap gap-3 mt-4 border-t pt-4">
                    <Button variant="default" className="flex-1 sm:flex-auto bg-green-500 hover:bg-green-600 text-white">
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Mark Reviewed
                    </Button>
                    <Button variant="default" className="flex-1 sm:flex-auto bg-blue-500 hover:bg-blue-600 text-white">
                        <ArrowRight className="w-4 h-4 mr-1" /> Add Notes
                    </Button>
                    <Button variant="default" className="flex-1 sm:flex-auto bg-gray-500 hover:bg-gray-600 text-white">
                        Download Report PDF
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default DermImageComparison;
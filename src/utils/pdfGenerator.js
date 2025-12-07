import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateComparisonReport = async (patient, leftImages, rightImages, notes) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Helper function to add text with word wrap
  const addText = (text, x, y, maxWidth, fontSize = 10) => {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y);
    return y + (lines.length * fontSize * 0.5);
  };

  // Capture comparison slider as image
  const captureComparisonView = async () => {
    const comparisonElement = document.querySelector('.react-compare-image');
    if (comparisonElement) {
      try {
        const canvas = await html2canvas(comparisonElement, {
          useCORS: true,
          allowTaint: true,
          scale: 2,
          logging: false
        });
        return canvas.toDataURL('image/jpeg', 0.8);
      } catch (error) {
        console.error('Failed to capture comparison:', error);
        return null;
      }
    }
    return null;
  };

  // === HEADER ===
  pdf.setFillColor(37, 99, 235); // Blue
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont(undefined, 'bold');
  pdf.text('Dermatology Comparison Report', margin, 20);
  
  pdf.setFontSize(10);
  pdf.setFont(undefined, 'normal');
  pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, margin, 30);

  yPosition = 50;

  // === PATIENT INFORMATION ===
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(16);
  pdf.setFont(undefined, 'bold');
  pdf.text('Patient Information', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.setFont(undefined, 'normal');
  pdf.text(`Name: ${patient.name}`, margin, yPosition);
  yPosition += 6;
  pdf.text(`Patient ID: ${patient.id}`, margin, yPosition);
  yPosition += 6;
  pdf.text(`Age: ${patient.age} years`, margin, yPosition);
  yPosition += 15;

  // === COMPARISON DETAILS ===
  pdf.setFontSize(16);
  pdf.setFont(undefined, 'bold');
  pdf.text('Comparison Details', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.setFont(undefined, 'normal');
  pdf.text(`LEFT Collection (Baseline): ${leftImages.length} image(s)`, margin, yPosition);
  yPosition += 6;
  leftImages.forEach((img, idx) => {
    pdf.setFontSize(9);
    pdf.text(`  • ${img.date} - ${img.notes || 'No notes'}`, margin + 5, yPosition);
    yPosition += 5;
  });
  yPosition += 5;

  pdf.setFontSize(10);
  pdf.text(`RIGHT Collection (Current): ${rightImages.length} image(s)`, margin, yPosition);
  yPosition += 6;
  rightImages.forEach((img, idx) => {
    pdf.setFontSize(9);
    pdf.text(`  • ${img.date} - ${img.notes || 'No notes'}`, margin + 5, yPosition);
    yPosition += 5;
  });
  yPosition += 10;

  // === CLINICAL NOTES ===
  if (notes) {
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('Clinical Observations', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.setFillColor(240, 249, 255);
    pdf.rect(margin - 5, yPosition - 5, pageWidth - (margin * 2) + 10, 40, 'F');
    
    yPosition = addText(notes, margin, yPosition, pageWidth - (margin * 2), 10);
    yPosition += 15;
  }

  // === COMPARISON ANALYSIS SECTION ===
  pdf.addPage();
  yPosition = margin;

  pdf.setFontSize(16);
  pdf.setFont(undefined, 'bold');
  pdf.text('Image Comparison Analysis', margin, yPosition);
  yPosition += 15;

  // Comparison Summary Box
  pdf.setFillColor(240, 249, 255);
  pdf.rect(margin - 5, yPosition - 5, pageWidth - (margin * 2) + 10, 35, 'F');
  
  pdf.setFontSize(11);
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(37, 99, 235);
  pdf.text('Baseline (LEFT):', margin, yPosition);
  pdf.setTextColor(34, 197, 94);
  pdf.text('Current (RIGHT):', pageWidth / 2 + 10, yPosition);
  yPosition += 8;

  pdf.setFontSize(9);
  pdf.setFont(undefined, 'normal');
  pdf.setTextColor(0, 0, 0);
  pdf.text(`${leftImages.length} image(s)`, margin, yPosition);
  pdf.text(`${rightImages.length} image(s)`, pageWidth / 2 + 10, yPosition);
  yPosition += 6;

  const leftDates = leftImages.map(img => img.date).join(', ');
  const rightDates = rightImages.map(img => img.date).join(', ');
  
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text(pdf.splitTextToSize(leftDates, (pageWidth / 2) - margin - 15), margin, yPosition);
  pdf.text(pdf.splitTextToSize(rightDates, (pageWidth / 2) - margin - 15), pageWidth / 2 + 10, yPosition);
  yPosition += 25;

  // LEFT Collection Details
  pdf.setFontSize(14);
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(37, 99, 235);
  pdf.text('LEFT Collection (Baseline)', margin, yPosition);
  yPosition += 10;

  pdf.setFillColor(245, 247, 250);
  leftImages.forEach((img, idx) => {
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = margin;
    }

    const boxHeight = img.notes ? 25 : 15;
    pdf.rect(margin - 3, yPosition - 5, pageWidth - (margin * 2) + 6, boxHeight, 'F');
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Image ${idx + 1}`, margin, yPosition);
    
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(9);
    pdf.text(`Date: ${img.date}`, margin + 25, yPosition);
    pdf.text(`Body Part: ${img.bodyPart || 'N/A'}`, margin + 70, yPosition);
    
    if (img.isBaseline) {
      pdf.setFillColor(255, 237, 213);
      pdf.rect(pageWidth - margin - 25, yPosition - 4, 22, 6, 'F');
      pdf.setFontSize(7);
      pdf.setTextColor(180, 83, 9);
      pdf.text('BASELINE', pageWidth - margin - 24, yPosition);
    }
    
    yPosition += 6;

    if (img.notes) {
      pdf.setFontSize(8);
      pdf.setTextColor(80, 80, 80);
      const noteLines = pdf.splitTextToSize(`Notes: ${img.notes}`, pageWidth - margin * 2 - 10);
      pdf.text(noteLines, margin, yPosition);
      yPosition += noteLines.length * 4 + 2;
    }
    
    yPosition += 10;
  });

  yPosition += 5;

  // RIGHT Collection Details
  pdf.setFontSize(14);
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(34, 197, 94);
  pdf.text('RIGHT Collection (Current)', margin, yPosition);
  yPosition += 10;

  rightImages.forEach((img, idx) => {
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = margin;
    }

    const boxHeight = img.notes ? 25 : 15;
    pdf.setFillColor(240, 253, 244);
    pdf.rect(margin - 3, yPosition - 5, pageWidth - (margin * 2) + 6, boxHeight, 'F');
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Image ${idx + 1}`, margin, yPosition);
    
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(9);
    pdf.text(`Date: ${img.date}`, margin + 25, yPosition);
    pdf.text(`Body Part: ${img.bodyPart || 'N/A'}`, margin + 70, yPosition);
    
    yPosition += 6;

    if (img.notes) {
      pdf.setFontSize(8);
      pdf.setTextColor(80, 80, 80);
      const noteLines = pdf.splitTextToSize(`Notes: ${img.notes}`, pageWidth - margin * 2 - 10);
      pdf.text(noteLines, margin, yPosition);
      yPosition += noteLines.length * 4 + 2;
    }
    
    yPosition += 10;
  });

  // Image Access Note
  yPosition += 10;
  pdf.setFillColor(254, 252, 232);
  pdf.rect(margin - 5, yPosition - 5, pageWidth - (margin * 2) + 10, 20, 'F');
  pdf.setFontSize(8);
  pdf.setTextColor(133, 77, 14);
  pdf.setFont(undefined, 'italic');
  pdf.text('Note: Images are stored securely and can be accessed through the patient portal.', margin, yPosition);
  yPosition += 5;
  pdf.text('For full resolution images, please refer to the digital comparison tool.', margin, yPosition);

  // === FOOTER ===
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(
      `Page ${i} of ${totalPages} | Confidential Medical Document`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  const fileName = `Comparison_Report_${patient.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

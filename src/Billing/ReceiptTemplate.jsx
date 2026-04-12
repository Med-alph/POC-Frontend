import React from 'react';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';

const ReceiptTemplate = React.forwardRef(({ data }, ref) => {
  if (!data) return null;

  const {
    receiptNumber,
    transactionDate,
    paymentMethod,
    hospital,
    patient,
    items,
    summary
  } = data;

  const formattedDate = new Date(transactionDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div ref={ref} className="bg-white p-12 max-w-[800px] mx-auto text-gray-800 font-sans shadow-lg" id="receipt-content">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-gray-100 pb-8 mb-8">
        <div className="space-y-2">
          {hospital?.logo ? (
            <img src={hospital.logo} alt="Hospital Logo" className="h-16 w-auto mb-4" crossOrigin="anonymous" />
          ) : (
            <div className="text-3xl font-black text-blue-600 tracking-tighter mb-4 italic uppercase">
              {hospital?.name || "MEDALPH"}
            </div>
          )}
          <h1 className="text-xl font-bold uppercase tracking-wide">{hospital?.name}</h1>
          <div className="text-xs space-y-1 text-gray-500 max-w-[300px]">
            <p className="flex items-center gap-2"><MapPin size={12} /> {hospital?.address}</p>
            <p className="flex items-center gap-2"><Phone size={12} /> {hospital?.phone}</p>
            {hospital?.gstin && (
              <p className="font-bold text-gray-700 mt-2 uppercase">GSTIN: {hospital.gstin}</p>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 inline-block">
            <h2 className="text-sm font-bold text-gray-400 mb-1 uppercase tracking-widest">Medical Receipt</h2>
            <div className="text-lg font-black text-gray-900 font-mono tracking-tighter">
              #{receiptNumber || "INV-00000"}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3 font-medium">{formattedDate}</p>
        </div>
      </div>

      {/* Patient & Billing Info */}
      <div className="grid grid-cols-2 gap-12 mb-10">
        <div>
          <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Bill To</h3>
          <div className="space-y-1">
            <p className="text-lg font-bold text-gray-900">{patient?.name}</p>
            <p className="text-xs font-mono text-gray-500">UHID: {patient?.uhid || "N/A"}</p>
            <p className="text-xs text-gray-500">{patient?.phone}</p>
          </div>
        </div>
        <div className="text-right">
          <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Payment Summary</h3>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase border border-emerald-100 mb-1">
              Status: Paid
            </div>
            <p className="text-xs text-gray-500 font-medium capitalize">Method: {paymentMethod || 'Manual'}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <table className="w-full mb-10">
        <thead>
          <tr className="border-b-2 border-gray-900 text-left">
            <th className="py-4 text-xs font-black uppercase tracking-widest">Description</th>
            <th className="py-4 text-xs font-black uppercase tracking-widest text-center">Qty</th>
            <th className="py-4 text-xs font-black uppercase tracking-widest text-right">Unit Price</th>
            <th className="py-4 text-xs font-black uppercase tracking-widest text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items && items.length > 0 ? (
            items.map((item, index) => (
              <tr key={index}>
                <td className="py-4 text-sm font-semibold">{item.name}</td>
                <td className="py-4 text-sm text-center font-mono">{item.qty}</td>
                <td className="py-4 text-sm text-right font-mono">₹{parseFloat(item.unitPrice).toFixed(2)}</td>
                <td className="py-4 text-sm text-right font-bold">₹{parseFloat(item.total).toFixed(2)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="py-8 text-center text-gray-400 italic">No items found</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end pt-6 border-t-2 border-gray-900">
        <div className="w-[300px] space-y-3">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span className="font-mono">₹{parseFloat(summary?.subtotal || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>GST / Taxes</span>
            <span className="font-mono">₹{parseFloat(summary?.tax || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center bg-gray-900 text-white p-4 rounded-xl mt-4">
            <span className="text-xs font-black uppercase tracking-widest opacity-60">Total Amount</span>
            <span className="text-2xl font-black font-mono">₹{parseFloat(summary?.totalAmount || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-20 pt-8 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400 font-medium mb-1">Thank you for choosing {hospital?.name}.</p>
        <p className="text-[10px] text-gray-300 uppercase tracking-tighter">This is a computer-generated document and does not require a physical signature.</p>
        
        <div className="flex justify-center gap-6 mt-6 opacity-30 grayscale hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-1 text-[8px] font-bold"><Globe size={10} /> www.medalph.com</div>
            <div className="flex items-center gap-1 text-[8px] font-bold"><Mail size={10} /> support@medalph.com</div>
        </div>
      </div>
    </div>
  );
});

ReceiptTemplate.displayName = 'ReceiptTemplate';

export default ReceiptTemplate;

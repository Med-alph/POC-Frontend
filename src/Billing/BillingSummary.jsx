import { Button } from "@/components/ui/button";



export default function BillingSummary({ subtotal, tax, totalToday, pendingTotal, onPayNow }) {
    return (
        <div className="mt-4 flex flex-col md:flex-row justify-between items-center gap-2 border-t pt-2">
            <div>
                <p>Subtotal: ₹{subtotal}</p>
                <p>Tax: ₹{tax}</p>
                <p>Total Today: ₹{totalToday}</p>
                <p>Pending Total: ₹{pendingTotal}</p>
            </div>
            <Button onClick={onPayNow}>Pay Now</Button>
        </div>
    );
};

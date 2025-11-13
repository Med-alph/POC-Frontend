import { useState, useEffect } from "react";



export default function ItemTable({ items, onTotalChange }) {
    const [tableItems, setTableItems] = useState(items);

    useEffect(() => {
        const total = tableItems
            .filter(item => item.payNow)
            .reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
        onTotalChange(total);
    }, [tableItems]);

    const togglePayNow = (id) => {
        setTableItems(prev =>
            prev.map(item => item.id === id ? { ...item, payNow: !item.payNow } : item)
        );
    };

    const updateQty = (id, qty) => {
        setTableItems(prev => prev.map(item => item.id === id ? { ...item, qty } : item));
    };

    return (
        <div className="overflow-x-auto border rounded">
            <table className="table-auto w-full">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-2 py-1 text-left">Item</th>
                        <th className="px-2 py-1 text-left">Qty</th>
                        <th className="px-2 py-1 text-left">Unit Price</th>
                        <th className="px-2 py-1 text-left">Total</th>
                        <th className="px-2 py-1 text-left">Pay Now</th>
                    </tr>
                </thead>
                <tbody>
                    {tableItems.map(item => (
                        <tr key={item.id} className="border-b">
                            <td className="px-2 py-1">{item.name}</td>
                            <td className="px-2 py-1">
                                <input
                                    type="number"
                                    min={1}
                                    value={item.qty}
                                    onChange={(e) => updateQty(item.id, Number(e.target.value))}
                                    className="w-16 border rounded px-1 py-0.5"
                                />
                            </td>
                            <td className="px-2 py-1">{item.unitPrice}</td>
                            <td className="px-2 py-1">{item.qty * item.unitPrice}</td>
                            <td className="px-2 py-1 text-center">
                                <input type="checkbox" checked={item.payNow} onChange={() => togglePayNow(item.id)} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

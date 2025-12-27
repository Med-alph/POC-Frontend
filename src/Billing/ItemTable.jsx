import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, ShoppingCart } from "lucide-react";

export default function ItemTable({ items, onTotalChange }) {
    const [tableItems, setTableItems] = useState(items);

    useEffect(() => {
        const total = tableItems
            .filter(item => item.payNow)
            .reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
        onTotalChange(total);
    }, [tableItems, onTotalChange]);

    const togglePayNow = (id) => {
        setTableItems(prev =>
            prev.map(item => item.id === id ? { ...item, payNow: !item.payNow } : item)
        );
    };

    const updateQty = (id, qty) => {
        if (qty < 1) return;
        setTableItems(prev => prev.map(item => item.id === id ? { ...item, qty } : item));
    };

    return (
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    Billing Items
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                    Item Name
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                    Quantity
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                    Unit Price
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                    Total
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                    Pay Now
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {tableItems.map((item, idx) => (
                                <tr 
                                    key={item.id} 
                                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                                        item.payNow ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                                    }`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                                                <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                {item.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Input
                                            type="number"
                                            min={1}
                                            value={item.qty}
                                            onChange={(e) => updateQty(item.id, Number(e.target.value))}
                                            className="w-20 h-10 text-center font-semibold border focus:border-blue-500 dark:focus:border-blue-400 rounded-md"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                            ₹{item.unitPrice}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="font-bold text-lg text-gray-900 dark:text-white">
                                            ₹{item.qty * item.unitPrice}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex justify-center">
                                            <Checkbox 
                                                checked={item.payNow} 
                                                onCheckedChange={() => togglePayNow(item.id)}
                                                className="h-5 w-5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};

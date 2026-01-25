import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, Plus, Trash2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function ItemTable({ items, onTotalChange }) {
    const [tableItems, setTableItems] = useState([]);

    const ITEM_TYPES = ["Consultation", "Pharmaceutical", "Service"];

    useEffect(() => {
        if (items && items.length > 0) {
            setTableItems(items);
        }
    }, [items]);

    useEffect(() => {
        const total = tableItems
            .filter(item => item.payNow)
            .reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.unitPrice) || 0), 0);
        onTotalChange(total);
    }, [tableItems, onTotalChange]);

    const togglePayNow = (id) => {
        setTableItems(prev =>
            prev.map(item => item.id === id ? { ...item, payNow: !item.payNow } : item)
        );
    };

    const updateItem = (id, field, value) => {
        setTableItems(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const addItem = () => {
        const newItem = {
            id: `new-${Date.now()}`,
            name: "",
            type: "Service",
            qty: 1,
            unitPrice: 0,
            payNow: true,
            isNew: true
        };
        setTableItems(prev => [...prev, newItem]);
    };

    const removeItem = (id) => {
        setTableItems(prev => prev.filter(item => item.id !== id));
    };

    return (
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    Billing Items
                </CardTitle>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                    className="flex items-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                    <Plus className="h-4 w-4" />
                    Add Item
                </Button>
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
                                    Type
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
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {tableItems.map((item, idx) => (
                                <tr
                                    key={item.id}
                                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${item.payNow ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                                        }`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                                                <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <Input
                                                value={item.name}
                                                onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                                placeholder="Enter item name"
                                                className="bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto font-semibold text-gray-900 dark:text-white"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Select
                                            value={item.type || "Service"}
                                            onValueChange={(val) => updateItem(item.id, 'type', val)}
                                        >
                                            <SelectTrigger className="w-40 h-9 border-none bg-transparent shadow-none focus:ring-0 px-0 font-medium">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ITEM_TYPES.map(type => (
                                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Input
                                            type="number"
                                            min={1}
                                            value={item.qty}
                                            onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                                            className="w-20 h-10 text-center font-semibold border focus:border-blue-500 dark:focus:border-blue-400 rounded-md"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-1">
                                            <span className="text-gray-500">₹</span>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={item.unitPrice}
                                                onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                                                className="w-24 h-10 font-semibold border focus:border-blue-500 dark:focus:border-blue-400 rounded-md"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="font-bold text-lg text-gray-900 dark:text-white">
                                            ₹{(Number(item.qty) || 0) * (Number(item.unitPrice) || 0)}
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
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeItem(item.id)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {tableItems.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                                        No items added. Click "Add Item" to start billing.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};

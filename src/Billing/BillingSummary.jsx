import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Receipt, Calculator } from "lucide-react";

export default function BillingSummary({ subtotal, tax, totalToday, pendingTotal, onPayNow, loading }) {
  return (
    <Card className="mt-6 shadow-xl border-0 rounded-2xl dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex-1 w-full lg:w-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calculator className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Billing Summary</h3>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Subtotal</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">₹{subtotal.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Tax (10%)</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">₹{tax.toFixed(2)}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-1 font-medium">Total Today</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">₹{totalToday.toFixed(2)}</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                <p className="text-xs text-orange-600 dark:text-orange-400 mb-1 font-medium">Pending Total</p>
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">₹{pendingTotal.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-auto">
            <Button
              onClick={onPayNow}
              disabled={loading}
              className="w-full lg:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-14 px-8 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Receipt className="h-5 w-5" />
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 inline" />
                  Processing...
                </>
              ) : (
                "Pay Now"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

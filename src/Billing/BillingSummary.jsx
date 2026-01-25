import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Receipt, Calculator, CreditCard, Banknote, ShieldCheck } from "lucide-react";

export default function BillingSummary({ subtotal, tax, totalToday, pendingTotal, onPayNow, loading, showPayButton = true, patient }) {
  const isCreditEligible = patient?.is_credit_eligible?.toLowerCase() === "yes" || patient?.is_credit_eligible === true;
  const creditLimit = parseFloat(patient?.credit_limit || patient?.credit_amount || 0);
  const currentCreditBalance = parseFloat(patient?.current_credit_balance || 0);
  const remainingCredit = creditLimit - currentCreditBalance;

  // Requirement: Patient must be eligible AND have enough remaining credit for THIS specific bill
  const canUseCredit = isCreditEligible && remainingCredit >= totalToday;

  return (
    <Card className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6">
          <div className="flex-1 w-full lg:w-auto">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Billing Summary</h3>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-4 border border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Subtotal</p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">₹{subtotal.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-4 border border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Tax (10%)</p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">₹{tax.toFixed(2)}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-1 font-medium">Total Today</p>
                <p className="text-base font-semibold text-blue-600 dark:text-blue-400">₹{totalToday.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-4 border border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Patient Credit</p>
                <p className={`text-base font-semibold ${isCreditEligible ? 'text-green-600' : 'text-gray-400'}`}>
                  {isCreditEligible ? `₹${remainingCredit.toFixed(2)}` : 'Ineligible'}
                </p>
              </div>
            </div>
          </div>

          {showPayButton && (
            <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Choose Payment Mode</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Digital Payment */}
                  <Button
                    onClick={() => onPayNow('DIGITAL')}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white h-14 flex flex-col items-center justify-center gap-1 rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span className="font-bold">Online Payment</span>
                    </div>
                    <span className="text-[10px] opacity-80">UPI, Card, Netbanking</span>
                  </Button>

                  {/* Cash Payment */}
                  <Button
                    onClick={() => onPayNow('CASH')}
                    disabled={loading}
                    variant="outline"
                    className="border-gray-200 dark:border-gray-700 h-14 flex flex-col items-center justify-center gap-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                      <Banknote className="h-4 w-4 text-green-600" />
                      <span className="font-bold">Cash at Counter</span>
                    </div>
                    <span className="text-[10px] text-gray-500">Pay physically at reception</span>
                  </Button>

                  {/* Credit Payment */}
                  <Button
                    onClick={() => onPayNow('CREDIT')}
                    disabled={loading || !canUseCredit}
                    variant="outline"
                    className={`h-14 flex flex-col items-center justify-center gap-1 rounded-md ${canUseCredit ? 'border-purple-200 bg-purple-50/30 hover:bg-purple-50 text-purple-700' : 'opacity-50 cursor-not-allowed bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="font-bold">Patient Credit</span>
                    </div>
                    <span className="text-[10px]">{canUseCredit ? 'Deduct from Credit Limit' : isCreditEligible ? 'Insufficient Credit' : 'Not Eligible'}</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

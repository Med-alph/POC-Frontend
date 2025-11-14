import React, { useState } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Smartphone, Wallet, Receipt } from "lucide-react";
import paymentsAPI from "../api/paymentsapi";


const PaymentTab = ({ amount = 500, currency = "INR", patient, orderId, onPaymentSuccess }) => {
  const [method, setMethod] = useState("card");
  const [loading, setLoading] = useState(false);

  const loadRazorpay = (src) => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const openRazorpay = async () => {
    setLoading(true);

    const res = await loadRazorpay("https://checkout.razorpay.com/v1/checkout.js");
    if (!res) {
      alert("Razorpay SDK failed to load. Check your internet connection.");
      setLoading(false);
      return;
    }

    if (!orderId) {
      alert("Order ID missing. Please try again.");
      setLoading(false);
      return;
    }

    const options = {
      key: import.meta.env.VITE_TestKey, // Replace with your Razorpay Key ID
      amount: amount * 100, // Amount in paise
      currency,
      name: "DermaCare Clinic",
      description: `Payment for ${patient?.name || "patient"}`,
      image: "https://razorpay.com/favicon.png",
      order_id: orderId,
      handler: async function (response) {
        try {
          await paymentsAPI.verifyPayment({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
          onPaymentSuccess && onPaymentSuccess();
        } catch (error) {
          alert("Payment verification failed. Please contact support.");
          console.error(error);
        }
      },
      prefill: {
        name: patient?.name || "John Doe",
        email: patient?.email || "johndoe@example.com",
        contact: patient?.phone || "9999999999",
      },
      theme: { color: "#2563eb" },
      method: {
        card: method === "card",
        upi: method === "upi",
        wallet: method === "wallet",
        netbanking: method === "netbanking",
      },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
    setLoading(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* LEFT SIDE: Payment options */}
      <Card className="w-full lg:w-2/3 shadow-xl border-0 rounded-2xl dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 text-white">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <CreditCard className="h-6 w-6" />
            </div>
            Select Payment Method
          </h2>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={method} onValueChange={setMethod}>
            <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full mb-6 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
              <TabsTrigger 
                value="card"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg font-semibold transition-all"
              >
                <CreditCard className="h-4 w-4 mr-2" /> Card
              </TabsTrigger>
              <TabsTrigger 
                value="upi"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg font-semibold transition-all"
              >
                <Smartphone className="h-4 w-4 mr-2" /> UPI
              </TabsTrigger>
              <TabsTrigger 
                value="wallet"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg font-semibold transition-all"
              >
                <Wallet className="h-4 w-4 mr-2" /> Wallet
              </TabsTrigger>
              <TabsTrigger 
                value="later"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg font-semibold transition-all"
              >
                Pay Later
              </TabsTrigger>
            </TabsList>

            <TabsContent value="card" className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                  Pay securely using your debit/credit card.
                </p>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                      Cardholder Name
                    </Label>
                    <Input 
                      placeholder="Enter cardholder name" 
                      className="h-12 border-2 focus:border-blue-500 dark:focus:border-blue-400"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="upi" className="space-y-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                  Enter your UPI ID to continue with instant payment.
                </p>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                      UPI ID
                    </Label>
                    <Input 
                      placeholder="username@upi" 
                      className="h-12 border-2 focus:border-purple-500 dark:focus:border-purple-400"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="wallet" className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  You can pay using digital wallets like Paytm, PhonePe, Google Pay, etc.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="later" className="space-y-4">
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  The amount will be added to the patient's pending balance and can be paid later.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* RIGHT SIDE: Summary & Button */}
      <Card className="w-full lg:w-1/3 h-fit shadow-xl border-0 rounded-2xl dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-500 text-white">
          <h2 className="text-xl font-bold flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Receipt className="h-5 w-5" />
            </div>
            Payment Summary
          </h2>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Amount</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">₹{amount.toFixed(2)}</span>
            </div>
            <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹{amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-6 pt-0">
          <Button
            disabled={loading || method === "later"}
            className="w-full text-lg py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={openRazorpay}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 inline" />
                Processing...
              </>
            ) : (
              "Pay Now"
            )}
          </Button>
          {method === "later" && (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
              Payment will be added to pending balance
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentTab;



import React, { useState } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Smartphone, Wallet } from "lucide-react";

const PaymentTab = ({ amount = 500, currency = "INR", patient }) => {
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

        // Normally you should create an order on backend
        const options = {
            key: import.meta.env.VITE_TestKey, // 🔹 Replace with your Razorpay Key ID
            amount: amount * 100, // Amount in paise
            currency: currency,
            name: "DermaCare Clinic",
            description: `Payment for ${patient?.name || "patient"}`,
            image: "https://razorpay.com/favicon.png",
            handler: function (response) {
                alert(`Payment successful!\nPayment ID: ${response.razorpay_payment_id}`);
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
        <div className="p-6 flex flex-col lg:flex-row gap-6">
            {/* LEFT SIDE: Payment options */}
            <Card className="w-full lg:w-2/3 shadow-md rounded-2xl">
                <CardHeader>
                    <h2 className="text-xl font-semibold">Select Payment Method</h2>
                </CardHeader>
                <CardContent>
                    <Tabs value={method} onValueChange={setMethod}>
                        <TabsList className="grid grid-cols-4 w-full mb-4">
                            <TabsTrigger value="card">
                                <CreditCard className="h-4 w-4 mr-2" /> Card
                            </TabsTrigger>
                            <TabsTrigger value="upi">
                                <Smartphone className="h-4 w-4 mr-2" /> UPI
                            </TabsTrigger>
                            <TabsTrigger value="wallet">
                                <Wallet className="h-4 w-4 mr-2" /> Wallet
                            </TabsTrigger>
                            <TabsTrigger value="later">Pay Later</TabsTrigger>
                        </TabsList>

                        <TabsContent value="card">
                            <p className="text-gray-600 mb-3">
                                Pay securely using your debit/credit card.
                            </p>
                            <Label>Cardholder Name</Label>
                            <Input placeholder="Enter cardholder name" />
                        </TabsContent>

                        <TabsContent value="upi">
                            <p className="text-gray-600 mb-3">Enter your UPI ID to continue.</p>
                            <Label>UPI ID</Label>
                            <Input placeholder="username@upi" />
                        </TabsContent>

                        <TabsContent value="wallet">
                            <p className="text-gray-600">You can pay using wallets like Paytm, PhonePe, etc.</p>
                        </TabsContent>

                        <TabsContent value="later">
                            <p className="text-gray-600">
                                The amount will be added to the patient’s pending balance.
                            </p>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* RIGHT SIDE: Summary & Button */}
            <Card className="w-full lg:w-1/3 h-fit shadow-md rounded-2xl">
                <CardHeader>
                    <h2 className="text-xl font-semibold">Billing Summary</h2>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between mb-2 text-gray-700">
                        <span>Amount</span>
                        <span>₹{amount}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between text-lg font-semibold">
                        <span>Total</span>
                        <span>₹{amount}</span>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button
                        disabled={loading || method === "later"}
                        className="w-full text-lg py-6 bg-blue-600 hover:bg-blue-700"
                        onClick={openRazorpay}
                    >
                        {loading ? "Processing..." : "Pay Now"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default PaymentTab;

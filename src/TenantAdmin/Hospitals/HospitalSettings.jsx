import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader, Save, ShieldCheck, MessageSquare, CreditCard, Clock, Globe, Eye, EyeOff, Calendar, Trash2, Plus } from "lucide-react";
import hospitalsapi from "../../api/hospitalsapi";
import toast from "react-hot-toast";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const WEEKEND = ["Saturday", "Sunday"];
const ALL_DAYS = [...WEEKDAYS, ...WEEKEND];

const createDefaultTimings = () => {
    const timings = {};
    ALL_DAYS.forEach(day => {
        timings[day.toLowerCase()] = {
            active: false,
            sessions: [{ start: "09:00", end: "17:00" }]
        };
    });
    return timings;
};

// Recreated DayRow component for settings context
function DayRow({ day, data, onToggle, onSessionChange, onAddSession, onRemoveSession }) {
    const { active, sessions } = data;

    return (
        <div className={`p-4 rounded-xl border transition-all duration-200 w-full ${active ? 'bg-blue-50/50 border-blue-100 shadow-sm' : 'bg-transparent border-transparent hover:bg-gray-50'}`}>
            <div className="flex flex-col sm:flex-row gap-4 w-full">
                <div className="flex items-center gap-3 pt-1 sm:w-[130px] shrink-0">
                    <Checkbox
                        id={`day-${day}`}
                        checked={active}
                        onCheckedChange={(checked) => onToggle(day, checked)}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 mt-0.5"
                    />
                    <label
                        htmlFor={`day-${day}`}
                        className={`text-sm font-medium cursor-pointer select-none ${active ? 'text-gray-900' : 'text-gray-500'}`}
                    >
                        {day}
                    </label>
                </div>

                <div className="flex-1 min-w-0 w-full">
                    {active ? (
                        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-1 duration-200 w-full">
                            {sessions.map((session, index) => (
                                <div key={index} className="w-full">
                                    <div className="flex items-center gap-2 w-full">
                                        <div className="relative flex-1 min-w-0">
                                            <Input
                                                type="time"
                                                value={session.start}
                                                onChange={(e) => onSessionChange(day, index, 'start', e.target.value)}
                                                className="w-full h-9 bg-white text-sm focus-visible:ring-blue-200"
                                            />
                                        </div>
                                        <span className="text-gray-400 text-xs font-medium uppercase px-1 shrink-0">to</span>
                                        <div className="relative flex-1 min-w-0">
                                            <Input
                                                type="time"
                                                value={session.end}
                                                onChange={(e) => onSessionChange(day, index, 'end', e.target.value)}
                                                className="w-full h-9 bg-white text-sm focus-visible:ring-blue-200"
                                            />
                                        </div>
                                        <div className="w-8 flex justify-center shrink-0">
                                            {sessions.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                    onClick={() => onRemoveSession(day, index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="pt-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onAddSession(day)}
                                    className="text-xs h-8 px-3 border-dashed text-blue-600 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                                >
                                    <Plus className="h-3 w-3 mr-1.5" /> Add Session
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="pt-1.5 text-sm text-gray-400 italic font-light">Hospital Closed</div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function HospitalSettings({ hospitalId, hospitalName }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [validating, setValidating] = useState(false);
    const [showSecret, setShowSecret] = useState(false);
    const [settings, setSettings] = useState({
        // General
        name: "",
        logo: "",
        address: "",
        // Appointments
        avg_appointment_time: 30,
        buffer_time: 5,
        cancellation_policy_days: 1,
        // Payments
        razorpay_key_id: "",
        razorpay_key_secret: "",
        is_payment_enabled: false,
        // WhatsApp
        whatsapp_number: "",
        bot_active: false,
        welcome_message: "",
    });
    const [timings, setTimings] = useState(createDefaultTimings());

    useEffect(() => {
        if (hospitalId) {
            fetchSettings();
            fetchTimings();
        }
    }, [hospitalId]);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const data = await hospitalsapi.getSettings(hospitalId);
            setSettings(data);
        } catch (error) {
            toast.error("Failed to fetch settings: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchTimings = async () => {
        try {
            const data = await hospitalsapi.getTimings(hospitalId);
            if (data && Object.keys(data).length > 0) {
                // Merge with default to ensure all days exist
                setTimings(prev => ({ ...prev, ...data }));
            }
        } catch (error) {
            console.error("Failed to fetch timings:", error);
            // Don't block UI, just keep defauts
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const updateTimingsState = (day, field, value, sessionIndex = null) => {
        const dayKey = day.toLowerCase();
        setTimings(prev => {
            const currentDay = { ...prev[dayKey] };

            if (field === 'active') {
                currentDay.active = value;
            } else if (field === 'add_session') {
                currentDay.sessions = [...currentDay.sessions, { start: "09:00", end: "17:00" }];
            } else if (field === 'remove_session') {
                if (currentDay.sessions.length > 1) {
                    currentDay.sessions = currentDay.sessions.filter((_, i) => i !== sessionIndex);
                }
            } else if (field === 'session_update') {
                const newSessions = [...currentDay.sessions];
                newSessions[sessionIndex] = { ...newSessions[sessionIndex], ...value };
                currentDay.sessions = newSessions;
            }

            return { ...prev, [dayKey]: currentDay };
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Convert numeric fields to integers before sending
            const payload = {
                ...settings,
                avg_appointment_time: parseInt(settings.avg_appointment_time, 10),
                buffer_time: parseInt(settings.buffer_time, 10),
                cancellation_policy_days: parseInt(settings.cancellation_policy_days, 10),
            };

            // Save general settings
            await hospitalsapi.updateSettings(hospitalId, payload);

            // Save timings
            await hospitalsapi.updateTimings(hospitalId, timings);

            toast.success("All settings updated successfully!");
        } catch (error) {
            toast.error("Failed to update settings: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleValidateRazorpay = async () => {
        setValidating(true);
        try {
            await hospitalsapi.validateRazorpay({
                key_id: settings.razorpay_key_id,
                key_secret: settings.razorpay_key_secret,
            });
            toast.success("Razorpay credentials are valid!");
        } catch (error) {
            toast.error("Validation failed: " + error.message);
        } finally {
            setValidating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <Loader className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-gray-500 font-medium">Loading hospital settings...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{hospitalName || "Hospital"} Settings</h2>
                    <p className="text-sm text-gray-500">Configure your hospital profile, bookings, and integrations.</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
                >
                    {saving ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {saving ? "Saving Changes..." : "Save All Changes"}
                </Button>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-5 lg:w-[750px] mb-8 bg-gray-100 p-1 rounded-xl">
                    <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Globe className="h-4 w-4 mr-2" /> General
                    </TabsTrigger>
                    <TabsTrigger value="timings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Calendar className="h-4 w-4 mr-2" /> Timings
                    </TabsTrigger>
                    <TabsTrigger value="appointments" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Clock className="h-4 w-4 mr-2" /> Booking
                    </TabsTrigger>
                    <TabsTrigger value="payments" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <CreditCard className="h-4 w-4 mr-2" /> Payments
                    </TabsTrigger>
                    <TabsTrigger value="communication" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <MessageSquare className="h-4 w-4 mr-2" /> Chat Bot
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                    <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Hospital Profile</CardTitle>
                            <CardDescription>Basic information about your hospital.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Hospital Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={settings.name}
                                    onChange={handleChange}
                                    placeholder="Enter hospital name"
                                    className="bg-white"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="logo">Hospital Logo URL</Label>
                                <div className="flex gap-4 items-center">
                                    <Input
                                        id="logo"
                                        name="logo"
                                        value={settings.logo}
                                        onChange={handleChange}
                                        placeholder="https://example.com/logo.png"
                                        className="bg-white flex-1"
                                    />
                                    {settings.logo && (
                                        <div className="h-10 w-10 rounded border overflow-hidden bg-white">
                                            <img src={settings.logo} alt="Preview" className="h-full w-full object-contain" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea
                                    id="address"
                                    name="address"
                                    value={settings.address}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Full hospital address"
                                    className="bg-white"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="timings" className="space-y-4">
                    <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center">
                                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                                Operating Hours
                            </CardTitle>
                            <CardDescription>Set the days and times your hospital is open. Patient bookings will be restricted to these hours.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                {/* Weekdays Group */}
                                <div className="border rounded-xl p-4 bg-white/80 space-y-3">
                                    <div className="flex items-center gap-2 border-b pb-2 mb-2">
                                        <span className="font-semibold text-sm text-gray-700">Weekdays (Mon - Fri)</span>
                                    </div>
                                    {WEEKDAYS.map(day => (
                                        <DayRow
                                            key={day}
                                            day={day}
                                            data={timings[day.toLowerCase()]}
                                            onToggle={(d, val) => updateTimingsState(d, 'active', val)}
                                            onSessionChange={(d, idx, field, val) => updateTimingsState(d, 'session_update', { [field]: val }, idx)}
                                            onAddSession={(d) => updateTimingsState(d, 'add_session')}
                                            onRemoveSession={(d, idx) => updateTimingsState(d, 'remove_session', null, idx)}
                                        />
                                    ))}
                                </div>

                                {/* Weekend Group */}
                                <div className="border rounded-xl p-4 bg-white/80 space-y-3">
                                    <div className="flex items-center gap-2 border-b pb-2 mb-2">
                                        <span className="font-semibold text-sm text-gray-700">Weekend (Sat - Sun)</span>
                                    </div>
                                    {WEEKEND.map(day => (
                                        <DayRow
                                            key={day}
                                            day={day}
                                            data={timings[day.toLowerCase()]}
                                            onToggle={(d, val) => updateTimingsState(d, 'active', val)}
                                            onSessionChange={(d, idx, field, val) => updateTimingsState(d, 'session_update', { [field]: val }, idx)}
                                            onAddSession={(d) => updateTimingsState(d, 'add_session')}
                                            onRemoveSession={(d, idx) => updateTimingsState(d, 'remove_session', null, idx)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="appointments" className="space-y-4">
                    <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center">
                                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                                Appointment Settings
                            </CardTitle>
                            <CardDescription>Control how patients book their appointments.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="avg_appointment_time">Average Appointment Time (Mins)</Label>
                                <Input
                                    id="avg_appointment_time"
                                    name="avg_appointment_time"
                                    type="number"
                                    value={settings.avg_appointment_time}
                                    onChange={handleChange}
                                    className="bg-white"
                                />
                                <p className="text-xs text-gray-500">Default duration for each booking slot.</p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="buffer_time">Buffer Time (Mins)</Label>
                                <Input
                                    id="buffer_time"
                                    name="buffer_time"
                                    type="number"
                                    value={settings.buffer_time}
                                    onChange={handleChange}
                                    className="bg-white"
                                />
                                <p className="text-xs text-gray-500">Gap between two appointments.</p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="cancellation_policy_days">Cancellation Policy (Days)</Label>
                                <Input
                                    id="cancellation_policy_days"
                                    name="cancellation_policy_days"
                                    type="number"
                                    value={settings.cancellation_policy_days}
                                    onChange={handleChange}
                                    className="bg-white"
                                />
                                <p className="text-xs text-gray-500">Patients can cancel up to this many days before.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payments" className="space-y-4">
                    <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle className="text-lg font-bold flex items-center">
                                    <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                                    Payment Integrations
                                </CardTitle>
                                <CardDescription>Configure Razorpay to accept online payments.</CardDescription>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Label htmlFor="is_payment_enabled" className="text-sm font-medium">Enable Payments</Label>
                                <input
                                    type="checkbox"
                                    id="is_payment_enabled"
                                    name="is_payment_enabled"
                                    checked={settings.is_payment_enabled}
                                    onChange={handleChange}
                                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <div className="grid gap-2">
                                    <Label htmlFor="razorpay_key_id">Razorpay Key ID</Label>
                                    <Input
                                        id="razorpay_key_id"
                                        name="razorpay_key_id"
                                        value={settings.razorpay_key_id}
                                        onChange={handleChange}
                                        placeholder="rzp_test_..."
                                        className="bg-white"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="razorpay_key_secret">Razorpay Key Secret</Label>
                                    <div className="relative">
                                        <Input
                                            id="razorpay_key_secret"
                                            name="razorpay_key_secret"
                                            type={showSecret ? "text" : "password"}
                                            value={settings.razorpay_key_secret}
                                            onChange={handleChange}
                                            placeholder="••••••••••••••••"
                                            className="bg-white pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowSecret(!showSecret)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-start">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleValidateRazorpay}
                                        disabled={validating || !settings.razorpay_key_id || !settings.razorpay_key_secret}
                                        className="bg-white border-blue-200 text-blue-600 hover:bg-blue-50"
                                    >
                                        {validating ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                                        Test Credentials
                                    </Button>
                                </div>
                            </div>
                            <p className="text-xs text-amber-600 flex items-center">
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                Your keys are encrypted at rest and never shared with anyone.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="communication" className="space-y-4">
                    <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle className="text-lg font-bold flex items-center">
                                    <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                                    WhatsApp Bot Settings
                                </CardTitle>
                                <CardDescription>Configure your patient engagement bot.</CardDescription>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Label htmlFor="bot_active" className="text-sm font-medium">Activate Bot</Label>
                                <input
                                    type="checkbox"
                                    id="bot_active"
                                    name="bot_active"
                                    checked={settings.bot_active}
                                    onChange={handleChange}
                                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="whatsapp_number">WhatsApp Business Number</Label>
                                <Input
                                    id="whatsapp_number"
                                    name="whatsapp_number"
                                    value={settings.whatsapp_number}
                                    onChange={handleChange}
                                    placeholder="+91 98765 43210"
                                    className="bg-white"
                                />
                                <p className="text-xs text-gray-500">The number patients will interact with.</p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="welcome_message">Bot Welcome Message</Label>
                                <Textarea
                                    id="welcome_message"
                                    name="welcome_message"
                                    value={settings.welcome_message}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Welcome to [Hospital Name]! How can we assist you today?"
                                    className="bg-white"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

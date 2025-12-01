import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import toast from 'react-hot-toast';
import { remindersAPI } from "@/api/remindersapi";

export default function RescheduleReminderDialog({ open, setOpen, reminder, onSuccess }) {
    const [dueDate, setDueDate] = useState("");
    const [reminderTime, setReminderTime] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && reminder) {
            const date = reminder.due_date 
                ? new Date(reminder.due_date).toISOString().split('T')[0]
                : "";
            const time = reminder.reminder_time
                ? new Date(reminder.reminder_time).toISOString().slice(0, 16)
                : reminder.due_date
                ? new Date(reminder.due_date).toISOString().slice(0, 16)
                : "";
            
            setDueDate(date);
            setReminderTime(time);
        }
    }, [open, reminder]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!dueDate) {
            toast.error("Please select a due date");
            return;
        }

        setLoading(true);
        try {
            const updateData = {
                due_date: new Date(dueDate).toISOString(),
                reminder_time: reminderTime 
                    ? new Date(reminderTime).toISOString()
                    : new Date(dueDate).toISOString(),
                status: 'pending', // Reset to pending when rescheduled
            };

            await remindersAPI.update(reminder.id, updateData);
            toast.success("Reminder rescheduled successfully. Notifications will be sent via selected channels.");
            setOpen(false);
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Error rescheduling reminder:", error);
            toast.error(error.message || "Failed to reschedule reminder");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Reschedule Reminder</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div>
                        <Label>
                            New Due Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <Label>New Reminder Time</Label>
                        <Input
                            type="datetime-local"
                            value={reminderTime}
                            onChange={(e) => setReminderTime(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            When to send the reminder (defaults to due date if not set)
                        </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Rescheduling..." : "Reschedule"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setCredentials, clearCredentials } from "../features/auth/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { Lock, AlertCircle, CheckCircle } from "lucide-react";
import { authAPI } from "../api/authapi";

export default function ChangePassword() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { addToast: toast } = useToast();

    // Get user from Redux to display name/email and ensure they are authenticated
    const user = useSelector((state) => state.auth.user);

    // Protect this route - if no user or no temporary password flag, redirect
    useEffect(() => {
        if (!user) {
            navigate("/");
            return;
        }

        // If user is logged in but DOES NOT have a temporary password, 
        // they shouldn't be here (unless they navigated manually).
        // You might want to allow voluntary password changes here too,
        // but for the specific "Force Change" flow:
        if (user.is_temporary_password !== true) {
            toast({
                title: "Not Required",
                description: "Your password does not need to be changed.",
            });
            // Redirect to appropriate dashboard based on role
            if (user.designation_group?.toLowerCase() === "doctor") {
                navigate("/doctor-dashboard");
            } else {
                navigate("/dashboard");
            }
        }
    }, [user, navigate, toast]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");

        if (newPassword.length < 8) {
            setErrorMessage("New password must be at least 8 characters long");
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage("New passwords do not match");
            return;
        }

        // Optional: Check if new password is same as temporary password?
        // Usually backend handles "cannot reuse recent password" logic.

        setIsLoading(true);

        try {
            // Call API to change password
            // Assumption: You either have a specific endpoint for 'change-temporary-password'
            // or a generic 'update-profile' or 'change-password' endpoint.
            // Typically: POST /api/auth/change-password { currentPassword, newPassword }

            // Update: Using authAPI.changePassword - ensure this method exists or create it
            // Passing currentPassword might be required by backend for verification
            await authAPI.changePassword({
                current_password: currentPassword, // If required by backend
                new_password: newPassword
            });

            toast({
                title: "Success! 🔒",
                description: "Password updated successfully. Please login again with your new password.",
                variant: "default",
            });

            // Clear Redux state to force re-login
            dispatch(clearCredentials());

            // Redirect to login after short delay
            setTimeout(() => {
                navigate("/");
            }, 2000);

        } catch (error) {
            console.error("Change password error:", error);
            setErrorMessage(error.message || "Failed to update password. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null; // Prevent flicker before redirect

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto bg-amber-100 p-3 rounded-full w-fit">
                        <Lock className="h-8 w-8 text-amber-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-800">Change Password</CardTitle>
                    <CardDescription className="text-gray-600">
                        For security reasons, you must change your temporary password to continue.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Display User Info */}
                        <div className="bg-blue-50 p-3 rounded-md mb-4 flex items-center gap-3">
                            <div className="bg-blue-200 rounded-full p-1">
                                <CheckCircle className="h-4 w-4 text-blue-700" />
                            </div>
                            <div className="text-sm">
                                <p className="font-medium text-blue-900">Logged in as: {user.name}</p>
                                <p className="text-blue-700">{user.email}</p>
                            </div>
                        </div>

                        {/* Current Password - Optional depending on backend requirements for first login */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Current (Temporary) Password</label>
                            <Input
                                type="password"
                                placeholder="Enter current password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">New Password</label>
                            <Input
                                type="password"
                                placeholder="Enter new password (min 8 chars)"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                            <Input
                                type="password"
                                placeholder="Re-enter new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        {errorMessage && (
                            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-md">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <p>{errorMessage}</p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
                            disabled={isLoading}
                        >
                            {isLoading ? "Updating..." : "Update Password & Login"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

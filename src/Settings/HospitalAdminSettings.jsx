import React from "react";
import { useSelector } from "react-redux";
import HospitalSettings from "../TenantAdmin/Hospitals/HospitalSettings";

export default function HospitalAdminSettings() {
    const user = useSelector((state) => state.auth.user);
    const hospitalId = user?.hospital_id;
    const hospitalName = user?.hospital_name || "Hospital";

    if (!hospitalId) {
        return (
            <div className="p-8 text-center text-gray-500">
                You are not associated with any hospital.
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <HospitalSettings
                hospitalId={hospitalId}
                hospitalName={hospitalName}
            />
        </div>
    );
}

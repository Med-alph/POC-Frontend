import React from "react";
import ProcedureList from "../TenantAdmin/Procedures/ProcedureList";

const MasterProcedures = () => {
    return (
        <div className="container mx-auto p-6 min-h-screen bg-gray-50/30">
            <ProcedureList isHospitalAdmin={true} />
        </div>
    );
};

export default MasterProcedures;

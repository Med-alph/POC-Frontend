import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import CreateStaffDialog from "./AddStaff"
import { toast } from "react-hot-toast"

export default function StaffListPage() {
    const hospitalId = "HSP001"

    const [staffList, setStaffList] = useState([])
    const [openDialog, setOpenDialog] = useState(false)

    const handleAddStaff = (newStaff) => {
        setStaffList(prev => [...prev, newStaff])
        toast.success(`Staff "${newStaff.staff_name}" added!`)
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">👩‍⚕️ Staff Management</h1>
                <Button
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => setOpenDialog(true)}
                >
                    <PlusCircle size={18} /> Add Staff
                </Button>
            </div>

            {/* Staff Table */}
            <table className="w-full border-collapse border border-gray-200">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border p-2">Name</th>
                        <th className="border p-2">Department</th>
                        <th className="border p-2">Email</th>
                        <th className="border p-2">Phone</th>
                        <th className="border p-2">Experience</th>
                    </tr>
                </thead>
                <tbody>
                    {staffList.map((staff, idx) => (
                        <tr key={idx} className="text-sm">
                            <td className="border p-2">{staff.staff_name}</td>
                            <td className="border p-2">{staff.department}</td>
                            <td className="border p-2">{staff.email}</td>
                            <td className="border p-2">{staff.contact_info}</td>
                            <td className="border p-2">{staff.experience}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Create Staff Dialog */}
            <CreateStaffDialog
                hospitalId={hospitalId}
                onAdd={handleAddStaff}
                open={openDialog}
                setOpen={setOpenDialog}
            />
        </div>
    )
}

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import CreateStaffDialog from "./AddStaff"
import { toast } from "react-hot-toast"
import staffApi from "@/api/staffApi" // Import your staff API client

export default function StaffListPage() {
  const [hospitalId, setHospitalId] = useState(null)
  const [staffList, setStaffList] = useState([])
  const [openDialog, setOpenDialog] = useState(false)

  useEffect(() => {
    // Get hospital_id from localStorage user object on mount
    const userJson = localStorage.getItem('user')
    if (userJson) {
      try {
        const user = JSON.parse(userJson)
        if (user.hospital_id) {
          setHospitalId(user.hospital_id)
        } else {
          toast.error("Hospital ID not found in user data")
        }
      } catch (e) {
        console.error("Failed to parse user JSON:", e)
        toast.error("Invalid user data in local storage")
      }
    } else {
      toast.error("User not logged in")
    }
  }, [])

  // Fetch staff whenever hospitalId is set/changed
  useEffect(() => {
    if (!hospitalId) return; // Wait for hospitalId to be set

    async function fetchStaff() {
      try {
        const response = await staffApi.getByHospital(hospitalId, { limit: 1000 }) // adjust limit/pagination
        setStaffList(response.data) // assuming response shape: { data: [...] }
      } catch (err) {
        console.error("Failed to fetch staff:", err)
        toast.error("Failed to load staff data")
      }
    }
    fetchStaff()
  }, [hospitalId])

  const handleAddStaff = (newStaff) => {
    setStaffList(prev => [...prev, newStaff])
    toast.success(`Staff "${newStaff.staff_name}" added!`)
  }

  if (!hospitalId) {
    return <div className="p-6">Loading hospital info...</div>
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
            <tr key={staff.id || idx} className="text-sm">
              <td className="border p-2">{staff.staff_name}</td>
              <td className="border p-2">{staff.department || (staff.designation?.department || staff.designation?.group_name)}</td>
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

import React, { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { User, Users, Shield, Edit, Save, X } from "lucide-react"
import { useToast } from "@/components/ui/toast"

// Mock data for demonstration
const mockStaff = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@hospital.com",
    position: "Doctor",
    department: "Cardiology",
    currentRole: "Doctor",
    roles: ["Doctor"]
  },
  {
    id: 2,
    name: "Nurse Mary Smith",
    email: "mary.smith@hospital.com",
    position: "Nurse",
    department: "Emergency",
    currentRole: "Nurse",
    roles: ["Nurse"]
  },
  {
    id: 3,
    name: "John Doe",
    email: "john.doe@hospital.com",
    position: "Receptionist",
    department: "Front Desk",
    currentRole: "Receptionist",
    roles: ["Receptionist"]
  },
  {
    id: 4,
    name: "Admin User",
    email: "admin@hospital.com",
    position: "Administrator",
    department: "Administration",
    currentRole: "Admin",
    roles: ["Admin"]
  }
]

const availableRoles = [
  { id: 1, name: "Admin", description: "Full system access" },
  { id: 2, name: "Doctor", description: "Medical staff with patient access" },
  { id: 3, name: "Nurse", description: "Nursing staff with limited access" },
  { id: 4, name: "Receptionist", description: "Front desk staff" }
]

export default function StaffRoleAssignment() {
  const { user } = useSelector((state) => state.auth)
  const [staff, setStaff] = useState(mockStaff)
  const [editingStaff, setEditingStaff] = useState(null)
  const [filter, setFilter] = useState("")
  const [selectedRole, setSelectedRole] = useState("")
  const { addToast: toast } = useToast()

  // Check if user has admin permissions
  const isAdmin = user?.permissions?.includes('staff:assign_roles') || 
                  user?.permissions?.includes('roles:manage') || 
                  user?.role === 'admin' || 
                  user?.role === 'super_admin'

  const filteredStaff = staff.filter(member =>
    member.name.toLowerCase().includes(filter.toLowerCase()) ||
    member.email.toLowerCase().includes(filter.toLowerCase()) ||
    member.position.toLowerCase().includes(filter.toLowerCase()) ||
    member.department.toLowerCase().includes(filter.toLowerCase())
  )

  const handleEditStaff = (staffMember) => {
    setEditingStaff(staffMember)
    setSelectedRole(staffMember.currentRole)
  }

  const handleSaveRole = (staffId, newRole) => {
    if (!newRole) {
      toast({
        title: "Error",
        description: "Please select a role.",
        variant: "destructive",
      })
      return
    }

    setStaff(staff.map(member => 
      member.id === staffId 
        ? { ...member, currentRole: newRole, roles: [newRole] }
        : member
    ))
    setEditingStaff(null)
    setSelectedRole("")
    
    toast({
      title: "Success",
      description: "Staff role updated successfully.",
    })
  }

  const handleCancelEdit = () => {
    setEditingStaff(null)
    setSelectedRole("")
  }

  const getRoleColor = (role) => {
    const colors = {
      Admin: "bg-red-100 text-red-800",
      Doctor: "bg-blue-100 text-blue-800",
      Nurse: "bg-green-100 text-green-800",
      Receptionist: "bg-yellow-100 text-yellow-800"
    }
    return colors[role] || "bg-gray-100 text-gray-800"
  }

  const getPositionIcon = (position) => {
    if (position.toLowerCase().includes('admin')) return <Shield className="w-4 h-4" />
    if (position.toLowerCase().includes('doctor')) return <User className="w-4 h-4" />
    if (position.toLowerCase().includes('nurse')) return <Users className="w-4 h-4" />
    return <User className="w-4 h-4" />
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Role Assignment</h1>
          <p className="text-gray-600 mt-2">Assign and manage roles for staff members</p>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <Input
          placeholder="Search staff members..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Staff Members ({filteredStaff.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        {getPositionIcon(member.position)}
                      </div>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center w-fit">
                      {getPositionIcon(member.position)}
                      <span className="ml-1">{member.position}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>{member.department}</TableCell>
                  <TableCell>
                    {editingStaff?.id === member.id ? (
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRoles.map(role => (
                            <SelectItem key={role.id} value={role.name}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={getRoleColor(member.currentRole)}>
                        {member.currentRole}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingStaff?.id === member.id ? (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveRole(member.id, selectedRole)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditStaff(member)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Role Information */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {availableRoles.map(role => (
          <Card key={role.id} className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Badge className={getRoleColor(role.name)}>
                {role.name}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">{role.description}</p>
            <div className="mt-2 text-xs text-gray-500">
              {staff.filter(member => member.currentRole === role.name).length} staff assigned
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

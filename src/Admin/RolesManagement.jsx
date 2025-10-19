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
import { Plus, Edit, Trash2, Save, X } from "lucide-react"
import { useToast } from "@/components/ui/toast"

// Mock data for demonstration
const mockRoles = [
  {
    id: 1,
    name: "Admin",
    description: "Full system access",
    permissions: ["appointments:view", "appointments:create", "appointments:update", "appointments:delete", "patients:view", "patients:create", "patients:update", "patients:delete", "staff:view", "staff:create", "staff:update", "staff:delete", "roles:manage"]
  },
  {
    id: 2,
    name: "Doctor",
    description: "Medical staff with patient access",
    permissions: ["appointments:view", "appointments:create", "appointments:update", "patients:view", "patients:create", "patients:update"]
  },
  {
    id: 3,
    name: "Nurse",
    description: "Nursing staff with limited access",
    permissions: ["appointments:view", "patients:view", "patients:update"]
  },
  {
    id: 4,
    name: "Receptionist",
    description: "Front desk staff",
    permissions: ["appointments:view", "appointments:create", "appointments:update", "patients:view", "patients:create"]
  }
]

const allPermissions = [
  "appointments:view", "appointments:create", "appointments:update", "appointments:delete",
  "patients:view", "patients:create", "patients:update", "patients:delete",
  "staff:view", "staff:create", "staff:update", "staff:delete",
  "hospitals:view", "hospitals:create", "hospitals:update", "hospitals:delete",
  "transcriptions:view", "transcriptions:create", "transcriptions:update", "transcriptions:delete",
  "reminders:view", "reminders:create", "reminders:update", "reminders:delete",
  "audit-logs:view", "roles:manage", "permissions:manage"
]

export default function RolesManagement() {
  const { user } = useSelector((state) => state.auth)
  const [roles, setRoles] = useState(mockRoles)
  const [editingRole, setEditingRole] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newRole, setNewRole] = useState({ name: "", description: "", permissions: [] })
  const { addToast: toast } = useToast()

  // Check if user has super admin permissions
  const isSuperAdmin = user?.permissions?.includes('roles:manage') || user?.role === 'super_admin'

  useEffect(() => {
    if (!isSuperAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to manage roles.",
        variant: "destructive",
      })
    }
  }, [isSuperAdmin, toast])

  const handleCreateRole = () => {
    if (!newRole.name.trim()) {
      toast({
        title: "Error",
        description: "Role name is required.",
        variant: "destructive",
      })
      return
    }

    const role = {
      id: Date.now(),
      ...newRole,
      name: newRole.name.trim()
    }
    
    setRoles([...roles, role])
    setNewRole({ name: "", description: "", permissions: [] })
    setIsCreating(false)
    
    toast({
      title: "Success",
      description: "Role created successfully.",
    })
  }

  const handleEditRole = (role) => {
    setEditingRole(role)
  }

  const handleSaveRole = (roleId, updatedRole) => {
    setRoles(roles.map(role => 
      role.id === roleId ? { ...role, ...updatedRole } : role
    ))
    setEditingRole(null)
    
    toast({
      title: "Success",
      description: "Role updated successfully.",
    })
  }

  const handleDeleteRole = (roleId) => {
    if (window.confirm("Are you sure you want to delete this role?")) {
      setRoles(roles.filter(role => role.id !== roleId))
      toast({
        title: "Success",
        description: "Role deleted successfully.",
      })
    }
  }

  const togglePermission = (permission, rolePermissions) => {
    if (rolePermissions.includes(permission)) {
      return rolePermissions.filter(p => p !== permission)
    } else {
      return [...rolePermissions, permission]
    }
  }

  if (!isSuperAdmin) {
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
          <h1 className="text-3xl font-bold text-gray-900">Roles Management</h1>
          <p className="text-gray-600 mt-2">Manage system roles and permissions</p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Role
        </Button>
      </div>

      {/* Create Role Form */}
      {isCreating && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Role</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="roleName">Role Name</Label>
                <Input
                  id="roleName"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  placeholder="Enter role name"
                />
              </div>
              <div>
                <Label htmlFor="roleDescription">Description</Label>
                <Input
                  id="roleDescription"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="Enter role description"
                />
              </div>
            </div>
            
            <div>
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                {allPermissions.map(permission => (
                  <label key={permission} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newRole.permissions.includes(permission)}
                      onChange={() => setNewRole({
                        ...newRole,
                        permissions: togglePermission(permission, newRole.permissions)
                      })}
                      className="rounded"
                    />
                    <span className="text-sm">{permission}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={handleCreateRole} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                Create Role
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreating(false)
                  setNewRole({ name: "", description: "", permissions: [] })
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    {editingRole?.id === role.id ? (
                      <Input
                        value={editingRole.name}
                        onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                        className="w-full"
                      />
                    ) : (
                      role.name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingRole?.id === role.id ? (
                      <Input
                        value={editingRole.description}
                        onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                        className="w-full"
                      />
                    ) : (
                      role.description
                    )}
                  </TableCell>
                  <TableCell>
                    {editingRole?.id === role.id ? (
                      <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                        {allPermissions.map(permission => (
                          <label key={permission} className="flex items-center space-x-1 text-xs">
                            <input
                              type="checkbox"
                              checked={editingRole.permissions.includes(permission)}
                              onChange={() => setEditingRole({
                                ...editingRole,
                                permissions: togglePermission(permission, editingRole.permissions)
                              })}
                              className="rounded"
                            />
                            <span>{permission}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 3).map(permission => (
                          <Badge key={permission} variant="secondary" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                        {role.permissions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{role.permissions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingRole?.id === role.id ? (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveRole(role.id, editingRole)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingRole(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditRole(role)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteRole(role.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

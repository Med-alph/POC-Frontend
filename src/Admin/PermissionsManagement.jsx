import React, { useState } from "react"
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
import { Plus, Edit, Trash2, Save, X, Shield } from "lucide-react"
import { useToast } from "@/components/ui/toast"

// Mock permissions data
const mockPermissions = [
  { id: 1, name: "appointments:view", description: "View appointments", resource: "appointments", action: "view" },
  { id: 2, name: "appointments:create", description: "Create appointments", resource: "appointments", action: "create" },
  { id: 3, name: "appointments:update", description: "Update appointments", resource: "appointments", action: "update" },
  { id: 4, name: "appointments:delete", description: "Delete appointments", resource: "appointments", action: "delete" },
  { id: 5, name: "patients:view", description: "View patients", resource: "patients", action: "view" },
  { id: 6, name: "patients:create", description: "Create patients", resource: "patients", action: "create" },
  { id: 7, name: "patients:update", description: "Update patients", resource: "patients", action: "update" },
  { id: 8, name: "patients:delete", description: "Delete patients", resource: "patients", action: "delete" },
  { id: 9, name: "staff:view", description: "View staff", resource: "staff", action: "view" },
  { id: 10, name: "staff:create", description: "Create staff", resource: "staff", action: "create" },
  { id: 11, name: "staff:update", description: "Update staff", resource: "staff", action: "update" },
  { id: 12, name: "staff:delete", description: "Delete staff", resource: "staff", action: "delete" },
  { id: 13, name: "hospitals:view", description: "View hospitals", resource: "hospitals", action: "view" },
  { id: 14, name: "hospitals:create", description: "Create hospitals", resource: "hospitals", action: "create" },
  { id: 15, name: "hospitals:update", description: "Update hospitals", resource: "hospitals", action: "update" },
  { id: 16, name: "hospitals:delete", description: "Delete hospitals", resource: "hospitals", action: "delete" },
  { id: 17, name: "transcriptions:view", description: "View transcriptions", resource: "transcriptions", action: "view" },
  { id: 18, name: "transcriptions:create", description: "Create transcriptions", resource: "transcriptions", action: "create" },
  { id: 19, name: "transcriptions:update", description: "Update transcriptions", resource: "transcriptions", action: "update" },
  { id: 20, name: "transcriptions:delete", description: "Delete transcriptions", resource: "transcriptions", action: "delete" },
  { id: 21, name: "reminders:view", description: "View reminders", resource: "reminders", action: "view" },
  { id: 22, name: "reminders:create", description: "Create reminders", resource: "reminders", action: "create" },
  { id: 23, name: "reminders:update", description: "Update reminders", resource: "reminders", action: "update" },
  { id: 24, name: "reminders:delete", description: "Delete reminders", resource: "reminders", action: "delete" },
  { id: 25, name: "audit-logs:view", description: "View audit logs", resource: "audit-logs", action: "view" },
  { id: 26, name: "roles:manage", description: "Manage roles and permissions", resource: "roles", action: "manage" },
  { id: 27, name: "permissions:manage", description: "Manage permissions", resource: "permissions", action: "manage" },
]

const resources = ["appointments", "patients", "staff", "hospitals", "transcriptions", "reminders", "audit-logs", "roles", "permissions"]
const actions = ["view", "create", "update", "delete", "manage"]

export default function PermissionsManagement() {
  const { user } = useSelector((state) => state.auth)
  const [permissions, setPermissions] = useState(mockPermissions)
  const [editingPermission, setEditingPermission] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newPermission, setNewPermission] = useState({ name: "", description: "", resource: "", action: "" })
  const [filter, setFilter] = useState("")
  const { addToast: toast } = useToast()

  // Check if user has super admin permissions
  const isSuperAdmin = user?.permissions?.includes('roles:manage') || user?.role === 'super_admin'

  const filteredPermissions = permissions.filter(permission =>
    permission.name.toLowerCase().includes(filter.toLowerCase()) ||
    permission.description.toLowerCase().includes(filter.toLowerCase()) ||
    permission.resource.toLowerCase().includes(filter.toLowerCase())
  )

  const handleCreatePermission = () => {
    if (!newPermission.name.trim() || !newPermission.resource || !newPermission.action) {
      toast({
        title: "Error",
        description: "All fields are required.",
        variant: "destructive",
      })
      return
    }

    const permission = {
      id: Date.now(),
      ...newPermission,
      name: `${newPermission.resource}:${newPermission.action}`,
      description: newPermission.description.trim()
    }
    
    setPermissions([...permissions, permission])
    setNewPermission({ name: "", description: "", resource: "", action: "" })
    setIsCreating(false)
    
    toast({
      title: "Success",
      description: "Permission created successfully.",
    })
  }

  const handleEditPermission = (permission) => {
    setEditingPermission(permission)
  }

  const handleSavePermission = (permissionId, updatedPermission) => {
    setPermissions(permissions.map(permission => 
      permission.id === permissionId ? { ...permission, ...updatedPermission } : permission
    ))
    setEditingPermission(null)
    
    toast({
      title: "Success",
      description: "Permission updated successfully.",
    })
  }

  const handleDeletePermission = (permissionId) => {
    if (window.confirm("Are you sure you want to delete this permission?")) {
      setPermissions(permissions.filter(permission => permission.id !== permissionId))
      toast({
        title: "Success",
        description: "Permission deleted successfully.",
      })
    }
  }

  const getResourceColor = (resource) => {
    const colors = {
      appointments: "bg-blue-100 text-blue-800",
      patients: "bg-green-100 text-green-800",
      staff: "bg-purple-100 text-purple-800",
      hospitals: "bg-orange-100 text-orange-800",
      transcriptions: "bg-pink-100 text-pink-800",
      reminders: "bg-yellow-100 text-yellow-800",
      "audit-logs": "bg-red-100 text-red-800",
      roles: "bg-indigo-100 text-indigo-800",
      permissions: "bg-gray-100 text-gray-800"
    }
    return colors[resource] || "bg-gray-100 text-gray-800"
  }

  const getActionColor = (action) => {
    const colors = {
      view: "bg-green-100 text-green-800",
      create: "bg-blue-100 text-blue-800",
      update: "bg-yellow-100 text-yellow-800",
      delete: "bg-red-100 text-red-800",
      manage: "bg-purple-100 text-purple-800"
    }
    return colors[action] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Permissions Management</h1>
          <p className="text-gray-600 mt-2">Manage system permissions and access controls</p>
        </div>
        {isSuperAdmin && (
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Permission
          </Button>
        )}
      </div>

      {/* Filter */}
      <div className="mb-6">
        <Input
          placeholder="Search permissions..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Create Permission Form */}
      {isCreating && isSuperAdmin && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Permission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="permissionResource">Resource</Label>
                <select
                  id="permissionResource"
                  value={newPermission.resource}
                  onChange={(e) => setNewPermission({ ...newPermission, resource: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select resource</option>
                  {resources.map(resource => (
                    <option key={resource} value={resource}>{resource}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="permissionAction">Action</Label>
                <select
                  id="permissionAction"
                  value={newPermission.action}
                  onChange={(e) => setNewPermission({ ...newPermission, action: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select action</option>
                  {actions.map(action => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="permissionDescription">Description</Label>
              <Input
                id="permissionDescription"
                value={newPermission.description}
                onChange={(e) => setNewPermission({ ...newPermission, description: e.target.value })}
                placeholder="Enter permission description"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={handleCreatePermission} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                Create Permission
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreating(false)
                  setNewPermission({ name: "", description: "", resource: "", action: "" })
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            System Permissions ({filteredPermissions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Permission Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Action</TableHead>
                {isSuperAdmin && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPermissions.map((permission) => (
                <TableRow key={permission.id}>
                  <TableCell className="font-medium">
                    {editingPermission?.id === permission.id ? (
                      <Input
                        value={editingPermission.name}
                        onChange={(e) => setEditingPermission({ ...editingPermission, name: e.target.value })}
                        className="w-full"
                      />
                    ) : (
                      permission.name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingPermission?.id === permission.id ? (
                      <Input
                        value={editingPermission.description}
                        onChange={(e) => setEditingPermission({ ...editingPermission, description: e.target.value })}
                        className="w-full"
                      />
                    ) : (
                      permission.description
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getResourceColor(permission.resource)}>
                      {permission.resource}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getActionColor(permission.action)}>
                      {permission.action}
                    </Badge>
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell>
                      {editingPermission?.id === permission.id ? (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleSavePermission(permission.id, editingPermission)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingPermission(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditPermission(permission)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeletePermission(permission.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

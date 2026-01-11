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
import { Plus, Edit, Trash2, Save, X, Users } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { rbacAPI } from "../api/rbacapi"
import { UI_MODULES, UI_MODULE_LABELS, PLAN_FEATURE_TO_MODULES } from "../constants/Constant"

// Available modules for role assignment
const availableModules = Object.values(UI_MODULES)
const availableFeatures = Object.keys(PLAN_FEATURE_TO_MODULES)

export default function RolesManagement() {
  const { user } = useSelector((state) => state.auth)
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingRole, setEditingRole] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newRole, setNewRole] = useState({ name: "", description: "", feature_ids: [] })
  const [staffCounts, setStaffCounts] = useState({})
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
      return
    }
    
    fetchRoles()
    fetchStaffCounts()
  }, [isSuperAdmin, toast])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await rbacAPI.getRoles()
      console.log('Roles API response:', response)
      setRoles(response.data || response || [])
    } catch (error) {
      console.error('Error fetching roles:', error)
      toast({
        title: "Error",
        description: "Failed to fetch roles.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStaffCounts = async () => {
    try {
      const response = await rbacAPI.getStaff()
      const staff = response.data || response || []
      
      // Count staff by role
      const counts = {}
      staff.forEach(member => {
        if (member.role_id) {
          counts[member.role_id] = (counts[member.role_id] || 0) + 1
        }
      })
      setStaffCounts(counts)
    } catch (error) {
      console.error('Error fetching staff counts:', error)
    }
  }

  const handleCreateRole = async () => {
    if (!newRole.name.trim()) {
      toast({
        title: "Error",
        description: "Role name is required.",
        variant: "destructive",
      })
      return
    }

    try {
      const roleData = {
        name: newRole.name.trim(),
        description: newRole.description.trim() || null,
        feature_ids: newRole.feature_ids
      }
      
      const response = await rbacAPI.createRole(roleData)
      console.log('Create role response:', response)
      
      // Add the new role to the list
      setRoles([...roles, response])
      setNewRole({ name: "", description: "", feature_ids: [] })
      setIsCreating(false)
      
      toast({
        title: "Success",
        description: "Role created successfully.",
      })
    } catch (error) {
      console.error('Error creating role:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to create role.",
        variant: "destructive",
      })
    }
  }

  const handleEditRole = (role) => {
    setEditingRole({
      ...role,
      feature_ids: role.feature_ids || []
    })
  }

  const handleSaveRole = async (roleId, updatedRole) => {
    try {
      const roleData = {
        name: updatedRole.name.trim(),
        description: updatedRole.description?.trim() || null,
        feature_ids: updatedRole.feature_ids || []
      }
      
      const response = await rbacAPI.updateRole(roleId, roleData)
      console.log('Update role response:', response)
      
      // Update the role in the list
      setRoles(roles.map(role => 
        role.id === roleId ? { ...role, ...response } : role
      ))
      setEditingRole(null)
      
      toast({
        title: "Success",
        description: "Role updated successfully.",
      })
    } catch (error) {
      console.error('Error updating role:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update role.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteRole = async (roleId) => {
    if (window.confirm("Are you sure you want to delete this role?")) {
      try {
        await rbacAPI.deleteRole(roleId)
        setRoles(roles.filter(role => role.id !== roleId))
        toast({
          title: "Success",
          description: "Role deleted successfully.",
        })
      } catch (error) {
        console.error('Error deleting role:', error)
        toast({
          title: "Error",
          description: error.message || "Failed to delete role.",
          variant: "destructive",
        })
      }
    }
  }

  const toggleFeature = (feature, roleFeatures) => {
    if (roleFeatures.includes(feature)) {
      return roleFeatures.filter(f => f !== feature)
    } else {
      return [...roleFeatures, feature]
    }
  }

  const getModulesForFeatures = (featureIds) => {
    const modules = new Set()
    featureIds.forEach(featureId => {
      const featureModules = PLAN_FEATURE_TO_MODULES[featureId] || []
      featureModules.forEach(module => modules.add(module))
    })
    return Array.from(modules)
  }

  const getFeatureLabel = (featureId) => {
    return featureId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-gray-600">Loading roles...</p>
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
              <Label>Features & Modules</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {availableFeatures.map(feature => (
                  <div key={feature} className="border rounded-lg p-3">
                    <label className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        checked={newRole.feature_ids.includes(feature)}
                        onChange={() => setNewRole({
                          ...newRole,
                          feature_ids: toggleFeature(feature, newRole.feature_ids)
                        })}
                        className="rounded"
                      />
                      <span className="font-medium text-sm">{getFeatureLabel(feature)}</span>
                    </label>
                    <div className="ml-6 text-xs text-gray-600">
                      <p className="mb-1">Includes modules:</p>
                      <div className="flex flex-wrap gap-1">
                        {(PLAN_FEATURE_TO_MODULES[feature] || []).map(module => (
                          <Badge key={module} variant="outline" className="text-xs">
                            {UI_MODULE_LABELS[module] || module}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
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
                  setNewRole({ name: "", description: "", feature_ids: [] })
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
                <TableHead>Features & Modules</TableHead>
                <TableHead>Staff Count</TableHead>
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
                        value={editingRole.description || ''}
                        onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                        className="w-full"
                        placeholder="Enter description"
                      />
                    ) : (
                      role.description || 'No description'
                    )}
                  </TableCell>
                  <TableCell>
                    {editingRole?.id === role.id ? (
                      <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                        {availableFeatures.map(feature => (
                          <div key={feature} className="border rounded p-2">
                            <label className="flex items-center space-x-2 mb-1">
                              <input
                                type="checkbox"
                                checked={editingRole.feature_ids.includes(feature)}
                                onChange={() => setEditingRole({
                                  ...editingRole,
                                  feature_ids: toggleFeature(feature, editingRole.feature_ids)
                                })}
                                className="rounded"
                              />
                              <span className="text-xs font-medium">{getFeatureLabel(feature)}</span>
                            </label>
                            <div className="ml-6 flex flex-wrap gap-1">
                              {(PLAN_FEATURE_TO_MODULES[feature] || []).map(module => (
                                <Badge key={module} variant="outline" className="text-xs">
                                  {UI_MODULE_LABELS[module] || module}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Show Features */}
                        <div className="flex flex-wrap gap-1">
                          {(role.feature_ids || []).slice(0, 2).map(feature => (
                            <Badge key={feature} variant="secondary" className="text-xs">
                              {getFeatureLabel(feature)}
                            </Badge>
                          ))}
                          {(role.feature_ids || []).length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{(role.feature_ids || []).length - 2} more
                            </Badge>
                          )}
                        </div>
                        {/* Show Modules */}
                        <div className="flex flex-wrap gap-1">
                          {getModulesForFeatures(role.feature_ids || []).slice(0, 3).map(module => (
                            <Badge key={module} variant="outline" className="text-xs">
                              {UI_MODULE_LABELS[module] || module}
                            </Badge>
                          ))}
                          {getModulesForFeatures(role.feature_ids || []).length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{getModulesForFeatures(role.feature_ids || []).length - 3} modules
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{staffCounts[role.id] || 0}</span>
                    </div>
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

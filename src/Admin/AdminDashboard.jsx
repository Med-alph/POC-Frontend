import React from "react"
import { useSelector, useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  Users,
  Settings,
  BarChart3,
  UserCheck,
  Key,
  ArrowLeft,
  LogOut
} from "lucide-react"
import { useToast } from "@/components/ui/toast"

import { useAuth } from "../contexts/AuthContext";

export default function AdminDashboard() {
  const { user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { addToast: toast } = useToast()
  const { logout } = useAuth();

  const isSuperAdmin = user?.permissions?.includes('roles:manage') || user?.role === 'super_admin'
  const isAdmin = user?.permissions?.includes('staff:assign_roles') || user?.role === 'admin'

  const handleLogout = async () => {
    // Clear auth state via central logout (SOC 2 compliant)
    await logout(true);
    navigate('/admin/login')
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    })
  }

  const adminCards = [
    {
      title: "Staff Management",
      description: "Assign roles to staff members",
      icon: <Users className="w-8 h-8" />,
      path: "/admin/staffs",
      color: "bg-blue-100 text-blue-600",
      available: isAdmin || isSuperAdmin
    },
    {
      title: "Roles Management",
      description: "Create and manage system roles",
      icon: <Shield className="w-8 h-8" />,
      path: "/admin/roles",
      color: "bg-purple-100 text-purple-600",
      available: isSuperAdmin
    },
    {
      title: "Permissions Management",
      description: "Manage system permissions",
      icon: <Key className="w-8 h-8" />,
      path: "/admin/permissions",
      color: "bg-green-100 text-green-600",
      available: isSuperAdmin
    },
    {
      title: "System Analytics",
      description: "View system usage and statistics",
      icon: <BarChart3 className="w-8 h-8" />,
      path: "/admin/analytics",
      color: "bg-orange-100 text-orange-600",
      available: isAdmin || isSuperAdmin
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to App</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className={isSuperAdmin ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}>
                {isSuperAdmin ? "Super Admin" : "Admin"}
              </Badge>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Staff</p>
                  <p className="text-2xl font-bold text-gray-900">24</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Roles</p>
                  <p className="text-2xl font-bold text-gray-900">4</p>
                </div>
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Permissions</p>
                  <p className="text-2xl font-bold text-gray-900">27</p>
                </div>
                <Key className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Admin Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {adminCards.map((card, index) => (
              <Card
                key={index}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${!card.available ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                  }`}
                onClick={() => card.available ? navigate(card.path) : null}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${card.color}`}>
                      {card.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{card.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{card.description}</p>
                      {!card.available && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          Requires Super Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Role assigned to Dr. Sarah Johnson</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New permission created: appointments:view</p>
                  <p className="text-xs text-gray-500">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Staff member John Doe role updated</p>
                  <p className="text-xs text-gray-500">3 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

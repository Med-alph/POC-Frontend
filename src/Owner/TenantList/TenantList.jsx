import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Info, Edit2 } from "lucide-react"
import AddHospitalDialog from "./AddHospital"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import toast from "react-hot-toast"

export default function TenantListPage() {
    const [tenants, setTenants] = useState([
        {
            id: "HSP001",
            name: "Auckland Medical Centre",
            type: "Hospital",
            email: "info@amc.co.nz",
            phone: "+64 21 123 4567",
            planType: "Pro",
            status: "Active",
            city: "Auckland",
            timezone: "Pacific/Auckland",
            address: "123 Queen St, Auckland, NZ",
            superAdminName: "Dr. John Smith",
            superAdminEmail: "admin@amc.co.nz"
        },
        {
            id: "CLN002",
            name: "Christchurch Diagnostics",
            type: "Clinic",
            email: "contact@chcdiag.co.nz",
            phone: "+64 22 987 6543",
            planType: "Basic",
            status: "Active",
            city: "Christchurch",
            timezone: "Pacific/Auckland",
            address: "456 Colombo St, Christchurch, NZ",
            superAdminName: "Sarah Lee",
            superAdminEmail: "admin@chcdiag.co.nz"
        }
    ])

    const [selectedTenant, setSelectedTenant] = useState(null)
    const [infoOpen, setInfoOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)

    const handleAddTenant = (newTenant) => {
        setTenants((prev) => [...prev, newTenant])
        toast.success(`Tenant "${newTenant.name}" added successfully!`)
    }

    const handleEditTenant = (updatedTenant) => {
        setTenants((prev) =>
            prev.map((t) => (t.id === updatedTenant.id ? updatedTenant : t))
        )
        toast.success(`Tenant "${updatedTenant.name}" updated successfully!`)
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold"> Tenant Management</h1>
                <AddHospitalDialog onAdd={handleAddTenant}>
                    <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                        <PlusCircle size={18} /> Add Tenant
                    </Button>
                </AddHospitalDialog>
            </div>

            {/* Table */}
            <Card className="shadow-sm border border-gray-200">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-100">
                                <TableHead>ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>City</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tenants.map((tenant) => (
                                <TableRow key={tenant.id}>
                                    <TableCell>{tenant.id}</TableCell>
                                    <TableCell className="font-medium">{tenant.name}</TableCell>
                                    <TableCell>{tenant.type}</TableCell>
                                    <TableCell>{tenant.email}</TableCell>
                                    <TableCell>{tenant.phone}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{tenant.planType}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            className={
                                                tenant.status === "Active"
                                                    ? "bg-green-500 text-white"
                                                    : "bg-gray-400 text-white"
                                            }
                                        >
                                            {tenant.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{tenant.city}</TableCell>
                                    <TableCell className="flex gap-3">
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            onClick={() => {
                                                setSelectedTenant(tenant)
                                                setInfoOpen(true)
                                            }}
                                        >
                                            <Info size={16} />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            onClick={() => {
                                                setSelectedTenant(tenant)
                                                setEditOpen(true)
                                            }}
                                        >
                                            <Edit2 size={16} />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Info Dialog */}
            {/* Info Dialog */}
            <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
                <DialogContent className="max-w-[700px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Tenant Details</DialogTitle>
                    </DialogHeader>
                    {selectedTenant && (
                        <div className="space-y-4 text-sm">
                            {/* Basic Info */}
                            <div>
                                <h3 className="font-semibold text-lg">Basic Info</h3>
                                <p><strong>Name:</strong> {selectedTenant.name}</p>
                                <p><strong>Legal Name:</strong> {selectedTenant.legalName}</p>
                                <p><strong>Type:</strong> {selectedTenant.type}</p>
                                <p><strong>Hospital ID:</strong> {selectedTenant.hospitalId}</p>
                            </div>

                            {/* Contact Info */}
                            <div>
                                <h3 className="font-semibold text-lg">Contact Info</h3>
                                <p><strong>Email:</strong> {selectedTenant.email}</p>
                                <p><strong>Phone:</strong> {selectedTenant.phone}</p>
                                <p><strong>Website:</strong> {selectedTenant.website}</p>
                                <p><strong>Address:</strong> {selectedTenant.address}</p>
                            </div>

                            {/* Branding */}
                            <div>
                                <h3 className="font-semibold text-lg">Branding</h3>
                                <p><strong>Logo:</strong> {selectedTenant.logo}</p>
                                <p><strong>Theme Color / Subdomain:</strong> {selectedTenant.themeColor}</p>
                            </div>

                            {/* Operational Info */}
                            <div>
                                <h3 className="font-semibold text-lg">Operational Info</h3>
                                <p><strong>Timezone:</strong> {selectedTenant.timezone}</p>
                                <p><strong>Working Hours:</strong> {selectedTenant.workingHours}</p>
                                <p><strong>Departments / Specialties:</strong> {selectedTenant.departments}</p>
                            </div>

                            {/* Subscription & Plan */}
                            <div>
                                <h3 className="font-semibold text-lg">Subscription & Plan</h3>
                                <p><strong>Plan Type:</strong> {selectedTenant.planType}</p>
                                <p><strong>Plan Start:</strong> {selectedTenant.planStart}</p>
                                <p><strong>Plan End:</strong> {selectedTenant.planEnd}</p>
                                <p><strong>Allowed Users / Doctors:</strong> {selectedTenant.allowedUsers}</p>
                                <p><strong>Billing Contact:</strong> {selectedTenant.billingContact}</p>
                            </div>

                            {/* Regulatory Info */}
                            <div>
                                <h3 className="font-semibold text-lg">Regulatory Info</h3>
                                <p><strong>Registration / License No.:</strong> {selectedTenant.licenseNo}</p>
                                <p><strong>Tax ID / GST / VAT No.:</strong> {selectedTenant.taxId}</p>
                                <p><strong>Country-specific Healthcare ID:</strong> {selectedTenant.healthcareId}</p>
                            </div>

                            {/* Super Admin Info */}
                            <div>
                                <h3 className="font-semibold text-lg">Super Admin Info</h3>
                                <p><strong>Name:</strong> {selectedTenant.superAdminName}</p>
                                <p><strong>Email:</strong> {selectedTenant.superAdminEmail}</p>
                                <p><strong>Phone:</strong> {selectedTenant.superAdminPhone}</p>
                            </div>

                            {/* System Setup */}
                            <div>
                                <h3 className="font-semibold text-lg">System Setup</h3>
                                <p><strong>Currency:</strong> {selectedTenant.currency}</p>
                                <p><strong>Preferred Languages:</strong> {selectedTenant.languages}</p>
                                <p><strong>Notification Channels:</strong> {selectedTenant.notificationChannels}</p>
                            </div>

                            {/* Integrations */}
                            <div>
                                <h3 className="font-semibold text-lg">Integrations & Branch</h3>
                                <p><strong>Integration Keys:</strong> {selectedTenant.integrationKeys}</p>
                                <p><strong>Branch Type:</strong> {selectedTenant.branchType}</p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>


            {/* Edit Dialog (reuse AddHospitalDialog for edit) */}
            {editOpen && selectedTenant && (
                <AddHospitalDialog
                    onAdd={handleEditTenant}
                    editMode
                    tenantData={selectedTenant}
                    open={editOpen}
                    setOpen={setEditOpen}
                />
            )}
        </div>
    )
}

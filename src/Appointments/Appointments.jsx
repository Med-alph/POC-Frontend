import React from "react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, Calendar, Plus, Filter } from "lucide-react"
import Navbar from "../Dashboard/Navbar"

export default function Appointments() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Navbar */}
            <Navbar />

            {/* Main content */}
            <main className="flex-1 px-4 sm:px-6 md:px-10 lg:px-20 py-6">
                {/* Header Row */}
                <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                    <div>
                        <h1 className="text-lg sm:text-2xl font-bold">Appointments</h1>
                        <p className="text-gray-600 mt-1 text-xs sm:text-base">
                            Manage and view all Appointments information
                        </p>
                    </div>

                    <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add New Appointment
                    </Button>
                </div>

                {/* Filters container */}
                <div className="bg-white shadow rounded-lg pt-6 sm:pt-8 pb-4 px-4 sm:px-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
                    {/* Left side: Search + Dropdowns */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 w-full md:w-auto flex-wrap">
                        {/* Search */}
                        <div className="relative w-full sm:w-64 md:w-80 lg:w-96">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                            <Input
                                type="text"
                                placeholder="Search Appointments..."
                                className="pl-9"
                            />
                        </div>

                        {/* Insurance Type Dropdown */}
                        <Select className="w-full sm:w-40 md:w-40 lg:w-48">
                            <SelectTrigger className="flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                                <SelectValue placeholder="All insurance type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All insurance type</SelectItem>
                                <SelectItem value="private">Private</SelectItem>
                                <SelectItem value="public">Public</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Appointments Dropdown */}
                        <Select className="w-full sm:w-40 md:w-40 lg:w-48">
                            <SelectTrigger className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                <SelectValue placeholder="All appointments" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All appointments</SelectItem>
                                <SelectItem value="upcoming">Upcoming</SelectItem>
                                <SelectItem value="past">Past</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Right side: Filter + Count */}
                    <div className="flex items-center gap-2 text-gray-600 text-sm whitespace-nowrap mt-2 md:mt-0">
                        <Filter className="h-4 w-4" />
                        <span>8 of 8 Appointments</span>
                    </div>
                </div>

                {/* Table Section */}
                <div className="mt-6 bg-white shadow rounded-lg p-4 sm:p-5 overflow-x-auto">
                    <Table className="min-w-[700px] md:min-w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Patient Name</TableHead>
                                <TableHead>DOB / Age</TableHead>
                                <TableHead>Phone Number</TableHead>
                                <TableHead>Insurance Provider</TableHead>
                                <TableHead>Last Appointment</TableHead>
                                <TableHead>Upcoming Appointment</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[1, 2].map((i) => (
                                <TableRow key={i}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>JD</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">John Doe</p>
                                                <p className="text-xs text-gray-500">ID: 6054</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>Apr 24, 1975</span>
                                            <span className="text-xs text-gray-500">50 years old</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path d="M3 5a2 2 0 012-2h3l2 5-2 2c1 3 3 5 6 6l2-2 5 2v3a2 2 0 01-2 2h-1C9.163 21 3 14.837 3 7V5z" />
                                            </svg>
                                            <span>(555) 123-4567</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className="bg-blue-100 text-blue-600">Blue Cross Blue Shield</Badge>
                                    </TableCell>
                                    <TableCell>Jan 12, 2024</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>Feb 3, 2024</span>
                                            <span className="text-xs text-gray-500">566 days ago</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-blue-600 cursor-pointer">
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                            <span className="text-sm">View</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {/* Filter Container (again) */}
                    <div className="mt-6 bg-white shadow rounded-lg pt-6 sm:pt-8 pb-4 px-4 sm:px-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
                        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 w-full md:w-auto flex-wrap">
                            <div className="relative w-full sm:w-64 md:w-80 lg:w-96">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                                <Input
                                    type="text"
                                    placeholder="Search Appointments..."
                                    className="pl-9"
                                />
                            </div>
                            <Select className="w-full sm:w-40 md:w-40 lg:w-48">
                                <SelectTrigger className="flex items-center">
                                    <FileText className="h-4 w-4 mr-2 text-gray-500" />
                                    <SelectValue placeholder="All insurance type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All insurance type</SelectItem>
                                    <SelectItem value="private">Private</SelectItem>
                                    <SelectItem value="public">Public</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select className="w-full sm:w-40 md:w-40 lg:w-48">
                                <SelectTrigger className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                    <SelectValue placeholder="All appointments" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All appointments</SelectItem>
                                    <SelectItem value="upcoming">Upcoming</SelectItem>
                                    <SelectItem value="past">Past</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 text-sm whitespace-nowrap mt-2 md:mt-0">
                            <Filter className="h-4 w-4" />
                            <span>8 of 8 Appointments</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

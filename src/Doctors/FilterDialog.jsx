import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Filter, X } from "lucide-react";

export default function FilterDialog({ 
    open, 
    onOpenChange, 
    filters, 
    onApplyFilters,
    onReset 
}) {
    const [localFilters, setLocalFilters] = useState({
        searchTerm: "",
        departmentFilter: "all",
        statusFilter: "all",
        experienceFilter: "all",
        sortBy: "name",
        sortOrder: "asc"
    });

    useEffect(() => {
        if (open && filters) {
            setLocalFilters(filters);
        }
    }, [open, filters]);

    const handleFilterChange = (key, value) => {
        setLocalFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleApply = () => {
        onApplyFilters(localFilters);
        onOpenChange(false);
    };

    const handleReset = () => {
        const resetFilters = {
            searchTerm: "",
            departmentFilter: "all",
            statusFilter: "all",
            experienceFilter: "all",
            sortBy: "name",
            sortOrder: "asc"
        };
        setLocalFilters(resetFilters);
        onReset(resetFilters);
        onOpenChange(false);
    };

    const activeFiltersCount = [
        localFilters.searchTerm,
        localFilters.departmentFilter !== "all",
        localFilters.statusFilter !== "all",
        localFilters.experienceFilter !== "all",
        localFilters.sortBy !== "name",
        localFilters.sortOrder !== "asc"
    ].filter(Boolean).length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filter & Sort Doctors
                        {activeFiltersCount > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                                {activeFiltersCount} active
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                    {/* Search */}
                    <div className="space-y-2">
                        <Label>Search</Label>
                        <Input
                            placeholder="Search by name, department, contact, email..."
                            value={localFilters.searchTerm}
                            onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
                        />
                    </div>

                    {/* Filters Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Department Filter */}
                        <div className="space-y-2">
                            <Label>Department</Label>
                            <Select
                                value={localFilters.departmentFilter}
                                onValueChange={(value) => handleFilterChange("departmentFilter", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Departments" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    <SelectItem value="Cardiology">Cardiology</SelectItem>
                                    <SelectItem value="Neurology">Neurology</SelectItem>
                                    <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                                    <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                                    <SelectItem value="Dermatology">Dermatology</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status Filter */}
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={localFilters.statusFilter}
                                onValueChange={(value) => handleFilterChange("statusFilter", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Experience Filter */}
                        <div className="space-y-2">
                            <Label>Experience</Label>
                            <Select
                                value={localFilters.experienceFilter}
                                onValueChange={(value) => handleFilterChange("experienceFilter", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Experience" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Experience</SelectItem>
                                    <SelectItem value="0-5">0-5 years</SelectItem>
                                    <SelectItem value="6-10">6-10 years</SelectItem>
                                    <SelectItem value="11-15">11-15 years</SelectItem>
                                    <SelectItem value="15+">15+ years</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Sort By */}
                        <div className="space-y-2">
                            <Label>Sort By</Label>
                            <Select
                                value={localFilters.sortBy}
                                onValueChange={(value) => handleFilterChange("sortBy", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="name">Name</SelectItem>
                                    <SelectItem value="experience">Experience</SelectItem>
                                    <SelectItem value="department">Department</SelectItem>
                                    <SelectItem value="status">Status</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Sort Order */}
                    <div className="space-y-2">
                        <Label>Sort Order</Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={localFilters.sortOrder === "asc" ? "default" : "outline"}
                                onClick={() => handleFilterChange("sortOrder", "asc")}
                                className="flex-1"
                            >
                                Ascending ↑
                            </Button>
                            <Button
                                type="button"
                                variant={localFilters.sortOrder === "desc" ? "default" : "outline"}
                                onClick={() => handleFilterChange("sortOrder", "desc")}
                                className="flex-1"
                            >
                                Descending ↓
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between gap-2 pt-4 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleReset}
                        className="flex items-center gap-2"
                    >
                        <X className="h-4 w-4" />
                        Reset All
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleApply}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Apply Filters
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}



import { Input } from "@/components/ui/input"
import { Bell, ChevronDown, Search } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNavigate, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"

export default function Navbar() {
    const navigate = useNavigate()
    const location = useLocation()
    const [activeTab, setActiveTab] = useState("")

    // Update active tab when route changes
    useEffect(() => {
        if (location.pathname === "/patients") {
            setActiveTab("patients")
        } else if (location.pathname === "/doctors") {
            setActiveTab("doctors")
        } else if (location.pathname === "/appointments") {
            setActiveTab("appointments")
        } else if (location.pathname === "/reminders") {
            setActiveTab("reminders")
        } else {
            setActiveTab("") // dashboard or others - empty string instead of undefined
        }
    }, [location.pathname])

    const handleTabClick = (value, path) => {
        navigate(path)
    }

    return (
        <div className="w-full shadow-sm bg-white">
            {/* Top navbar */}
            <nav className="w-full flex items-center justify-between px-4 md:px-6 py-3 shadow-sm bg-white border-b border-gray-200">
                {/* Left side - Logo */}
                <div onClick={() => navigate("/dashboard")} style={{ cursor: "pointer" }} className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm md:text-base">
                        c360
                    </div>
                    <span className="text-sm md:text-xl font-semibold">Clinic360</span>
                </div>

                {/* Right side */}
                <div className="flex items-center space-x-2 md:space-x-4">
                    {/* Search with icon */}
                    <div className="relative w-32 sm:w-64">
                        <Search className="absolute left-2 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                        <Input
                            type="text"
                            placeholder="Search patients, doctors..."
                            className="pl-8 sm:pl-9 py-1 sm:py-2 text-sm sm:text-base"
                        />
                    </div>

                    {/* Notification Icon */}
                    <button className="relative">
                        <Bell className="h-5 w-5 text-gray-600" />
                        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></span>
                    </button>

                    {/* Profile with dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className="flex items-center space-x-1 sm:space-x-2 cursor-pointer">
                                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                                    V
                                </div>
                                <ChevronDown className="h-4 w-4 text-gray-600" />
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate("/")}>
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </nav>

            {/* Tabs row */}
            <div className="border-t overflow-x-auto">
                <Tabs value={activeTab} className="px-4 md:px-6">
                    <TabsList className="flex space-x-4 sm:space-x-6 bg-transparent h-12 p-0 min-w-max">
                        <TabsTrigger
                            value="patients"
                            onClick={() => handleTabClick("patients", "/patients")}
                            className="cursor-pointer rounded-none border-b-2 border-transparent 
                                data-[state=active]:border-blue-500 data-[state=active]:text-blue-600"
                        >
                            Patients
                        </TabsTrigger>
                        <TabsTrigger
                            value="doctors"
                            onClick={() => handleTabClick("doctors", "/doctors")}
                            className="cursor-pointer rounded-none border-b-2 border-transparent 
                                data-[state=active]:border-blue-500 data-[state=active]:text-blue-600"
                        >
                            Doctors
                        </TabsTrigger>
                        <TabsTrigger
                            value="appointments"
                            onClick={() => handleTabClick("appointments", "/appointments")}
                            className="cursor-pointer rounded-none border-b-2 border-transparent 
                                data-[state=active]:border-blue-500 data-[state=active]:text-blue-600"
                        >
                            Appointments
                        </TabsTrigger>
                        <TabsTrigger
                            value="reminders"
                            onClick={() => handleTabClick("reminders", "/reminders")}
                            className="cursor-pointer rounded-none border-b-2 border-transparent 
                                data-[state=active]:border-blue-500 data-[state=active]:text-blue-600"
                        >
                            Reminders
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
        </div>
    )
}
import React from "react"
import { ChevronRight, Home } from "lucide-react"
import { useNavigate } from "react-router-dom"

export function Breadcrumb({ items }) {
  const navigate = useNavigate()

  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-500 mb-4">
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center hover:text-blue-600 transition-colors"
      >
        <Home className="h-4 w-4 mr-1" />
        Dashboard
      </button>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          {item.href ? (
            <button
              onClick={() => navigate(item.href)}
              className="hover:text-blue-600 transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

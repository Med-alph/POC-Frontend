# Dashboard API Implementation Specification

## Overview

This document outlines the Dashboard API endpoints that need to be implemented on the backend to support the updated frontend dashboard. The APIs are role-aware, hospital-scoped, and include comprehensive date range filtering.

## API Endpoints

### Base URL
All dashboard endpoints should be prefixed with `/api/dashboard`

### Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Endpoint Specifications

### 1. GET `/api/dashboard/stats`

**Purpose**: Get overview statistics for the dashboard

**Query Parameters**:
- `startDate` (optional) - Filter from date (ISO format)
- `endDate` (optional) - Filter to date (ISO format)  
- `period` (optional) - 'today' | 'week' | 'month' | 'year'

**Response Structure**:
```json
{
  "patients": {
    "total": 1250,
    "active": 1100,
    "new": 45,
    "archived": 105
  },
  "appointments": {
    "total": 3200,
    "today": 24,
    "upcoming": 156,
    "completed": 2800,
    "cancelled": 220,
    "byStatus": {
      "booked": 156,
      "fulfilled": 2800,
      "cancelled": 220,
      "noshow": 24
    }
  },
  "staff": {
    "total": 85,
    "active": 78,
    "departments": {
      "Cardiology": 12,
      "Neurology": 8,
      "Pediatrics": 15,
      "Orthopedics": 10,
      "General Medicine": 20,
      "Emergency": 13
    }
  }
}
```

### 2. GET `/api/dashboard/appointments/recent`

**Purpose**: Get recent and upcoming appointments

**Query Parameters**:
- `limit` (default: 10) - Number of appointments to return
- `status` (optional) - Filter by appointment status
- `staffId` (optional) - For staff to see their own appointments

**Response Structure**:
```json
[
  {
    "id": "apt_123",
    "appointment_date": "2024-01-15T09:00:00Z",
    "status": "booked",
    "patient": {
      "id": "pat_456",
      "name": "John Doe",
      "phone": "+1234567890"
    },
    "staff": {
      "id": "staff_789",
      "name": "Dr. Smith",
      "department": "Cardiology"
    }
  }
]
```

### 3. GET `/api/dashboard/appointments/today`

**Purpose**: Get today's appointments schedule

**Response**: Array of appointments for current day with full details

### 4. GET `/api/dashboard/activities`

**Purpose**: Get recent activity logs (Admin only)

**Query Parameters**:
- `limit` (default: 20) - Number of activities to return
- `startDate` (optional) - Filter from date
- `endDate` (optional) - Filter to date

**Response Structure**:
```json
[
  {
    "id": "act_123",
    "description": "New patient John Doe registered",
    "type": "patient_registration",
    "user": {
      "id": "user_456",
      "name": "Dr. Smith"
    },
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

### 5. GET `/api/dashboard/trends`

**Purpose**: Get appointment trends over time

**Query Parameters**:
- `period` - 'week' | 'month' | 'year'
- `metric` - 'appointments' | 'patients'

**Response Structure**:
```json
{
  "labels": ["2024-01-08", "2024-01-09", "2024-01-10", "2024-01-11", "2024-01-12", "2024-01-13", "2024-01-14"],
  "data": [12, 19, 14, 18, 20, 17, 22],
  "period": "week",
  "metric": "patients"
}
```

### 6. GET `/api/dashboard/staff-performance`

**Purpose**: Get staff appointment statistics (Admin only)

**Query Parameters**:
- `startDate` (optional) - Filter from date
- `endDate` (optional) - Filter to date

**Response Structure**:
```json
[
  {
    "staff": {
      "id": "staff_123",
      "name": "Dr. Smith",
      "department": "Cardiology"
    },
    "appointments": {
      "total": 45,
      "completed": 42,
      "cancelled": 3,
      "completionRate": 93.3
    }
  }
]
```

## Implementation Notes

### Hospital Scoping
- All queries should be automatically scoped to the user's `hospital_id` from JWT token
- Staff users should only see data from their assigned hospital
- Admin users can see data from all hospitals they have access to

### Role-Based Access
- **Admin**: Access to all dashboard endpoints
- **Staff**: Limited to their own appointments and general stats (no staff performance or activities)

### Date Filtering Logic
- **Today**: Current day (00:00 to 23:59)
- **Week**: Last 7 days
- **Month**: Last 30 days  
- **Year**: Last 365 days
- **Custom**: User-specified startDate/endDate range

### Error Responses
All endpoints should return standard HTTP status codes:
- `200`: Success
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `500`: Server error

Error response format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional error details"
}
```

## Database Considerations

### Recommended Indexes
- `appointments.hospital_id` + `appointment_date`
- `patients.hospital_id` + `created_at`
- `staff.hospital_id` + `status`
- `activities.hospital_id` + `created_at`

### Query Optimization
- Use TypeORM query builder with proper joins
- Implement pagination for large datasets
- Cache frequently accessed statistics
- Use database views for complex aggregations

## Frontend Integration

The frontend is already updated to consume these APIs. The Dashboard component includes:

- Real-time data fetching with loading states
- Error handling with fallback to demo data
- Refresh functionality
- Responsive design with smooth animations
- Role-based data display

### API Usage Example
```javascript
// Fetch dashboard stats
const stats = await dashboardAPI.getStats({ period: 'week' });

// Get today's appointments  
const todayAppointments = await dashboardAPI.getTodayAppointments();

// Get trends data
const trends = await dashboardAPI.getTrends({ 
  period: 'month', 
  metric: 'appointments' 
});
```

## Testing

### Test Cases
1. **Authentication**: Verify JWT token validation
2. **Authorization**: Test role-based access control
3. **Hospital Scoping**: Ensure data isolation between hospitals
4. **Date Filtering**: Test all period options and custom ranges
5. **Performance**: Load testing with large datasets
6. **Error Handling**: Test various error scenarios

### Sample Test Data
Create test data for:
- Multiple hospitals with different staff and patients
- Various appointment statuses and dates
- Activity logs for different user actions
- Staff performance metrics

## Deployment Notes

- Ensure all database migrations are run
- Configure proper CORS settings for frontend integration
- Set up monitoring for API performance
- Implement rate limiting for dashboard endpoints
- Configure caching strategies for static data

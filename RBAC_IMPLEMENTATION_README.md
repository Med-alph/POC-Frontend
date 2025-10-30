# RBAC System Implementation

This document describes the complete Role-Based Access Control (RBAC) system implementation for the MedAssist application.

## 🎯 Overview

The RBAC system provides:
- **Role Management**: Create, edit, delete roles with specific permissions
- **Permission Management**: Granular control over system resources and actions
- **Staff Role Assignment**: Assign roles to staff members
- **Access Control**: Route and component-level permission checks
- **Admin Interface**: Complete admin panel for RBAC management

## 🏗️ Architecture

### Frontend Components
- **Admin Login** (`/admin/login`) - Secure admin authentication
- **Admin Dashboard** (`/admin/dashboard`) - Main admin interface
- **Roles Management** (`/admin/roles`) - CRUD operations for roles
- **Permissions Management** (`/admin/permissions`) - Manage system permissions
- **Staff Role Assignment** (`/admin/staffs`) - Assign roles to staff

### Backend Implementation
- **Entities**: Role, Permission, RolePermission, StaffRole
- **Guards**: PermissionsGuard for route protection
- **Decorators**: @RequirePermissions, @RequireRoles, @GetUser
- **Services**: RolesService, PermissionsService
- **Controllers**: RolesController, PermissionsController

## 🔐 Permission System

### Resources
- `appointments` - Appointment management
- `patients` - Patient records
- `staff` - Staff management
- `hospitals` - Hospital/tenant management
- `transcriptions` - Medical transcriptions
- `reminders` - System reminders
- `audit-logs` - System audit logs
- `roles` - Role management
- `permissions` - Permission management

### Actions
- `view` - Read access
- `create` - Create new records
- `update` - Modify existing records
- `delete` - Remove records
- `manage` - Full administrative access
- `assign_roles` - Assign roles to staff

### Default Roles

#### Super Admin
- **Permissions**: All permissions including `roles:manage` and `permissions:manage`
- **Access**: Full system control, can manage roles and permissions
- **Redirect**: `/admin/roles` after login

#### Admin
- **Permissions**: All system permissions except role/permission management
- **Access**: Can assign roles to staff, manage all other resources
- **Redirect**: `/admin/staffs` after login

#### Doctor
- **Permissions**: 
  - `appointments:view`, `appointments:create`, `appointments:update`
  - `patients:view`, `patients:create`, `patients:update`
  - `transcriptions:view`, `transcriptions:create`, `transcriptions:update`
  - `reminders:view`, `reminders:create`, `reminders:update`

#### Nurse
- **Permissions**:
  - `appointments:view`
  - `patients:view`, `patients:update`
  - `reminders:view`, `reminders:create`, `reminders:update`

#### Receptionist
- **Permissions**:
  - `appointments:view`, `appointments:create`, `appointments:update`
  - `patients:view`, `patients:create`

## 🚀 Getting Started

### 1. Admin Login
Navigate to `/admin/login` to access the admin panel.

**Default Admin Credentials** (for development):
- Email: `admin@hospital.com`
- Password: `admin123`

### 2. Admin Dashboard
After login, you'll be redirected based on your role:
- **Super Admin** → `/admin/roles`
- **Admin** → `/admin/staffs`

### 3. Role Management (Super Admin Only)
- **Create Roles**: Define new roles with specific permissions
- **Edit Roles**: Modify existing roles and their permissions
- **Delete Roles**: Remove roles (with safety checks)
- **Permission Assignment**: Assign specific permissions to roles

### 4. Permission Management (Super Admin Only)
- **View Permissions**: See all available system permissions
- **Create Permissions**: Add new permissions for custom resources
- **Edit Permissions**: Modify existing permissions
- **Delete Permissions**: Remove unused permissions

### 5. Staff Role Assignment (Admin & Super Admin)
- **View Staff**: See all staff members with their current roles
- **Assign Roles**: Change staff member roles
- **Role Overview**: See role distribution across staff

## 🔧 Implementation Details

### Frontend Structure
```
src/
├── Admin/
│   ├── AdminLogin.jsx          # Admin authentication
│   ├── AdminDashboard.jsx      # Main admin interface
│   ├── RolesManagement.jsx     # Role CRUD operations
│   ├── PermissionsManagement.jsx # Permission management
│   └── StaffRoleAssignment.jsx # Staff role assignment
├── components/
│   └── ProtectedRoute.jsx       # Route protection component
└── api/
    └── RBACAPI.js              # RBAC API integration
```

### Route Protection
```jsx
// Example: Super Admin only route
<Route path="/admin/roles" element={
  <ProtectedRoute requireSuperAdmin={true}>
    <RolesManagement />
  </ProtectedRoute>
} />

// Example: Permission-based route
<Route path="/admin/staffs" element={
  <ProtectedRoute requiredPermissions={['staff:assign_roles']}>
    <StaffRoleAssignment />
  </ProtectedRoute>
} />
```

### Permission Checks
```jsx
// Component-level permission check
const isSuperAdmin = user?.permissions?.includes('roles:manage') || user?.role === 'super_admin'
const isAdmin = user?.permissions?.includes('staff:assign_roles') || user?.role === 'admin'

// Conditional rendering
{isSuperAdmin && (
  <Button onClick={createRole}>Create Role</Button>
)}
```

## 🛡️ Security Features

### Authentication
- JWT-based authentication for admin users
- Separate admin login endpoint
- Token validation and refresh

### Authorization
- Route-level protection with `ProtectedRoute`
- Component-level permission checks
- API endpoint protection with guards

### Data Validation
- Input validation on all forms
- Permission validation before actions
- Role hierarchy enforcement

## 📊 Usage Examples

### Creating a New Role
1. Navigate to `/admin/roles`
2. Click "Create Role"
3. Enter role name and description
4. Select permissions from the list
5. Save the role

### Assigning Roles to Staff
1. Navigate to `/admin/staffs`
2. Find the staff member
3. Click "Edit" next to their current role
4. Select new role from dropdown
5. Save changes

### Managing Permissions
1. Navigate to `/admin/permissions`
2. View all system permissions
3. Create new permissions for custom resources
4. Edit or delete existing permissions

## 🔄 API Integration

### RBAC API Endpoints
```javascript
// Roles
GET    /admin/roles              # Get all roles
POST   /admin/roles              # Create role
PUT    /admin/roles/:id          # Update role
DELETE /admin/roles/:id          # Delete role

// Permissions
GET    /admin/permissions        # Get all permissions
POST   /admin/permissions        # Create permission
PUT    /admin/permissions/:id    # Update permission
DELETE /admin/permissions/:id    # Delete permission

// Staff
GET    /admin/staff              # Get all staff
POST   /admin/staff/:id/role     # Assign role to staff
DELETE /admin/staff/:id/role/:roleId # Remove role from staff
```

### API Usage
```javascript
import { rbacAPI } from '../api/RBACAPI'

// Get all roles
const roles = await rbacAPI.getRoles()

// Create new role
const newRole = await rbacAPI.createRole({
  name: 'Custom Role',
  description: 'Custom role description',
  permissionIds: [1, 2, 3]
})

// Assign role to staff
await rbacAPI.assignRoleToStaff(staffId, roleId)
```

## 🎨 UI Components

### Admin Login
- Clean, professional login form
- Email and password fields
- Loading states and error handling
- Redirect based on user role

### Admin Dashboard
- Overview of system statistics
- Quick access to admin functions
- Recent activity feed
- Role-based navigation

### Role Management
- Table view of all roles
- Inline editing capabilities
- Permission assignment interface
- Bulk operations support

### Permission Management
- Categorized permission list
- Search and filter functionality
- Resource and action grouping
- Permission creation form

### Staff Role Assignment
- Staff member list with current roles
- Role assignment interface
- Role distribution overview
- Search and filter staff

## 🚨 Error Handling

### Access Denied
- Clear error messages for insufficient permissions
- Redirect to appropriate pages
- Fallback for unauthorized access

### Validation Errors
- Form validation with helpful messages
- Real-time feedback
- Error recovery suggestions

### Network Errors
- API error handling
- Retry mechanisms
- Offline state management

## 🔧 Configuration

### Environment Variables
```env
# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your-username
DB_PASSWORD=your-password
DB_NAME=medassist
```

### Permission Configuration
Permissions are defined in the backend seeder and can be customized based on your application needs.

## 📝 Development Notes

### Adding New Permissions
1. Add permission to backend seeder
2. Update frontend permission lists
3. Add permission checks to components
4. Update role assignments

### Creating Custom Roles
1. Use the admin interface to create roles
2. Assign appropriate permissions
3. Test role functionality
4. Document role purpose

### Extending the System
- Add new resources and actions
- Create custom permission checks
- Implement role hierarchies
- Add audit logging

## 🐛 Troubleshooting

### Common Issues
1. **Permission Denied**: Check user permissions and role assignments
2. **Login Issues**: Verify admin credentials and JWT configuration
3. **Role Assignment**: Ensure staff member exists and role is valid
4. **API Errors**: Check backend service status and database connectivity

### Debug Mode
Enable debug logging to troubleshoot permission issues:
```javascript
// Add to component
console.log('User permissions:', user.permissions)
console.log('Required permissions:', requiredPermissions)
```

## 📚 Additional Resources

- [Backend Implementation Guide](./BACKEND_RBAC_IMPLEMENTATION.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Security Best Practices](./SECURITY_GUIDE.md)

## 🤝 Contributing

When adding new features:
1. Update permission lists
2. Add route protection
3. Update admin interfaces
4. Test with different user roles
5. Update documentation

This RBAC system provides a robust foundation for managing user access and permissions in the MedAssist application.

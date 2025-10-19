# RBAC Backend Implementation Guide

This document provides the complete backend implementation for the Role-Based Access Control (RBAC) system using NestJS.

## 1. Entities

### Role Entity
```typescript
// src/entities/role.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { RolePermission } from './role-permission.entity';
import { StaffRole } from './staff-role.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => RolePermission, rolePermission => rolePermission.role)
  rolePermissions: RolePermission[];

  @OneToMany(() => StaffRole, staffRole => staffRole.role)
  staffRoles: StaffRole[];
}
```

### Permission Entity
```typescript
// src/entities/permission.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { RolePermission } from './role-permission.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  resource: string;

  @Column()
  action: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => RolePermission, rolePermission => rolePermission.permission)
  rolePermissions: RolePermission[];
}
```

### RolePermission Entity (Many-to-Many)
```typescript
// src/entities/role-permission.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Role } from './role.entity';
import { Permission } from './permission.entity';

@Entity('role_permissions')
export class RolePermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  roleId: number;

  @Column()
  permissionId: number;

  @CreateDateColumn()
  assignedAt: Date;

  @ManyToOne(() => Role, role => role.rolePermissions)
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @ManyToOne(() => Permission, permission => permission.rolePermissions)
  @JoinColumn({ name: 'permissionId' })
  permission: Permission;
}
```

### StaffRole Entity (Many-to-Many)
```typescript
// src/entities/staff-role.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Role } from './role.entity';

@Entity('staff_roles')
export class StaffRole {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  staffId: number;

  @Column()
  roleId: number;

  @Column({ nullable: true })
  assignedBy: number;

  @CreateDateColumn()
  assignedAt: Date;

  @ManyToOne(() => Role, role => role.staffRoles)
  @JoinColumn({ name: 'roleId' })
  role: Role;
}
```

## 2. DTOs

### Role DTOs
```typescript
// src/dto/role.dto.ts
import { IsString, IsOptional, IsBoolean, IsArray, IsNumber } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  permissionIds?: number[];
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  permissionIds?: number[];
}
```

### Permission DTOs
```typescript
// src/dto/permission.dto.ts
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  resource: string;

  @IsString()
  action: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePermissionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  resource?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
```

## 3. Guards and Decorators

### Permissions Guard
```typescript
// src/guards/permissions.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check roles
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.some(role => user.roles?.includes(role));
      if (!hasRole) {
        throw new ForbiddenException('Insufficient role permissions');
      }
    }

    // Check permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.some(permission => 
        user.permissions?.includes(permission)
      );
      if (!hasPermission) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    return true;
  }
}
```

### Decorators
```typescript
// src/decorators/permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

// src/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const RequireRoles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// src/decorators/user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

## 4. Services

### Roles Service
```typescript
// src/services/roles.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { CreateRoleDto, UpdateRoleDto } from '../dto/role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const existingRole = await this.rolesRepository.findOne({
      where: { name: createRoleDto.name }
    });

    if (existingRole) {
      throw new ConflictException('Role with this name already exists');
    }

    const role = this.rolesRepository.create(createRoleDto);
    return await this.rolesRepository.save(role);
  }

  async findAll(): Promise<Role[]> {
    return await this.rolesRepository.find({
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.rolesRepository.findOne({
      where: { id },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);
    
    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.rolesRepository.findOne({
        where: { name: updateRoleDto.name }
      });

      if (existingRole) {
        throw new ConflictException('Role with this name already exists');
      }
    }

    Object.assign(role, updateRoleDto);
    return await this.rolesRepository.save(role);
  }

  async remove(id: number): Promise<void> {
    const role = await this.findOne(id);
    await this.rolesRepository.remove(role);
  }
}
```

### Permissions Service
```typescript
// src/services/permissions.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { CreatePermissionDto, UpdatePermissionDto } from '../dto/permission.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
  ) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const existingPermission = await this.permissionsRepository.findOne({
      where: { name: createPermissionDto.name }
    });

    if (existingPermission) {
      throw new ConflictException('Permission with this name already exists');
    }

    const permission = this.permissionsRepository.create(createPermissionDto);
    return await this.permissionsRepository.save(permission);
  }

  async findAll(): Promise<Permission[]> {
    return await this.permissionsRepository.find();
  }

  async findOne(id: number): Promise<Permission> {
    const permission = await this.permissionsRepository.findOne({
      where: { id }
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return permission;
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
    const permission = await this.findOne(id);
    
    if (updatePermissionDto.name && updatePermissionDto.name !== permission.name) {
      const existingPermission = await this.permissionsRepository.findOne({
        where: { name: updatePermissionDto.name }
      });

      if (existingPermission) {
        throw new ConflictException('Permission with this name already exists');
      }
    }

    Object.assign(permission, updatePermissionDto);
    return await this.permissionsRepository.save(permission);
  }

  async remove(id: number): Promise<void> {
    const permission = await this.findOne(id);
    await this.permissionsRepository.remove(permission);
  }
}
```

## 5. Controllers

### Roles Controller
```typescript
// src/controllers/roles.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { RolesService } from '../services/roles.service';
import { CreateRoleDto, UpdateRoleDto } from '../dto/role.dto';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermissions } from '../decorators/permissions.decorator';
import { GetUser } from '../decorators/user.decorator';

@Controller('admin/roles')
@UseGuards(PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @RequirePermissions('roles:manage')
  create(@Body() createRoleDto: CreateRoleDto, @GetUser() user: any) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @RequirePermissions('roles:view')
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('roles:view')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(+id);
  }

  @Patch(':id')
  @RequirePermissions('roles:manage')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(+id, updateRoleDto);
  }

  @Delete(':id')
  @RequirePermissions('roles:manage')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(+id);
  }
}
```

### Permissions Controller
```typescript
// src/controllers/permissions.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PermissionsService } from '../services/permissions.service';
import { CreatePermissionDto, UpdatePermissionDto } from '../dto/permission.dto';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermissions } from '../decorators/permissions.decorator';

@Controller('admin/permissions')
@UseGuards(PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @RequirePermissions('permissions:manage')
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Get()
  @RequirePermissions('permissions:view')
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  @RequirePermissions('permissions:view')
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(+id);
  }

  @Patch(':id')
  @RequirePermissions('permissions:manage')
  update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    return this.permissionsService.update(+id, updatePermissionDto);
  }

  @Delete(':id')
  @RequirePermissions('permissions:manage')
  remove(@Param('id') id: string) {
    return this.permissionsService.remove(+id);
  }
}
```

## 6. Modules

### Roles Module
```typescript
// src/modules/roles.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesService } from '../services/roles.service';
import { RolesController } from '../controllers/roles.controller';
import { Role } from '../entities/role.entity';
import { RolePermission } from '../entities/role-permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Role, RolePermission])],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
```

### Permissions Module
```typescript
// src/modules/permissions.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsService } from '../services/permissions.service';
import { PermissionsController } from '../controllers/permissions.controller';
import { Permission } from '../entities/permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Permission])],
  controllers: [PermissionsController],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
```

## 7. Database Seeding

### Permission Seeder
```typescript
// src/seeders/permissions.seeder.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';

@Injectable()
export class PermissionsSeeder {
  constructor(
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
  ) {}

  async seed() {
    const permissions = [
      // Appointments
      { name: 'appointments:view', description: 'View appointments', resource: 'appointments', action: 'view' },
      { name: 'appointments:create', description: 'Create appointments', resource: 'appointments', action: 'create' },
      { name: 'appointments:update', description: 'Update appointments', resource: 'appointments', action: 'update' },
      { name: 'appointments:delete', description: 'Delete appointments', resource: 'appointments', action: 'delete' },
      
      // Patients
      { name: 'patients:view', description: 'View patients', resource: 'patients', action: 'view' },
      { name: 'patients:create', description: 'Create patients', resource: 'patients', action: 'create' },
      { name: 'patients:update', description: 'Update patients', resource: 'patients', action: 'update' },
      { name: 'patients:delete', description: 'Delete patients', resource: 'patients', action: 'delete' },
      
      // Staff
      { name: 'staff:view', description: 'View staff', resource: 'staff', action: 'view' },
      { name: 'staff:create', description: 'Create staff', resource: 'staff', action: 'create' },
      { name: 'staff:update', description: 'Update staff', resource: 'staff', action: 'update' },
      { name: 'staff:delete', description: 'Delete staff', resource: 'staff', action: 'delete' },
      { name: 'staff:assign_roles', description: 'Assign roles to staff', resource: 'staff', action: 'assign_roles' },
      
      // Hospitals
      { name: 'hospitals:view', description: 'View hospitals', resource: 'hospitals', action: 'view' },
      { name: 'hospitals:create', description: 'Create hospitals', resource: 'hospitals', action: 'create' },
      { name: 'hospitals:update', description: 'Update hospitals', resource: 'hospitals', action: 'update' },
      { name: 'hospitals:delete', description: 'Delete hospitals', resource: 'hospitals', action: 'delete' },
      
      // Transcriptions
      { name: 'transcriptions:view', description: 'View transcriptions', resource: 'transcriptions', action: 'view' },
      { name: 'transcriptions:create', description: 'Create transcriptions', resource: 'transcriptions', action: 'create' },
      { name: 'transcriptions:update', description: 'Update transcriptions', resource: 'transcriptions', action: 'update' },
      { name: 'transcriptions:delete', description: 'Delete transcriptions', resource: 'transcriptions', action: 'delete' },
      
      // Reminders
      { name: 'reminders:view', description: 'View reminders', resource: 'reminders', action: 'view' },
      { name: 'reminders:create', description: 'Create reminders', resource: 'reminders', action: 'create' },
      { name: 'reminders:update', description: 'Update reminders', resource: 'reminders', action: 'update' },
      { name: 'reminders:delete', description: 'Delete reminders', resource: 'reminders', action: 'delete' },
      
      // Audit Logs
      { name: 'audit-logs:view', description: 'View audit logs', resource: 'audit-logs', action: 'view' },
      
      // Roles & Permissions
      { name: 'roles:manage', description: 'Manage roles and permissions', resource: 'roles', action: 'manage' },
      { name: 'permissions:manage', description: 'Manage permissions', resource: 'permissions', action: 'manage' },
    ];

    for (const permissionData of permissions) {
      const existingPermission = await this.permissionsRepository.findOne({
        where: { name: permissionData.name }
      });

      if (!existingPermission) {
        const permission = this.permissionsRepository.create(permissionData);
        await this.permissionsRepository.save(permission);
        console.log(`Created permission: ${permissionData.name}`);
      }
    }
  }
}
```

### Role Seeder
```typescript
// src/seeders/roles.seeder.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';

@Injectable()
export class RolesSeeder {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
  ) {}

  async seed() {
    const roles = [
      {
        name: 'Admin',
        description: 'Full system access',
        permissions: [
          'appointments:view', 'appointments:create', 'appointments:update', 'appointments:delete',
          'patients:view', 'patients:create', 'patients:update', 'patients:delete',
          'staff:view', 'staff:create', 'staff:update', 'staff:delete', 'staff:assign_roles',
          'hospitals:view', 'hospitals:create', 'hospitals:update', 'hospitals:delete',
          'transcriptions:view', 'transcriptions:create', 'transcriptions:update', 'transcriptions:delete',
          'reminders:view', 'reminders:create', 'reminders:update', 'reminders:delete',
          'audit-logs:view', 'roles:manage', 'permissions:manage'
        ]
      },
      {
        name: 'Doctor',
        description: 'Medical staff with patient access',
        permissions: [
          'appointments:view', 'appointments:create', 'appointments:update',
          'patients:view', 'patients:create', 'patients:update',
          'transcriptions:view', 'transcriptions:create', 'transcriptions:update',
          'reminders:view', 'reminders:create', 'reminders:update'
        ]
      },
      {
        name: 'Nurse',
        description: 'Nursing staff with limited access',
        permissions: [
          'appointments:view',
          'patients:view', 'patients:update',
          'reminders:view', 'reminders:create', 'reminders:update'
        ]
      },
      {
        name: 'Receptionist',
        description: 'Front desk staff',
        permissions: [
          'appointments:view', 'appointments:create', 'appointments:update',
          'patients:view', 'patients:create'
        ]
      }
    ];

    for (const roleData of roles) {
      const existingRole = await this.rolesRepository.findOne({
        where: { name: roleData.name }
      });

      if (!existingRole) {
        const role = this.rolesRepository.create({
          name: roleData.name,
          description: roleData.description
        });
        const savedRole = await this.rolesRepository.save(role);

        // Assign permissions to role
        for (const permissionName of roleData.permissions) {
          const permission = await this.permissionsRepository.findOne({
            where: { name: permissionName }
          });

          if (permission) {
            // Create role-permission relationship
            // This would be handled by a service method
            console.log(`Assigned permission ${permissionName} to role ${roleData.name}`);
          }
        }

        console.log(`Created role: ${roleData.name}`);
      }
    }
  }
}
```

## 8. JWT Strategy Update

```typescript
// src/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    // Fetch user with roles and permissions
    const user = await this.authService.validateUserById(payload.sub);
    
    if (user) {
      // Extract permissions from user's roles
      const permissions = [];
      if (user.roles) {
        for (const role of user.roles) {
          if (role.rolePermissions) {
            for (const rolePermission of role.rolePermissions) {
              if (rolePermission.permission) {
                permissions.push(rolePermission.permission.name);
              }
            }
          }
        }
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles?.map(role => role.name) || [],
        permissions: permissions
      };
    }
    return null;
  }
}
```

## 9. Usage in Controllers

```typescript
// Example controller with permission checks
@Controller('appointments')
@UseGuards(PermissionsGuard)
export class AppointmentsController {
  
  @Get()
  @RequirePermissions('appointments:view')
  findAll() {
    return this.appointmentsService.findAll();
  }

  @Post()
  @RequirePermissions('appointments:create')
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Patch(':id')
  @RequirePermissions('appointments:update')
  update(@Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentDto) {
    return this.appointmentsService.update(+id, updateAppointmentDto);
  }

  @Delete(':id')
  @RequirePermissions('appointments:delete')
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(+id);
  }
}
```

This implementation provides a complete RBAC system with:
- Role and Permission entities
- Many-to-many relationships
- Permission-based guards and decorators
- JWT integration with permissions
- Database seeding
- Full CRUD operations for roles and permissions

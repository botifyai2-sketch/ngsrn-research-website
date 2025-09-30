import { UserRole } from "@prisma/client"

export type Permission = 
  | "articles:read"
  | "articles:write" 
  | "articles:publish"
  | "articles:delete"
  | "authors:read"
  | "authors:write"
  | "authors:delete"
  | "divisions:read"
  | "divisions:write"
  | "divisions:delete"
  | "media:read"
  | "media:write"
  | "media:delete"
  | "users:read"
  | "users:write"
  | "users:delete"
  | "analytics:read"
  | "settings:read"
  | "settings:write"

const rolePermissions: Record<UserRole, Permission[]> = {
  ADMIN: [
    "articles:read",
    "articles:write",
    "articles:publish",
    "articles:delete",
    "authors:read",
    "authors:write",
    "authors:delete",
    "divisions:read",
    "divisions:write",
    "divisions:delete",
    "media:read",
    "media:write",
    "media:delete",
    "users:read",
    "users:write",
    "users:delete",
    "analytics:read",
    "settings:read",
    "settings:write",
  ],
  EDITOR: [
    "articles:read",
    "articles:write",
    "articles:publish",
    "authors:read",
    "authors:write",
    "divisions:read",
    "media:read",
    "media:write",
    "analytics:read",
  ],
  VIEWER: [
    "articles:read",
    "authors:read",
    "divisions:read",
    "media:read",
  ],
}

export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return rolePermissions[userRole]?.includes(permission) ?? false
}

export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission))
}

export function getPermissions(userRole: UserRole): Permission[] {
  return rolePermissions[userRole] ?? []
}

// Helper functions for common permission checks
export function canManageArticles(userRole: UserRole): boolean {
  return hasPermission(userRole, "articles:write")
}

export function canPublishArticles(userRole: UserRole): boolean {
  return hasPermission(userRole, "articles:publish")
}

export function canManageUsers(userRole: UserRole): boolean {
  return hasPermission(userRole, "users:write")
}

export function canAccessCMS(userRole: UserRole): boolean {
  return hasAnyPermission(userRole, ["articles:write", "articles:read"])
}

export function canAccessSettings(userRole: UserRole): boolean {
  return hasPermission(userRole, "settings:read")
}
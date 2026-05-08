import { useGetCurrentUser } from "@workspace/api-client-react";
import type { UserRole } from "@workspace/api-client-react";

export type Role = UserRole;

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  manager: "Manager",
  staff: "Staff",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: "Full access including team and role management.",
  manager: "Manage all sales and customers, view reports.",
  staff: "Log sales and view customers and reports.",
};

export function useCurrentUserRole() {
  const q = useGetCurrentUser();
  const effectiveRole: Role = q.data?.role ?? "admin";

  return {
    user: q.data,
    role: effectiveRole,
    isAdmin: effectiveRole === "admin",
    isManager: effectiveRole === "manager",
    isStaff: effectiveRole === "staff",
    canManageCustomers:
      effectiveRole === "admin" || effectiveRole === "manager",
    canDeleteSales:
      effectiveRole === "admin" || effectiveRole === "manager",
    canManageTeam: effectiveRole === "admin",
    isLoading: q.isLoading,
  };
}

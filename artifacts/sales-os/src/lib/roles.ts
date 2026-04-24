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
  return {
    user: q.data,
    role: q.data?.role,
    isAdmin: q.data?.role === "admin",
    isManager: q.data?.role === "manager",
    isStaff: q.data?.role === "staff",
    canManageCustomers:
      q.data?.role === "admin" || q.data?.role === "manager",
    canDeleteSales:
      q.data?.role === "admin" || q.data?.role === "manager",
    canManageTeam: q.data?.role === "admin",
    isLoading: q.isLoading,
  };
}

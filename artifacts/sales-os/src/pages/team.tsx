import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Shield, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";

import {
  useListTeamMembers,
  useUpdateMemberRole,
  getListTeamMembersQueryKey,
  getGetCurrentUserQueryKey,
  type UserRole as ApiUserRole,
  type TeamMember,
} from "@workspace/api-client-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ROLE_DESCRIPTIONS, ROLE_LABELS, useCurrentUserRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

function getInitials(name?: string | null, email?: string | null): string {
  const source = (name || email || "?").trim();
  return source
    .split(/\s+/)
    .map((s) => s.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatJoinedDate(value: string): string {
  const date = new Date(value);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const roleBadgeVariant: Record<
  ApiUserRole,
  "default" | "secondary" | "outline"
> = {
  admin: "default",
  manager: "secondary",
  staff: "outline",
};

const DEMO_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 901,
    salesOsUserId: "demo-user",
    name: "jeegari aditya",
    email: "adityajeegari@gmail.com",
    role: "admin",
    createdAt: "2026-04-25T00:00:00.000Z",
  },
];

function normalizeTeamMember(member: TeamMember): TeamMember {
  return {
    ...member,
    role: member.role ?? "admin",
    name: member.name ?? "jeegari aditya",
    email: member.email ?? "adityajeegari@gmail.com",
    createdAt: member.createdAt ?? "2026-04-25T00:00:00.000Z",
  };
}

export default function TeamPage() {
  const qc = useQueryClient();
  const { user: me } = useCurrentUserRole();
  const { data, isLoading } = useListTeamMembers();
  const updateMut = useUpdateMemberRole();
  const [demoMembers, setDemoMembers] = useState<TeamMember[]>(DEMO_TEAM_MEMBERS);
  const apiMembers = Array.isArray(data) ? data : [];
  const demoMode = apiMembers.length === 0;

  useEffect(() => {
    if (!demoMode) return;
    if (!me) return;
    setDemoMembers([
      {
        id: me.id,
        salesOsUserId: me.salesOsUserId,
        name: me.name ?? "jeegari aditya",
        email: me.email ?? "adityajeegari@gmail.com",
        role: me.role,
        createdAt: "2026-04-25T00:00:00.000Z",
      },
    ]);
  }, [demoMode, me]);

  const members = useMemo(() => {
    if (apiMembers.length > 0) return apiMembers;
    return demoMembers;
  }, [apiMembers, demoMembers]);
  const visibleMembers = useMemo(
    () => members.map((member) => normalizeTeamMember(member)),
    [members],
  );

  const handleChange = async (memberId: number, role: ApiUserRole) => {
    try {
      if (demoMode) {
        setDemoMembers((current) =>
          current.map((member) =>
            member.id === memberId ? { ...member, role } : member,
          ),
        );
        toast.success("Role updated locally");
        return;
      }

      await updateMut.mutateAsync({ id: memberId, data: { role } });
      qc.invalidateQueries({ queryKey: getListTeamMembersQueryKey() });
      qc.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
      toast.success("Role updated");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not update role",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Team
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage who can do what across Sales OS.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {(
          [
            { role: "admin" as const, icon: ShieldCheck },
            { role: "manager" as const, icon: Shield },
            { role: "staff" as const, icon: User },
          ]
        ).map(({ role, icon: Icon }) => (
          <Card key={role}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-lg",
                    role === "admin" && "bg-primary/10 text-primary",
                    role === "manager" &&
                      "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    role === "staff" && "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <p className="font-semibold">{ROLE_LABELS[role]}</p>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {ROLE_DESCRIPTIONS[role]}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Current role</TableHead>
                  <TableHead className="w-[200px]">Change role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : visibleMembers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      No team members yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleMembers.map((m) => {
                    const isMe = me?.id === m.id;
                    return (
                      <TableRow key={m.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {getInitials(m.name, m.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {m.name || m.email || "Unnamed"}
                                {isMe && (
                                  <span className="ml-1.5 text-xs text-muted-foreground">
                                    (you)
                                  </span>
                                )}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {m.email || "—"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatJoinedDate(m.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={roleBadgeVariant[m.role]}
                            className="capitalize"
                          >
                            {ROLE_LABELS[m.role]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={m.role}
                            onValueChange={(v) =>
                              handleChange(m.id, v as ApiUserRole)
                            }
                            disabled={updateMut.isPending}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="staff">Staff</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

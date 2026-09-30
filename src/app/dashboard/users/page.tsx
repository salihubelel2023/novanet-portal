"use client";

import * as React from "react";
import { toast } from "sonner";
import { Users as UsersIcon, Search } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/primitives";
import { Skeleton } from "@/components/ui/primitives";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDate, initials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

type UserRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: keyof typeof ROLE_LABELS;
  status: "ACTIVE" | "SUSPENDED" | "PENDING";
  businessName: string | null;
  createdAt: string;
};

export default function UsersPage() {
  const [users, setUsers] = React.useState<UserRow[] | null>(null);
  const [query, setQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("ALL");

  const load = React.useCallback(async (q: string, role: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (role !== "ALL") params.set("role", role);
    const res = await fetch(`/api/users?${params.toString()}`, { cache: "no-store" });
    const json = await res.json();
    setUsers(json.users ?? []);
  }, []);

  React.useEffect(() => {
    const timeout = setTimeout(() => load(query, roleFilter), 300);
    return () => clearTimeout(timeout);
  }, [query, roleFilter, load]);

  async function updateStatus(id: string, status: "ACTIVE" | "SUSPENDED") {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const json = await res.json();
      toast.error(json.error ?? "Could not update user.");
      return;
    }
    toast.success(status === "SUSPENDED" ? "User suspended." : "User reactivated.");
    load(query, roleFilter);
  }

  return (
    <div>
      <PageHeader title="Users" description="Every account across NovaNet Portal." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name or email…" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All roles</SelectItem>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {users === null && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {users?.length === 0 && <EmptyState icon={UsersIcon} title="No users match your filters" />}

      {users && users.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{initials(u.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{u.businessName || u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{ROLE_LABELS[u.role]}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={u.status === "ACTIVE" ? "success" : u.status === "SUSPENDED" ? "danger" : "warning"}>
                        {u.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {u.status === "SUSPENDED" ? (
                            <DropdownMenuItem onClick={() => updateStatus(u.id, "ACTIVE")}>Reactivate</DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => updateStatus(u.id, "SUSPENDED")} className="text-destructive focus:text-destructive">
                              Suspend
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { Activity } from "lucide-react";

import { useListActivity } from "@workspace/api-client-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";

const ACTION_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  create: "secondary",
  update: "default",
  delete: "destructive",
};

export default function ActivityPage() {
  const { data, isLoading } = useListActivity({ limit: 100 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Activity log
        </h1>
        <p className="text-sm text-muted-foreground">
          The latest 100 actions taken across your team.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            Recent activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (data ?? []).length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No activity yet.
            </p>
          ) : (
            <ol className="space-y-3">
              {(data ?? []).map((a) => (
                <li
                  key={a.id}
                  className="flex items-start justify-between gap-3 rounded-md border p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={ACTION_VARIANT[a.action] ?? "outline"}
                        className="capitalize"
                      >
                        {a.action}
                      </Badge>
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        {a.entityType}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm">{a.summary}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {a.actorName ?? a.actorEmail ?? "System"}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground">
                    {formatDateTime(a.createdAt)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

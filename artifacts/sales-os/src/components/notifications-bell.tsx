import { Bell, AlertTriangle, ShoppingCart, Target } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import {
  useListNotifications,
  useMarkAllNotificationsRead,
  getListNotificationsQueryKey,
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDateTime } from "@/lib/format";

const ICONS: Record<string, React.ElementType> = {
  low_stock: AlertTriangle,
  new_order: ShoppingCart,
  target_set: Target,
  target_pacing: Target,
};

const ICON_TONE: Record<string, string> = {
  low_stock: "text-amber-600 dark:text-amber-400",
  new_order: "text-emerald-600 dark:text-emerald-400",
  target_set: "text-primary",
  target_pacing: "text-rose-600 dark:text-rose-400",
};

export function NotificationsBell() {
  const qc = useQueryClient();
  const { data } = useListNotifications({
    query: { refetchInterval: 30_000, queryKey: getListNotificationsQueryKey() },
  });
  const markAll = useMarkAllNotificationsRead();
  const unread = (data ?? []).filter((n) => !n.read).length;

  const onMarkAll = async () => {
    if (unread === 0) return;
    await markAll.mutateAsync();
    qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 grid h-4 min-w-[1rem] place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <button
              onClick={onMarkAll}
              className="text-xs text-primary hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {(data ?? []).length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              You're all caught up.
            </p>
          ) : (
            <ul className="divide-y">
              {(data ?? []).map((n) => {
                const Icon = ICONS[n.type] ?? Bell;
                const tone = ICON_TONE[n.type] ?? "text-muted-foreground";
                return (
                  <li
                    key={n.id}
                    className={`flex gap-3 p-4 ${n.read ? "opacity-60" : ""}`}
                  >
                    <div className={`mt-0.5 ${tone}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-tight">
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {n.body}
                      </p>
                      <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {formatDateTime(n.createdAt)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

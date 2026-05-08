import { useState } from "react";
import { Target as TargetIcon, Pencil, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  useGetCurrentTarget,
  useSetCurrentTarget,
  getGetCurrentTargetQueryKey,
} from "@workspace/api-client-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";
import { useCurrentUserRole } from "@/lib/roles";

export function TargetCard() {
  const qc = useQueryClient();
  const { canManageCustomers } = useCurrentUserRole();
  const { data } = useGetCurrentTarget();
  const setMut = useSetCurrentTarget();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("0");

  const now = new Date();
  const fallbackTarget = {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    targetAmount: 0,
    achievedAmount: 0,
    progressPercent: 0,
    daysElapsed: now.getDate(),
    daysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
  };

  const targetData = fallbackTarget;

  const targetAmount = targetData.targetAmount;
  const achieved = targetData.achievedAmount;
  const percent = targetData.progressPercent;
  const expected = targetData.targetAmount * (targetData.daysElapsed / targetData.daysInMonth);
  const onPace = targetAmount > 0 && achieved >= expected * 0.95;

  const monthLabel = new Date(targetData.year, targetData.month - 1, 1).toLocaleDateString(
    "en-IN",
    {
      month: "long",
      year: "numeric",
    },
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!Number.isFinite(num) || num < 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      await setMut.mutateAsync({ data: { targetAmount: num } });
      qc.invalidateQueries({ queryKey: getGetCurrentTargetQueryKey() });
      toast.success("Target updated");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to set target");
    }
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
              <TargetIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">{monthLabel} target</p>
              <p className="text-xs text-muted-foreground">
                {targetAmount > 0
                  ? `${formatCurrency(achieved)} of ${formatCurrency(targetAmount)}`
                  : "Set your monthly goal"}
              </p>
            </div>
          </div>
          {canManageCustomers && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setAmount(String(targetAmount));
                setOpen(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <Progress value={Math.min(100, percent)} className="h-2" />
          <div className="flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {percent.toFixed(1)}% achieved
            </span>
            <span className="text-muted-foreground">
              {`Day ${targetData.daysElapsed} of ${targetData.daysInMonth}`}
            </span>
          </div>
          {targetAmount > 0 && (
            <p className="text-xs text-muted-foreground">
              Expected pace: {formatCurrency(expected)} —{" "}
              {onPace ? "on track" : "behind"}.
            </p>
          )}
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Set monthly target</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="targetAmt">Target revenue (₹)</Label>
              <Input
                id="targetAmt"
                type="number"
                step="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={setMut.isPending}>
                Save target
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

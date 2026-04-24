import { useUser, useClerk } from "@clerk/react";
import { useTheme } from "next-themes";
import { Moon, Sun, LogOut } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile and preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={user?.imageUrl} alt={user?.fullName || ""} />
              <AvatarFallback>
                {user?.firstName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user?.fullName || "—"}</p>
              <p className="text-sm text-muted-foreground">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                value={user?.firstName ?? ""}
                disabled
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" value={user?.lastName ?? ""} disabled />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user?.primaryEmailAddress?.emailAddress ?? ""}
              disabled
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Profile details are managed through your authentication provider.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Sun className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">
                  {theme === "dark"
                    ? "Dark mode is currently active."
                    : "Light mode is currently active."}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              Switch to {theme === "dark" ? "light" : "dark"} mode
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => signOut()}
            className="w-full sm:w-auto"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

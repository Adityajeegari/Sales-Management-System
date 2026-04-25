import { useEffect, useRef } from "react";
import {
  ClerkProvider,
  SignIn,
  SignUp,
  Show,
  useClerk,
} from "@clerk/react";
import { shadcn } from "@clerk/themes";
import {
  Switch,
  Route,
  Redirect,
  useLocation,
  Router as WouterRouter,
} from "wouter";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "sonner";

import { queryClient } from "@/lib/queryClient";
import { ThemeProvider } from "@/components/theme-provider";
import { AppShell } from "@/components/layout/app-shell";

import Marketing from "@/pages/marketing";
import Dashboard from "@/pages/dashboard";
import SalesPage from "@/pages/sales";
import CustomersPage from "@/pages/customers";
import CustomerDetailPage from "@/pages/customer-detail";
import ReportsPage from "@/pages/reports";
import SettingsPage from "@/pages/settings";
import TeamPage from "@/pages/team";
import ProductsPage from "@/pages/products";
import ActivityPage from "@/pages/activity";
import NotFound from "@/pages/not-found";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl:
      typeof window !== "undefined"
        ? `${window.location.origin}${basePath}/logo.svg`
        : undefined,
  },
  variables: {
    colorPrimary: "hsl(217.2, 91.2%, 59.8%)",
    colorForeground: "hsl(222.2, 84%, 4.9%)",
    colorMutedForeground: "hsl(215.4, 16.3%, 46.9%)",
    colorDanger: "hsl(0, 84.2%, 60.2%)",
    colorBackground: "hsl(0, 0%, 100%)",
    colorInput: "hsl(0, 0%, 100%)",
    colorInputForeground: "hsl(222.2, 84%, 4.9%)",
    colorNeutral: "hsl(214.3, 31.8%, 91.4%)",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox:
      "bg-white dark:bg-[hsl(222.2,84%,4.9%)] rounded-2xl w-[440px] max-w-full overflow-hidden border border-[hsl(214.3,31.8%,91.4%)] dark:border-[hsl(217.2,32.6%,17.5%)] shadow-xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground text-2xl font-semibold tracking-tight",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButton:
      "border border-input bg-background hover:bg-muted text-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground font-medium",
    formFieldInput:
      "bg-background border-input text-foreground placeholder:text-muted-foreground",
    formButtonPrimary:
      "bg-primary hover:bg-primary/90 text-primary-foreground font-medium",
    footerAction: "text-muted-foreground",
    footerActionText: "text-muted-foreground",
    footerActionLink: "text-primary hover:text-primary/80 font-medium",
    dividerText: "text-muted-foreground",
    dividerLine: "bg-border",
    identityPreviewEditButton: "text-primary hover:text-primary/80",
    formFieldSuccessText: "text-foreground",
    alertText: "text-foreground",
    alert: "border border-input bg-muted",
    otpCodeFieldInput:
      "bg-background border-input text-foreground",
    formFieldRow: "",
    logoBox: "h-10",
    logoImage: "h-10",
    main: "",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={`${basePath}/dashboard`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={`${basePath}/dashboard`}
      />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Marketing />
      </Show>
    </>
  );
}

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Show when="signed-in">
        <AppShell>{children}</AppShell>
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to keep moving the pipeline",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Start tracking sales in minutes",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/dashboard">
            <Protected>
              <Dashboard />
            </Protected>
          </Route>
          <Route path="/sales">
            <Protected>
              <SalesPage />
            </Protected>
          </Route>
          <Route path="/products">
            <Protected>
              <ProductsPage />
            </Protected>
          </Route>
          <Route path="/activity">
            <Protected>
              <ActivityPage />
            </Protected>
          </Route>
          <Route path="/customers">
            <Protected>
              <CustomersPage />
            </Protected>
          </Route>
          <Route path="/customers/:id">
            {(params) => (
              <Protected>
                <CustomerDetailPage id={Number(params.id)} />
              </Protected>
            )}
          </Route>
          <Route path="/reports">
            <Protected>
              <ReportsPage />
            </Protected>
          </Route>
          <Route path="/team">
            <Protected>
              <TeamPage />
            </Protected>
          </Route>
          <Route path="/settings">
            <Protected>
              <SettingsPage />
            </Protected>
          </Route>
          <Route component={NotFound} />
        </Switch>
        <Toaster richColors closeButton position="top-right" />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
    </ThemeProvider>
  );
}

export default App;

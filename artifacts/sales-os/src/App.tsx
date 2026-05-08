import { useEffect, useRef } from "react";
import {
  SalesOsProvider,
  SignIn,
  SignUp,
  Show,
  useClerk,
} from "@/lib/salesos";
import { shadcn } from "@/lib/salesos";
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

function MissingSalesOsKeyScreen() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-6">
      <div className="w-full max-w-2xl rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Missing Sales OS auth config</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Set VITE_CLERK_PUBLISHABLE_KEY in your environment to enable Sales OS
          authentication.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-muted p-4 text-xs">
{`# PowerShell
$env:VITE_CLERK_PUBLISHABLE_KEY=\"pk_test_...\"
$env:PORT=5173
$env:BASE_PATH=\"/\"
corepack pnpm --filter @workspace/sales-os dev`}
        </pre>
      </div>
    </div>
  );
}

const salesOsAppearance = {
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
  useEffect(() => {
    // Replace any visible occurrences of "Clerk" with "Sales OS" on the sign-in page.
    // This runs once on mount and observes mutations to catch dynamic UI text updates.
    const replaceText = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null as any);
      const toChange: Text[] = [];
      let node: Text | null = walker.nextNode() as Text | null;
      while (node) {
        if (node.nodeValue && /\bClerk\b|\bclerk\b/.test(node.nodeValue)) {
          toChange.push(node);
        }
        node = walker.nextNode() as Text | null;
      }
      toChange.forEach((t) => {
        if (t.nodeValue) {
          t.nodeValue = t.nodeValue.replace(/\bClerk\b/g, "Sales OS").replace(/\bclerk\b/g, "Sales OS");
        }
      });
    };

    replaceText();
    const mo = new MutationObserver(() => replaceText());
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => mo.disconnect();
  }, []);
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[radial-gradient(ellipse_at_top,_hsl(217.2_91.2%_59.8%_/_0.12),_transparent_50%),linear-gradient(180deg,_hsl(var(--background)),_hsl(var(--background)))] px-4 py-10">
      <div className="w-full max-w-[560px]">
        <div className="mb-6 flex items-center gap-3 text-foreground">
          <img src={`${basePath}/logo.svg`} alt="Sales OS" className="h-11 w-11 shrink-0 rounded-xl shadow-sm" />
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.32em] text-muted-foreground">
              Sales OS
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Sign in to Sales OS
            </h1>
            <p className="text-sm text-muted-foreground">
              Continue to your pipeline, customers, and reports.
            </p>
          </div>
        </div>
        <SignIn
          routing="path"
          path={`${basePath}/sign-in`}
          signUpUrl={`${basePath}/sign-up`}
          fallbackRedirectUrl={`${basePath}/dashboard`}
        />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[radial-gradient(ellipse_at_top,_hsl(217.2_91.2%_59.8%_/_0.12),_transparent_50%),linear-gradient(180deg,_hsl(var(--background)),_hsl(var(--background)))] px-4 py-10">
      <div className="w-full max-w-[560px]">
        <div className="mb-6 flex items-center gap-3 text-foreground">
          <img src={`${basePath}/logo.svg`} alt="Sales OS" className="h-11 w-11 shrink-0 rounded-xl shadow-sm" />
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.32em] text-muted-foreground">
              Sales OS
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Create your Sales OS account
            </h1>
            <p className="text-sm text-muted-foreground">
              Start tracking customers, revenue, and forecasts in minutes.
            </p>
          </div>
        </div>
        <SignUp
          routing="path"
          path={`${basePath}/sign-up`}
          signInUrl={`${basePath}/sign-in`}
          fallbackRedirectUrl={`${basePath}/dashboard`}
        />
      </div>
    </div>
  );
}

function SalesOsQueryClientCacheInvalidator() {
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

function SalesOsProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <SalesOsProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={salesOsAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back to Sales OS",
            subtitle: "Sign in to keep moving the pipeline",
          },
        },
        signUp: {
          start: {
            title: "Create your Sales OS account",
            subtitle: "Start tracking sales in minutes",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <SalesOsQueryClientCacheInvalidator />
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
    </SalesOsProvider>
  );
}

function App() {
  if (!clerkPubKey) {
    return (
      <ThemeProvider>
        <MissingSalesOsKeyScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <WouterRouter base={basePath}>
        <SalesOsProviderWithRoutes />
      </WouterRouter>
    </ThemeProvider>
  );
}

export default App;

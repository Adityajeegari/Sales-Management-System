import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Sparkles,
  Users,
  TrendingUp,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const features = [
  {
    icon: BarChart3,
    title: "Live revenue dashboard",
    body: "KPI cards, sales trends, and category mixes — refreshed the second you close a deal.",
  },
  {
    icon: Receipt,
    title: "Frictionless sale entry",
    body: "Log an order in under ten seconds with smart defaults and inline customer linking.",
  },
  {
    icon: Users,
    title: "Customer 360",
    body: "Spend, order count, and full purchase history at a glance for every account.",
  },
  {
    icon: TrendingUp,
    title: "Forecasted revenue",
    body: "A simple regression model projects the next three months so you can plan with confidence.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by default",
    body: "Email + Google sign-in with rotating sessions. No passwords to manage yourself.",
  },
  {
    icon: Sparkles,
    title: "Built for focus",
    body: "Calm typography, generous spacing, dark mode — designed for hours of deep work.",
  },
];

export default function Marketing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="tracking-tight">Sales OS</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">
                Get started
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--color-primary)/15%,_transparent_60%)]" />
          <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 pb-24 pt-20 md:pt-28 lg:grid-cols-[1.1fr_1fr] lg:pb-32 lg:pt-32">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex flex-col items-start gap-6"
            >
              <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Sales operations, simplified
              </span>
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
                The cockpit for the
                <span className="text-primary"> modern sales team.</span>
              </h1>
              <p className="max-w-xl text-lg text-muted-foreground">
                Track every sale, customer, and forecasted dollar in one calm,
                fast workspace. No spreadsheets. No clutter. Just the numbers
                that move your business.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link href="/sign-up">
                    Start for free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/sign-in">Sign in</Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Email + Google sign-in. No credit card required.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
              className="relative"
            >
              <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl">
                <div className="flex items-center gap-1.5 border-b bg-muted/40 px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                  <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                  <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                </div>
                <div className="grid gap-4 p-6">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Revenue", value: "$184,210" },
                      { label: "Orders", value: "1,284" },
                      { label: "Avg order", value: "$143" },
                    ].map((kpi) => (
                      <div
                        key={kpi.label}
                        className="rounded-xl border bg-background p-4"
                      >
                        <p className="text-xs text-muted-foreground">
                          {kpi.label}
                        </p>
                        <p className="mt-1 text-xl font-semibold tracking-tight">
                          {kpi.value}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border bg-background p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium">Sales trend</p>
                      <p className="text-xs text-muted-foreground">12 mo</p>
                    </div>
                    <svg
                      viewBox="0 0 320 80"
                      className="h-20 w-full text-primary"
                    >
                      <defs>
                        <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor="currentColor"
                            stopOpacity="0.4"
                          />
                          <stop
                            offset="100%"
                            stopColor="currentColor"
                            stopOpacity="0"
                          />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,60 L30,55 L60,48 L90,52 L120,40 L150,42 L180,30 L210,32 L240,22 L270,25 L300,12 L320,8 L320,80 L0,80 Z"
                        fill="url(#g)"
                      />
                      <path
                        d="M0,60 L30,55 L60,48 L90,52 L120,40 L150,42 L180,30 L210,32 L240,22 L270,25 L300,12 L320,8"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="border-t bg-muted/30">
          <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:py-28">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Everything your sales day needs.
              </h2>
              <p className="mt-3 text-muted-foreground">
                Designed for sales managers who want the truth about their
                numbers — instantly.
              </p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="rounded-2xl border bg-card p-6"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-semibold">{f.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {f.body}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-t">
          <div className="mx-auto w-full max-w-4xl px-6 py-24 text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Ready to run your sales day with clarity?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Set up takes less than a minute. Start tracking revenue today.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Create your account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/sign-in">Sign in</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground md:flex-row">
          <span>&copy; {new Date().getFullYear()} Sales OS</span>
          <span>Built with care for sales teams everywhere.</span>
        </div>
      </footer>
    </div>
  );
}

void basePath;

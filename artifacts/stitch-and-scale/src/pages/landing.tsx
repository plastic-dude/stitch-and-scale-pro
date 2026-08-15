// CHK-080 — Public landing page for Stitch & Scale.
//
// The first revenue-facing surface. The app proper lives inside <Shell>;
// this page is a full-width marketing view with a live demo link (the
// existing demo project) and an early-access email capture. No backend
// yet: submissions queue to localStorage until Supabase is wired in
// (standing architecture: the capture form posts to an endpoint the
// Supabase run will replace).
//
// Why this structure wins against the status quo (e.g. stitchscale.app's
// single gauge page): one page that proves the whole business toolkit,
// zero onboarding to the live demo, and a direct path to the inbox of
// someone who will pay.
import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Globe2,
  Layers,
  Mail,
  Package,
  Ruler,
  Scissors,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const DEMO_PROJECT_ID = "mss5osqd88j6fdyvtdu";

const CAPABILITIES = [
  {
    icon: Layers,
    title: "Grading Lab",
    body: "Multi-size grading tables from a single set of measurements. Enter one size, get the whole range — checked against your chosen grading rules.",
  },
  {
    icon: Scissors,
    title: "Yield & Cost",
    body: "Yarn estimates, wastage, and true unit cost per pattern size. Know your margin before you write the first line of instructions.",
  },
  {
    icon: Calculator,
    title: "Pricing & Income",
    body: "Market-band pricing, price psychology, and income scenarios across platforms — including real marketplace take rates.",
  },
  {
    icon: Store,
    title: "Wholesale Line Sheets",
    body: "Keystone-compliant wholesale pricing with tier discounts, per-order costs, Net 30 drag, and marketplace commission comparisons.",
  },
  {
    icon: Globe2,
    title: "International Pricing",
    body: "Parity pricing across 13 currencies with FX-leak tracking — price each market like a business, not a guess.",
  },
  {
    icon: Ruler,
    title: "Gauge & Fit Translator",
    body: "Enter each test knitter's swatch tension and see how it translates your graded sizes — which size each tester should knit, at a glance.",
  },
];

const STATS = [
  { value: "75", label: "business labs in one workspace" },
  { value: "1,600+", label: "verified tests behind the math" },
  { value: "13", label: "currencies in parity pricing" },
  { value: "100%", label: "local-first — your data stays yours" },
];

const EMAIL_KEY = "stitch-and-scale-early-access-queue-v1";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return;
    try {
      const existing = JSON.parse(localStorage.getItem(EMAIL_KEY) ?? "[]");
      existing.push({ email, ts: Date.now() });
      localStorage.setItem(EMAIL_KEY, JSON.stringify(existing));
    } catch {
      // best-effort queue
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Scissors className="h-4 w-4" />
            </span>
            <span className="font-semibold">Stitch &amp; Scale</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/project/${DEMO_PROJECT_ID}`}>
              <Button variant="ghost" size="sm">
                Open demo
              </Button>
            </Link>
            <Link href={`/project/${DEMO_PROJECT_ID}`}>
              <Button size="sm">
                Try it free <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-20 text-center sm:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Package className="h-3.5 w-3.5" />
            For indie knitwear pattern designers
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Know what your pattern <em className="text-primary not-italic">actually</em> costs
            before you publish it.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Grading, yield, pricing, wholesale, international parity — the business math
            nobody builds tools for. Run your pattern business on numbers, not hope.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href={`/project/${DEMO_PROJECT_ID}`}>
              <Button size="lg" className="h-11 px-6 text-sm">
                Try the live demo <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="h-11 px-6 text-sm"
              onClick={() =>
                document.getElementById("early-access")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Get early access
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No signup. No install. The demo is the real app with a sample project.
          </p>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/40">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-8 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">
          One workspace for the whole pattern business
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground">
          Marketplaces take 15–20% and own your customer. The tools below are built so you
          can price, publish, and sell on your own terms.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className="h-full">
                <CardContent className="space-y-2.5 p-5">
                  <c.icon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{c.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href={`/project/${DEMO_PROJECT_ID}`}>
            <Button variant="outline" size="lg">
              Explore all 75 labs in the demo
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Early access */}
      <section id="early-access" className="border-t bg-muted/40">
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <Mail className="mx-auto h-6 w-6 text-primary" />
          <h2 className="mt-3 text-2xl font-bold">Early access</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Paid plans are coming. The early-access list hears about pricing first and gets
            founding-member rates. We only email when there's something real to share.
          </p>
          {submitted ? (
            <div className="mt-6 inline-flex items-center gap-2 rounded-md border bg-background px-4 py-2.5 text-sm text-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              You're on the list. We'll be in touch before launch.
            </div>
          ) : (
            <form onSubmit={submit} className="mx-auto mt-6 flex max-w-md gap-2">
              <Input
                type="email"
                required
                placeholder="you@yourknitbrand.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-background"
              />
              <Button type="submit" size="lg" className="h-11 shrink-0">
                Join
              </Button>
            </form>
          )}
        </div>
      </section>

      <Separator />

      {/* Footer */}
      <footer className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Scissors className="h-3.5 w-3.5" />
            <span>Stitch &amp; Scale — the knitwear designer's business toolkit</span>
          </div>
          <div>
            Local-first: your projects live in your browser until accounts ship.
          </div>
        </div>
      </footer>
    </div>
  );
}

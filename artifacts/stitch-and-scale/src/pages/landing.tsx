// CHK-080/081 — Public landing page for Stitch & Scale, reworked into a
// tester-first funnel (voice brief: docs/brand-voice-brief.md).
//
// The page's single job: recruit FOUNDING TESTERS — knitwear designers
// who try the live demo and say what they'd pay. No paid spend until the
// list proves demand (founder decision, 15 Aug).
//
// Voice rules: first person, craft truth before tech truth, short
// declarative lines, terminal/hacker flavor sparingly, zero corporate
// SaaS-speak. See banned-terms list in the voice brief.
//
// The app proper lives inside <Shell>; this page is a full-width view
// with a live demo link (the existing demo project) and the founding-
// tester capture. No backend yet: submissions queue to localStorage
// until Supabase/Brevo are wired in (standing architecture: the capture
// form posts to an endpoint the Supabase run will replace).
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
import { useSettings } from "@/context/SettingsContext";
// CHK-119: the demo id is single-sourced — the workspace seeds the populated
// demo on first request for exactly this id. Never redeclare it here.
import { DEMO_PROJECT_ID } from "@/context/ProjectsContext";
import { getLandingCopy } from "@/lib/landing-copy";

const CAPABILITY_ICONS = [Layers, Scissors, Calculator, Store, Globe2, Ruler];
const STAT_VALUES = ["79", "1,694+", "13", "100%"];

const EMAIL_KEY = "stitch-and-scale-early-access-queue-v1";

export default function Landing() {
  const { language } = useSettings();
  const copy = getLandingCopy(language);
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
          <div className="flex items-center gap-2.5">
            <img
              src="/favicon.png"
              alt="Stitch & Scale"
              className="h-8 w-8 rounded-md object-cover shadow-sm"
            />
            <span className="font-semibold tracking-tight">Stitch &amp; Scale</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/project/${DEMO_PROJECT_ID}`}>
              <Button variant="ghost" size="sm">
                {copy.openDemo}
              </Button>
            </Link>
            <Link href={`/project/${DEMO_PROJECT_ID}`}>
              <Button size="sm">
                {copy.tryFree} <ArrowRight className="ml-1 h-3.5 w-3.5" />
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
          <img
            src="/app-logo.png"
            alt="Stitch & Scale"
            className="mx-auto mb-6 h-24 w-24 rounded-2xl object-cover shadow-sm sm:h-28 sm:w-28"
          />
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Package className="h-3.5 w-3.5" />
            {copy.audience}
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            {copy.heroTitleBefore} <em className="text-primary not-italic">{copy.heroTitleEmphasis}</em> it?
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            {copy.heroDescription}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href={`/project/${DEMO_PROJECT_ID}`}>
              <Button size="lg" className="h-11 px-6 text-sm">
                {copy.tryLiveDemo} <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="h-11 px-6 text-sm"
              onClick={() =>
                document.getElementById("founding-testers")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              {copy.joinFoundingTester}
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {copy.noSignup}
          </p>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/40">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-8 sm:grid-cols-4">
          {STAT_VALUES.map((value, index) => (
            <div key={copy.stats[index]} className="text-center">
              <div className="text-2xl font-bold">{value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{copy.stats[index]}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">
          {copy.workspaceTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground">
          {copy.workspaceDescription}
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {copy.capabilities.map((c, i) => {
            const Icon = CAPABILITY_ICONS[i];
            return (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className="h-full">
                <CardContent className="space-y-2.5 p-5">
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{c.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
                </CardContent>
              </Card>
            </motion.div>
            );
          })}
        </div>
        <div className="mt-8 text-center">
          <Link href={`/project/${DEMO_PROJECT_ID}`}>
            <Button variant="outline" size="lg">
              {copy.exploreLabs}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Founding testers */}
      <section id="founding-testers" className="border-t bg-muted/40">
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <Mail className="mx-auto h-6 w-6 text-primary" />
          <h2 className="mt-3 text-2xl font-bold">{copy.foundingTestersTitle}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {copy.foundingTestersDescription}
          </p>
          {submitted ? (
            <div className="mt-6 inline-flex items-center gap-2 rounded-md border bg-background px-4 py-2.5 text-sm text-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              {copy.foundingSuccess}
            </div>
          ) : (
            <form onSubmit={submit} className="mx-auto mt-6 flex max-w-md gap-2">
              <Input
                type="email"
                required
                placeholder={copy.emailPlaceholder}
                aria-label={copy.emailAriaLabel}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-background"
              />
              <Button type="submit" size="lg" className="h-11 shrink-0">
                {copy.joinTesters}
              </Button>
            </form>
          )}
        </div>
      </section>

      {/* Who built this — honest-founder disclosure (pitch playbook core rule) */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold">{copy.founderTitle}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {copy.founderParagraphOne}
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {copy.founderParagraphTwo}
        </p>
      </section>

      <Separator />

      {/* Footer */}
      <footer className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="" aria-hidden="true" className="h-4 w-4 rounded-sm object-cover" />
            <span>{copy.footerToolkit}</span>
          </div>
          <div>
            {copy.footerLocalFirst}
          </div>
          <div>
            {copy.footerBuiltBy}
          </div>
        </div>
      </footer>
    </div>
  );
}

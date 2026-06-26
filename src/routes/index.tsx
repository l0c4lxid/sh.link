import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Globe, Lock, QrCode, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Protocl.sh — Pemendek URL Industrialis" },
      { name: "description", content: "Sederhanakan tautan panjang. Kelola domain kustom, pantau klik, dan bagikan dengan presisi." },
      { property: "og:title", content: "Protocl.sh — Pemendek URL Industrialis" },
      { property: "og:description", content: "Platform pemendek tautan untuk tim modern dengan domain kustom & analitik." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary">
      {/* Header */}
      <header className="border-b border-border bg-background/95 px-5 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="font-mono text-sm font-bold tracking-tighter">
            PROTOCL<span className="text-primary">.SH</span>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <a href="#features" className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">Features</a>
            <a href="#pricing" className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">Pricing</a>
            <Link to="/auth" className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">Log In</Link>
          </div>
          <Link to="/auth" className="bg-foreground px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-background md:hidden">
            Login
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="animate-fade-in border-b border-border px-5 pt-12 pb-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex items-center gap-4">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">/01</span>
            <div className="h-px flex-1 bg-border" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Protocol v2.4</span>
          </div>
          <h1 className="text-balance text-5xl font-extrabold uppercase leading-[0.9] tracking-tighter md:text-7xl">
            Simplify the<br />
            <span className="text-primary">Destination.</span>
          </h1>
          <p className="mt-6 max-w-md text-pretty font-mono text-xs text-muted-foreground md:text-sm">
            Pemendek URL presisi untuk tim. Domain kustom, analitik klik, dan kontrol penuh — tanpa kompromi.
          </p>

          <div className="mt-10 max-w-xl space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Paste long URL here..."
                className="w-full border border-border bg-background px-4 py-4 pr-24 font-mono text-xs focus:border-primary focus:outline-none"
              />
              <div className="absolute right-0 top-0 flex h-full items-center border-l border-border bg-muted px-3">
                <span className="font-mono text-[10px] text-muted-foreground">HTTPS://</span>
              </div>
            </div>
            <button className="flex w-full items-center justify-center gap-2 bg-foreground py-4 font-mono text-xs font-bold uppercase tracking-widest text-background active:bg-primary">
              Shorten Protocol <ArrowRight className="size-4" />
            </button>
          </div>

          <div className="mt-8 flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" />
            <span className="uppercase tracking-widest">23,408 links shortened this week</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b border-border px-5 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex items-baseline justify-between">
            <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">/02 Capabilities</h2>
            <span className="font-mono text-[10px] text-muted-foreground">06 Modules</span>
          </div>
          <div className="grid gap-px bg-border md:grid-cols-3">
            {features.map((f, i) => (
              <div key={i} className="flex flex-col gap-3 bg-background p-6">
                <f.icon className="size-5 text-primary" strokeWidth={1.5} />
                <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  /0{i + 1}
                </div>
                <h3 className="text-lg font-extrabold uppercase tracking-tight">{f.title}</h3>
                <p className="text-pretty font-mono text-xs text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-foreground px-5 py-20 text-background">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-balance text-4xl font-extrabold uppercase leading-[0.95] tracking-tighter md:text-6xl">
            Enter the <span className="text-primary">console.</span>
          </h2>
          <p className="mt-4 max-w-md font-mono text-xs text-background/60">
            Buat akun gratis. Kelola hingga 50 tautan, 1 domain kustom, dan analitik 30 hari.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/auth"
              className="bg-primary px-6 py-4 text-center font-mono text-xs font-bold uppercase tracking-widest text-primary-foreground"
            >
              Create Account →
            </Link>
            <Link
              to="/dashboard"
              className="border border-background/30 px-6 py-4 text-center font-mono text-xs font-bold uppercase tracking-widest text-background hover:bg-background hover:text-foreground"
            >
              View Demo Dashboard
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:flex-row sm:items-center">
          <span>© 2026 Protocl.sh / All Systems</span>
          <span>v2.4.1 / EDGE</span>
        </div>
      </footer>
    </div>
  );
}

const features = [
  { icon: Zap, title: "Instant Shortening", desc: "Edge-rendered redirect dengan latensi sub-30ms global." },
  { icon: Globe, title: "Custom Domains", desc: "Bawa domain Anda sendiri. SSL otomatis & DNS bawaan." },
  { icon: BarChart3, title: "Click Intelligence", desc: "Geo, device, referrer, dan timeline klik real-time." },
  { icon: QrCode, title: "Dynamic QR", desc: "Generate QR sekali, ubah destinasi kapan saja." },
  { icon: Lock, title: "Password Gates", desc: "Lindungi tautan sensitif dengan password atau expiry." },
  { icon: ArrowRight, title: "Team Workspaces", desc: "Multi-user dengan peran admin, editor, dan viewer." },
];

import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Overview — Protocl.sh" }] }),
  component: Overview,
});

const links = [
  { slug: "/q3-promo", dest: "marketing.co/campaign/summer-sale-2024-final", clicks: 1240, status: "active" },
  { slug: "/beta-access", dest: "tally.so/r/n1x20-early-beta-signup", clicks: 892, status: "expired" },
  { slug: "/launch", dest: "product.site/v1/beta-signup-page", clicks: 2104, status: "active" },
];

function Overview() {
  return (
    <AppShell title="Overview">
      <div className="px-5 py-6 lg:px-10 lg:py-10">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-px bg-border">
          {[
            { label: "Active Links", value: "048" },
            { label: "Total Clicks", value: "12.8K" },
            { label: "Domains", value: "03" },
          ].map((s) => (
            <div key={s.label} className="bg-background p-4">
              <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                {s.label}
              </div>
              <div className="mt-2 text-2xl font-extrabold tracking-tighter">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Chart placeholder */}
        <div className="mb-6 border border-border p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              /Clicks — Last 7d
            </h2>
            <span className="font-mono text-xs font-bold text-success">+12.4%</span>
          </div>
          <div className="flex h-32 items-end gap-1.5">
            {[40, 65, 50, 80, 60, 95, 75].map((h, i) => (
              <div key={i} className="flex-1 bg-foreground" style={{ height: `${h}%` }}>
                <div className="h-1 w-full bg-primary" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent links */}
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Recent Links
          </h2>
          <Link to="/dashboard/links" className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
            View All <ArrowUpRight className="size-3" />
          </Link>
        </div>

        <div className="space-y-4">
          {links.map((l) => (
            <div key={l.slug} className={`border-b border-border pb-4 ${l.status === "expired" ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{l.slug}</span>
                    {l.status === "active" ? (
                      <span className="size-1 rounded-full bg-success" />
                    ) : (
                      <span className="border border-border px-1 font-mono text-[9px] text-muted-foreground">EXPIRED</span>
                    )}
                  </div>
                  <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">{l.dest}</p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-bold tracking-tighter">{l.clicks.toLocaleString()}</div>
                  <div className="font-mono text-[9px] uppercase tracking-tighter text-muted-foreground">Clicks</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Admin card */}
        <div className="mt-12 bg-foreground p-5 text-background">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-60">System Admin</span>
            <span className="size-2 bg-primary" />
          </div>
          <h3 className="text-lg font-bold tracking-tight">Manage Infrastructure</h3>
          <p className="mt-1 text-pretty text-xs text-background/60">
            Oversee all user domains, API keys, and rate limits.
          </p>
          <Link
            to="/dashboard/admin"
            className="mt-6 block w-full border border-background/20 py-3 text-center font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-background hover:text-foreground"
          >
            Enter Admin Console →
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

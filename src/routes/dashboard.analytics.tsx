import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/dashboard/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Protocl.sh" }] }),
  component: Analytics,
});

function Analytics() {
  return (
    <AppShell title="Analytics">
      <div className="px-5 py-6 lg:px-10 lg:py-10">
        <h1 className="text-3xl font-extrabold uppercase tracking-tighter">Analytics</h1>
        <p className="font-mono text-[10px] uppercase text-muted-foreground">Real-time click intelligence</p>

        <div className="mt-6 grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
          {[
            { l: "Today", v: "1,284", d: "+8.2%" },
            { l: "7d", v: "8,910", d: "+12.4%" },
            { l: "30d", v: "34.2K", d: "+22.1%" },
            { l: "Unique", v: "12.8K", d: "+9.0%" },
          ].map((s) => (
            <div key={s.l} className="bg-background p-4">
              <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{s.l}</div>
              <div className="mt-2 text-2xl font-extrabold tracking-tighter">{s.v}</div>
              <div className="mt-1 font-mono text-[10px] font-bold text-success">{s.d}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 border border-border p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">/Trend — 30d</h2>
          </div>
          <div className="flex h-48 items-end gap-1">
            {Array.from({ length: 30 }).map((_, i) => {
              const h = 30 + Math.sin(i / 3) * 25 + (i % 5) * 8;
              return (
                <div key={i} className="flex-1 bg-foreground" style={{ height: `${h}%` }}>
                  <div className="h-1 w-full bg-primary" />
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Panel title="Top Countries" rows={[["ID Indonesia", "42%"], ["US United States", "21%"], ["SG Singapore", "14%"], ["MY Malaysia", "9%"], ["JP Japan", "6%"]]} />
          <Panel title="Top Referrers" rows={[["instagram.com", "38%"], ["twitter.com", "22%"], ["direct", "18%"], ["whatsapp", "12%"], ["google.com", "5%"]]} />
        </div>
      </div>
    </AppShell>
  );
}

function Panel({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="border border-border">
      <div className="border-b border-border bg-muted p-3 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      <div className="divide-y divide-border">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between p-3 font-mono text-xs">
            <span>{k}</span>
            <span className="font-bold">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

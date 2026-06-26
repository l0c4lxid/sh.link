import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Filter, Search } from "lucide-react";

export const Route = createFileRoute("/dashboard/links")({
  head: () => ({ meta: [{ title: "My Links — Protocl.sh" }] }),
  component: Links,
});

const links = [
  { slug: "/q3-promo", dest: "marketing.co/campaign/summer-sale-2024-final", clicks: 1240, status: "active", domain: "protocl.sh" },
  { slug: "/beta-access", dest: "tally.so/r/n1x20-early-beta-signup", clicks: 892, status: "expired", domain: "protocl.sh" },
  { slug: "/launch", dest: "product.site/v1/beta-signup-page", clicks: 2104, status: "active", domain: "my-brand.link" },
  { slug: "/changelog", dest: "github.com/acme/repo/releases/v2.4.1", clicks: 318, status: "active", domain: "protocl.sh" },
  { slug: "/hire", dest: "notion.so/acme-careers-page-2024", clicks: 642, status: "active", domain: "my-brand.link" },
];

function Links() {
  return (
    <AppShell title="My Links">
      <div className="px-5 py-6 lg:px-10 lg:py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold uppercase tracking-tighter">My Links</h1>
          <p className="font-mono text-[10px] uppercase text-muted-foreground">{links.length} entries / protocol 048</p>
        </div>

        <div className="mb-5 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search slug or destination..."
              className="w-full border border-border bg-background py-2.5 pl-9 pr-3 font-mono text-xs focus:border-primary focus:outline-none"
            />
          </div>
          <button className="flex items-center gap-1.5 border border-border px-3 font-mono text-[10px] font-bold uppercase tracking-widest">
            <Filter className="size-3" /> Filter
          </button>
        </div>

        {/* Table on desktop, cards on mobile */}
        <div className="hidden border border-border md:block">
          <table className="w-full font-mono text-xs">
            <thead className="bg-muted">
              <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="p-3 font-bold">Slug</th>
                <th className="p-3 font-bold">Destination</th>
                <th className="p-3 font-bold">Domain</th>
                <th className="p-3 text-right font-bold">Clicks</th>
                <th className="p-3 font-bold">Status</th>
                <th className="p-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {links.map((l) => (
                <tr key={l.slug} className="border-t border-border">
                  <td className="p-3 font-bold text-primary">{l.slug}</td>
                  <td className="p-3 text-muted-foreground">{l.dest}</td>
                  <td className="p-3 text-muted-foreground">{l.domain}</td>
                  <td className="p-3 text-right font-bold">{l.clicks.toLocaleString()}</td>
                  <td className="p-3">
                    {l.status === "active" ? (
                      <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-success" /> Active</span>
                    ) : (
                      <span className="border border-border px-1.5 text-[9px] text-muted-foreground">EXPIRED</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-3 text-[9px] font-bold uppercase tracking-widest">
                      <button>Copy</button>
                      <button>QR</button>
                      <button>Edit</button>
                      <button className="text-destructive">Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="space-y-4 md:hidden">
          {links.map((l) => (
            <div key={l.slug} className={`border-b border-border pb-4 ${l.status === "expired" ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-3">
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
                  <p className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">via {l.domain}</p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-bold tracking-tighter">{l.clicks.toLocaleString()}</div>
                  <div className="font-mono text-[9px] uppercase tracking-tighter text-muted-foreground">Clicks</div>
                </div>
              </div>
              <div className="mt-3 flex gap-3">
                <button className="font-mono text-[9px] font-bold uppercase tracking-widest">Copy</button>
                <button className="font-mono text-[9px] font-bold uppercase tracking-widest">QR</button>
                <button className="font-mono text-[9px] font-bold uppercase tracking-widest">Edit</button>
                <button className="font-mono text-[9px] font-bold uppercase tracking-widest text-destructive">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

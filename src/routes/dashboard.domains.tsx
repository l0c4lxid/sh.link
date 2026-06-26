import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/dashboard/domains")({
  head: () => ({ meta: [{ title: "Domains — Protocl.sh" }] }),
  component: Domains,
});

const domains = [
  { name: "protocl.sh", links: 32, status: "verified", primary: true },
  { name: "my-brand.link", links: 12, status: "verified", primary: false },
  { name: "go.acme.io", links: 0, status: "pending", primary: false },
];

function Domains() {
  return (
    <AppShell title="Domains">
      <div className="px-5 py-6 lg:px-10 lg:py-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-extrabold uppercase tracking-tighter">Domains</h1>
            <p className="font-mono text-[10px] uppercase text-muted-foreground">Bring your own domain</p>
          </div>
          <button className="flex items-center gap-1.5 bg-primary px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
            <Plus className="size-3" /> Add
          </button>
        </div>

        <div className="space-y-4">
          {domains.map((d) => (
            <div key={d.name} className="border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold">{d.name}</span>
                    {d.primary && <span className="bg-primary px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-primary-foreground">Primary</span>}
                  </div>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {d.links} active links
                  </p>
                </div>
                <span className={`font-mono text-[10px] font-bold uppercase tracking-widest ${d.status === "verified" ? "text-success" : "text-primary"}`}>
                  ● {d.status}
                </span>
              </div>
              <div className="mt-4 flex gap-3 border-t border-border pt-3">
                <button className="font-mono text-[10px] font-bold uppercase tracking-widest">Settings</button>
                <button className="font-mono text-[10px] font-bold uppercase tracking-widest">DNS</button>
                <button className="ml-auto font-mono text-[10px] font-bold uppercase tracking-widest text-destructive">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

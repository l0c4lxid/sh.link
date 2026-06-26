import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/dashboard/domains")({
  head: () => ({ meta: [{ title: "Domain — sisolo.my.id" }] }),
  component: Domains,
});

const domains = [
  { name: "sisolo.my.id", links: 12, status: "verified", primary: true },
];

function Domains() {
  const { user } = Route.useRouteContext() as { user: any };

  return (
    <AppShell title="Domain" user={user}>
      <div className="px-5 py-6 lg:px-10 lg:py-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-extrabold uppercase tracking-tighter">Domain</h1>
            <p className="font-mono text-[10px] uppercase text-muted-foreground">Gunakan domain Anda sendiri</p>
          </div>
          <button className="flex items-center gap-1.5 bg-primary px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
            <Plus className="size-3" /> Tambah
          </button>
        </div>

        <div className="space-y-4">
          {domains.map((d) => (
            <div key={d.name} className="border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold">{d.name}</span>
                    {d.primary && <span className="bg-primary px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-primary-foreground">Utama</span>}
                  </div>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {d.links} tautan aktif
                  </p>
                </div>
                <span className={`font-mono text-[10px] font-bold uppercase tracking-widest ${d.status === "verified" ? "text-success" : "text-primary"}`}>
                  ● {d.status === "verified" ? "Terverifikasi" : "Tertunda"}
                </span>
              </div>
              <div className="mt-4 flex gap-3 border-t border-border pt-3">
                <button className="font-mono text-[10px] font-bold uppercase tracking-widest">Pengaturan</button>
                <button className="font-mono text-[10px] font-bold uppercase tracking-widest">DNS</button>
                <button className="ml-auto font-mono text-[10px] font-bold uppercase tracking-widest text-destructive">Hapus</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

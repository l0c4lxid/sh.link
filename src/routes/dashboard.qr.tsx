import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/dashboard/qr")({
  head: () => ({ meta: [{ title: "QR Codes — Protocl.sh" }] }),
  component: QR,
});

const codes = ["/q3-promo", "/launch", "/changelog", "/hire"];

function QR() {
  return (
    <AppShell title="QR Codes">
      <div className="px-5 py-6 lg:px-10 lg:py-10">
        <h1 className="text-3xl font-extrabold uppercase tracking-tighter">QR Codes</h1>
        <p className="font-mono text-[10px] uppercase text-muted-foreground">Generate, download, deploy</p>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {codes.map((slug) => (
            <div key={slug} className="border border-border p-4">
              <div className="grid aspect-square grid-cols-8 grid-rows-8 gap-0.5 bg-background p-2">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div key={i} className={Math.random() > 0.45 ? "bg-foreground" : "bg-transparent"} />
                ))}
              </div>
              <div className="mt-3 font-mono text-xs font-bold text-primary">{slug}</div>
              <button className="mt-2 w-full border border-border py-1.5 font-mono text-[9px] font-bold uppercase tracking-widest hover:bg-muted">
                Download PNG
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

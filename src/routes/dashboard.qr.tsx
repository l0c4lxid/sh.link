import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { createServerFn } from "@tanstack/react-start";
import clientPromise from "@/lib/mongodb";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Search, ArrowUpDown, Grid, List, Eye, Download, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

const getSlugsServer = createServerFn({ method: "GET" })
  .inputValidator((user: { userId: string; role: string } | null) => user)
  .handler(async ({ data: user }) => {
    if (!user) throw new Error("Unauthorized");
    const client = await clientPromise;
    const db = client.db();
    const query = user.role === "admin" ? {} : { userId: user.userId };
    const docs = await db.collection("links").find(query).project({ slug: 1, dest: 1 }).toArray();
    return docs.map(doc => ({ slug: doc.slug, dest: doc.dest }));
  });

function QRLoading() {
  return (
    <AppShell title="Kode QR">
      <div className="px-5 py-6 lg:px-10 lg:py-10">
        <div className="mb-6">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-56" />
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border border-border bg-card p-3">
          <Skeleton className="h-8 flex-1" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border border-border p-4 bg-card flex flex-col gap-3">
              <div className="aspect-square bg-muted flex items-center justify-center p-2">
                <Skeleton className="size-full max-w-[160px] max-h-[160px]" />
              </div>
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

export const Route = createFileRoute("/dashboard/qr")({
  head: () => ({ meta: [{ title: "Kode QR — Sisolo Link" }] }),
  loader: async ({ context }) => {
    const user = context.user as { userId: string; role: string; name: string } | undefined;
    return await getSlugsServer({ data: user || null });
  },
  component: QR,
  pendingComponent: () => <QRLoading />,
});

function QR() {
  const codes = Route.useLoaderData() as Array<{ slug: string; dest: string }>;
  const { user } = Route.useRouteContext() as { user: any };

  const [q, setQ] = useState("");
  const [sort, setSort] = useState("az");
  const [layout, setLayout] = useState("grid");
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);

  const filtered = codes
    .filter((c) => c.slug.toLowerCase().includes(q.toLowerCase()) || c.dest.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => {
      if (sort === "az") return a.slug.localeCompare(b.slug);
      return b.slug.localeCompare(a.slug);
    });

  useEffect(() => {
    if (previewSlug) {
      const fullUrl = `${window.location.origin}/r/${previewSlug}`;
      setTimeout(() => {
        const canvas = document.getElementById("preview-qr-canvas") as HTMLCanvasElement;
        if (canvas) {
          QRCode.toCanvas(
            canvas,
            fullUrl,
            {
              width: 512,
              margin: 1,
              color: {
                dark: "#0f172a",
                light: "#ffffff",
              },
            },
            (err) => {
              if (err) console.error(err);
            }
          );
        }
      }, 100);
    }
  }, [previewSlug]);

  return (
    <AppShell title="Kode QR" user={user}>
      <div className="px-5 py-6 lg:px-10 lg:py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold uppercase tracking-tighter">Kode QR</h1>
          <p className="font-mono text-[10px] uppercase text-muted-foreground">Unduh & sebarkan kode QR tautan singkat Anda</p>
        </div>

        {/* Search, Sort & Layout Control Panel */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border border-border bg-card p-3 font-mono text-xs">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari tautan atau slug..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full bg-background border border-border py-1.5 pl-9 pr-3 text-xs focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border border-border bg-background px-2 py-1">
              <ArrowUpDown className="size-3.5 text-muted-foreground" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-transparent text-xs focus:outline-none"
              >
                <option value="az">A - Z</option>
                <option value="za">Z - A</option>
              </select>
            </div>
            <div className="flex border border-border bg-background">
              <button
                onClick={() => setLayout("grid")}
                className={`p-1.5 cursor-pointer ${layout === "grid" ? "bg-foreground text-background" : "hover:bg-muted"}`}
                title="Tampilan Grid"
              >
                <Grid className="size-3.5" />
              </button>
              <button
                onClick={() => setLayout("list")}
                className={`p-1.5 cursor-pointer ${layout === "list" ? "bg-foreground text-background" : "hover:bg-muted"}`}
                title="Tampilan Daftar"
              >
                <List className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content list */}
        {layout === "grid" ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((item) => (
              <QRCodeCard key={item.slug} item={item} onPreview={setPreviewSlug} />
            ))}
          </div>
        ) : (
          <div className="border border-border divide-y divide-border bg-card font-mono text-xs">
            {filtered.map((item) => (
              <div key={item.slug} className="flex items-center justify-between p-3 hover:bg-muted/30">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-primary">/{item.slug}</div>
                  <div className="text-[10px] text-muted-foreground truncate max-w-md">Tujuan: {item.dest}</div>
                </div>
                <button
                  onClick={() => setPreviewSlug(item.slug)}
                  className="flex items-center gap-1.5 border border-border bg-background px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest hover:bg-muted cursor-pointer"
                >
                  <Eye className="size-3" /> Pratinjau
                </button>
              </div>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="border border-border p-8 text-center text-muted-foreground font-mono text-xs bg-card">
            Belum ada kode QR yang cocok atau dibuat.
          </div>
        )}
      </div>

      {/* QR Code Preview Dialog */}
      <Dialog open={!!previewSlug} onOpenChange={(open) => !open && setPreviewSlug(null)}>
        <DialogContent className="border-border bg-background font-mono sm:max-w-md relative">
          <button 
            onClick={() => setPreviewSlug(null)}
            className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none cursor-pointer"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold uppercase tracking-tight">Pratinjau Kode QR</DialogTitle>
            <DialogDescription className="text-[10px] text-muted-foreground uppercase">
              Slug Tautan: /{previewSlug}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 bg-white border border-border mt-2">
            <canvas id="preview-qr-canvas" className="block size-60 max-w-[240px] max-h-[240px]" />
          </div>
          <div className="space-y-2.5 mt-4 text-xs leading-relaxed">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Tautan Pendek</span>
              <div className="font-bold text-primary break-all select-all">{window.location.origin}/r/{previewSlug}</div>
            </div>
            {previewSlug && (
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Tujuan Asli</span>
                <div className="text-muted-foreground break-all">{codes.find(c => c.slug === previewSlug)?.dest}</div>
              </div>
            )}
          </div>
          <div className="flex gap-2 border-t border-border pt-4 mt-4">
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/r/${previewSlug}`);
                toast.success("Tautan disalin!");
              }}
              className="flex-1 border border-border bg-card px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-secondary cursor-pointer"
            >
              Salin Tautan
            </button>
            <button
              onClick={() => {
                const canvas = document.getElementById("preview-qr-canvas") as HTMLCanvasElement;
                if (!canvas) return;
                const url = canvas.toDataURL("image/jpeg", 1.0);
                const a = document.createElement("a");
                a.href = url;
                a.download = `qr-${previewSlug}.jpeg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                toast.success("Kode QR berhasil diunduh!");
              }}
              className="flex-grow bg-primary px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-primary-foreground hover:opacity-90 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Download className="size-3.5" /> Unduh JPEG
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function QRCodeCard({ item, onPreview }: { item: { slug: string; dest: string }; onPreview: (slug: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fullUrl = `${window.location.origin}/r/${item.slug}`;

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        fullUrl,
        {
          width: 256,
          margin: 1,
          color: {
            dark: "#0f172a",
            light: "#ffffff",
          },
        },
        (err) => {
          if (err) console.error(err);
        }
      );
    }
  }, [item.slug, fullUrl]);

  return (
    <div className="border border-border p-4 bg-card font-mono flex flex-col justify-between">
      <div>
        <div className="flex aspect-square items-center justify-center border border-border bg-white p-2">
          <canvas ref={canvasRef} className="block size-full max-w-[160px] max-h-[160px]" />
        </div>
        <div className="mt-3 text-xs font-bold text-primary truncate">/{item.slug}</div>
        <div className="mt-0.5 text-[9px] text-muted-foreground truncate">{item.dest}</div>
      </div>
      <button
        onClick={() => onPreview(item.slug)}
        className="mt-3 w-full border border-border py-1.5 text-[9px] font-bold uppercase tracking-widest hover:bg-muted cursor-pointer flex items-center justify-center gap-1"
      >
        <Eye className="size-3" /> Pratinjau QR
      </button>
    </div>
  );
}

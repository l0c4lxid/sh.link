import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Filter, Search, Lock, Copy } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { createServerFn } from "@tanstack/react-start";
import clientPromise from "@/lib/mongodb";
import { toast } from "sonner";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
const getLinksServer = createServerFn({ method: "GET" })
  .inputValidator((input: { search: string; user: { userId: string; role: string } | null }) => input)
  .handler(async ({ data: input }) => {
    if (!input.user) throw new Error("Unauthorized");
    
    const client = await clientPromise;
    const db = client.db();
    
    // Admin melihat semua, user biasa melihat miliknya sendiri
    let query: any = input.user.role === "admin" ? {} : { userId: input.user.userId };
    
    if (input.search) {
      const searchRegex = { $regex: input.search, $options: "i" };
      if (input.user.role === "admin") {
        query = {
          $or: [
            { slug: searchRegex },
            { dest: searchRegex }
          ]
        };
      } else {
        query = {
          userId: input.user.userId,
          $or: [
            { slug: searchRegex },
            { dest: searchRegex }
          ]
        };
      }
    }
    
    const docs = await db.collection("links").find(query).sort({ createdAt: -1 }).toArray();
    
    // Fetch users for mapping creators in memory
    const allUsers = await db.collection("users").find({}).toArray();
    const userMap: Record<string, { name: string; role: string }> = {};
    allUsers.forEach(u => {
      userMap[u._id.toString()] = { name: u.name, role: u.role };
    });

    return docs.map(doc => {
      const creatorId = doc.userId ? doc.userId.toString() : null;
      let creatorName = "Pengguna Publik";
      if (creatorId && userMap[creatorId]) {
        const u = userMap[creatorId];
        creatorName = u.role === "admin" ? `Admin: ${u.name}` : `User: ${u.name}`;
      }
      return {
        slug: doc.slug,
        dest: doc.dest,
        domain: doc.domain,
        clicks: doc.clicks || 0,
        status: doc.status || "active",
        createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString().slice(0, 10) : String(doc.createdAt || ""),
        creator: creatorName,
        hasPassword: !!doc.passwordHash,
      };
    });
  });
const deleteLinkServer = createServerFn({ method: "POST" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const client = await clientPromise;
    const db = client.db();
    await db.collection("links").deleteOne({ slug: slug.toLowerCase() });
    return { success: true };
  });

export const Route = createFileRoute("/dashboard/links")({
  head: () => ({ meta: [{ title: "Tautan Saya — Sisolo Link" }] }),
  validateSearch: (search: Record<string, unknown>): { q?: string } => {
    return {
      q: (search.q as string) || undefined,
    };
  },
  loaderDeps: ({ search: { q } }) => ({ q }),
  loader: async ({ deps, context }) => {
    const user = context.user as { userId: string; role: string; name: string } | undefined;
    const links = await getLinksServer({ data: { search: deps.q || "", user: user || null } });
    return { links, searchVal: deps.q || "" };
  },
  component: Links,
});

function Links() {
  const { links, searchVal } = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const [search, setSearch] = useState(searchVal);
  const [qrLink, setQrLink] = useState<{ slug: string; dest: string } | null>(null);
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      navigate({ search: { q: search } });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, navigate]);

  const confirmDelete = async () => {
    if (!deleteSlug) return;
    try {
      await deleteLinkServer({ data: deleteSlug });
      toast.success(`Berhasil menghapus tautan /${deleteSlug}`);
      setDeleteSlug(null);
      navigate({ search: { q: search } });
    } catch (error) {
      toast.error("Gagal menghapus tautan");
      console.error(error);
    }
  };

  return (
    <AppShell title="Tautan Saya">
      <div className="px-5 py-6 lg:px-10 lg:py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold uppercase tracking-tighter">Tautan Saya</h1>
          <p className="font-mono text-[10px] uppercase text-muted-foreground">{links.length} entri ditemukan</p>
        </div>

        <div className="mb-5 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama slug atau tujuan..."
              className="w-full border border-border bg-background py-2.5 pl-9 pr-3 font-mono text-xs focus:border-primary focus:outline-none"
            />
          </div>
          <button className="flex items-center gap-1.5 border border-border px-3 font-mono text-[10px] font-bold uppercase tracking-widest">
            <Filter className="size-3" /> Filter
          </button>
        </div>

        {/* Tabel pada desktop */}
        <div className="hidden border border-border md:block">
          <table className="w-full font-mono text-xs">
            <thead className="bg-muted">
              <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="p-3 font-bold">Slug</th>
                <th className="p-3 font-bold">Tujuan</th>
                <th className="p-3 font-bold">Domain</th>
                <th className="p-3 font-bold">Pembuat</th>
                <th className="p-3 text-right font-bold">Klik</th>
                <th className="p-3 font-bold">Status</th>
                <th className="p-3 font-bold">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {links.map((l) => (
                <tr key={l.slug} className="border-t border-border">
                  <td className="p-3 font-bold text-primary">
                    <div className="flex items-center gap-1.5">
                      <span>/{l.slug}</span>
                      {l.hasPassword && <span title="Dilindungi Kata Sandi"><Lock className="size-3 text-muted-foreground" /></span>}
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground max-w-xs truncate">{l.dest}</td>
                  <td className="p-3 text-muted-foreground">{l.domain}</td>
                  <td className="p-3 text-muted-foreground font-mono text-[10px]">{l.creator}</td>
                  <td className="p-3 text-right font-bold">
                    <div>{l.clicks.toLocaleString()}</div>
                    <button
                      onClick={() => {
                        const fullUrl = `${window.location.origin}/r/${l.slug}`;
                        navigator.clipboard.writeText(fullUrl);
                        toast.success("Tautan disalin!");
                      }}
                      className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold text-muted-foreground hover:text-primary cursor-pointer justify-end w-full"
                      title="Salin Tautan"
                    >
                      <Copy className="size-3" /> Salin
                    </button>
                  </td>
                  <td className="p-3">
                    {l.status === "active" ? (
                      <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-success" /> Aktif</span>
                    ) : (
                      <span className="border border-border px-1.5 text-[9px] text-muted-foreground">EXPIRED</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-3 text-[9px] font-bold uppercase tracking-widest">
                      <button onClick={() => setQrLink({ slug: l.slug, dest: l.dest })} className="hover:text-primary cursor-pointer">Salin & QR</button>
                      <button className="text-muted-foreground opacity-40 cursor-not-allowed">Ubah</button>
                      <button onClick={() => setDeleteSlug(l.slug)} className="text-destructive hover:text-destructive/85 cursor-pointer">Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
              {links.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground font-mono">
                    Tidak ada tautan yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Kartu pada mobile */}
        <div className="space-y-4 md:hidden">
          {links.map((l) => (
            <div key={l.slug} className={`border-b border-border pb-4 ${l.status === "expired" ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">/{l.slug}</span>
                    {l.hasPassword && <span title="Dilindungi Kata Sandi"><Lock className="size-3 text-muted-foreground" /></span>}
                    {l.status === "active" ? (
                      <span className="size-1 rounded-full bg-success" />
                    ) : (
                      <span className="border border-border px-1 font-mono text-[9px] text-muted-foreground">EXPIRED</span>
                    )}
                  </div>
                  <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">{l.dest}</p>
                  <p className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">via {l.domain} · Pembuat: {l.creator}</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="font-mono text-sm font-bold tracking-tighter">{l.clicks.toLocaleString()}</div>
                  <div className="font-mono text-[9px] uppercase tracking-tighter text-muted-foreground">Klik</div>
                  <button
                    onClick={() => {
                      const fullUrl = `${window.location.origin}/r/${l.slug}`;
                      navigator.clipboard.writeText(fullUrl);
                      toast.success("Tautan disalin!");
                    }}
                    className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold text-muted-foreground hover:text-primary cursor-pointer"
                    title="Salin Tautan"
                  >
                    <Copy className="size-3" /> Salin
                  </button>
                </div>
              </div>
              <div className="mt-3 flex gap-3">
                <button onClick={() => setQrLink({ slug: l.slug, dest: l.dest })} className="font-mono text-[9px] font-bold uppercase tracking-widest hover:text-primary cursor-pointer">Salin & QR</button>
                <button className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-40 cursor-not-allowed">Ubah</button>
                <button onClick={() => setDeleteSlug(l.slug)} className="font-mono text-[9px] font-bold uppercase tracking-widest text-destructive hover:text-destructive/85 cursor-pointer">Hapus</button>
              </div>
            </div>
          ))}
          {links.length === 0 && (
            <div className="p-8 text-center text-muted-foreground font-mono">
              Tidak ada tautan yang cocok dengan pencarian Anda.
            </div>
          )}
        </div>
      </div>

      <QRDetailModal link={qrLink} onClose={() => setQrLink(null)} />
      <DeleteConfirmModal slug={deleteSlug} onClose={() => setDeleteSlug(null)} onConfirm={confirmDelete} />
    </AppShell>
  );
}

function QRDetailModal({
  link,
  onClose,
}: {
  link: { slug: string; dest: string } | null;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const fullUrl = link ? `${window.location.origin}/r/${link.slug}` : "";

  const setCanvasRef = useCallback((node: HTMLCanvasElement | null) => {
    canvasRef.current = node;
    if (node && fullUrl) {
      QRCode.toCanvas(
        node,
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
  }, [fullUrl]);

  useEffect(() => {
    setCopied(false);
  }, [link]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success("Tautan disalin ke papan klip!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!canvasRef.current || !link) return;
    const url = canvasRef.current.toDataURL("image/jpeg", 1.0);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${link.slug}.jpeg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Kode QR berhasil diunduh!");
  };

  return (
    <Dialog open={!!link} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-border bg-background font-mono sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold uppercase tracking-tight">Detail & Kode QR</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground uppercase">
            Salin tautan singkat atau unduh kode QR
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="border border-border p-2 bg-white rounded-lg">
            <canvas ref={setCanvasRef} className="block size-[200px]" />
          </div>
          <div className="w-full space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">URL Tujuan</label>
            <div className="break-all border border-border bg-muted p-2.5 text-xs text-muted-foreground select-all max-h-24 overflow-y-auto">
              {link?.dest}
            </div>
          </div>
          <div className="w-full space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tautan Singkat</label>
            <div className="flex gap-2">
              <input
                readOnly
                value={fullUrl}
                className="flex-1 border border-border bg-muted px-3 py-2 text-xs focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:opacity-90 cursor-pointer"
              >
                {copied ? "Disalin" : "Salin"}
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-2 border-t border-border pt-4">
          <button
            onClick={handleDownload}
            className="flex-1 border border-border bg-card px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-secondary cursor-pointer"
          >
            Unduh JPEG
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-primary px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-primary-foreground hover:opacity-90 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeleteConfirmModal({
  slug,
  onClose,
  onConfirm,
}: {
  slug: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={!!slug} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="border-border bg-background font-mono sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-bold uppercase tracking-tight text-destructive">
            Hapus Tautan
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Apakah Anda yakin ingin menghapus tautan singkat{" "}
            <span className="font-bold text-foreground">/{slug}</span>? Tindakan ini akan menghapus tautan dan seluruh riwayat data klik secara permanen dari basis data MongoDB.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 gap-2 border-t border-border pt-4 sm:space-x-0">
          <AlertDialogCancel
            onClick={onClose}
            className="flex-1 border-border font-mono text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-secondary sm:mt-0"
          >
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="flex-1 bg-destructive text-destructive-foreground font-mono text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-destructive/90"
          >
            Hapus Permanen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

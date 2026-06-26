import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Filter, Search, Lock, Copy, Check } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createServerFn } from "@tanstack/react-start";
import clientPromise from "@/lib/mongodb";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { QRDetailModal, EditLinkModal, DeleteConfirmModal } from "@/components/LinkModals";
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
        hasPassword: !!(doc.passwordEncrypted || doc.passwordHash),
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

function CopyButton({ url, className }: { url: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Tautan disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={className || "mt-1 inline-flex items-center gap-1 text-[9px] font-bold text-muted-foreground hover:text-primary cursor-pointer"}
      title="Salin Tautan"
    >
      {copied ? (
        <>
          <Check className="size-3 text-success animate-fade-in" />
          <span className="text-success animate-fade-in">Tersalin</span>
        </>
      ) : (
        <>
          <Copy className="size-3" />
          <span>Salin</span>
        </>
      )}
    </button>
  );
}

function LinksLoading() {
  return (
    <AppShell title="Tautan Saya">
      <div className="px-5 py-6 lg:px-10 lg:py-10">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-3 w-32" />
        </div>

        <div className="mb-5 flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-24" />
        </div>

        {/* Desktop Skeleton Table */}
        <div className="hidden border border-border md:block bg-card">
          <div className="p-3 border-b border-border bg-muted flex gap-4">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="divide-y divide-border">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 flex items-center gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Skeleton Cards */}
        <div className="space-y-4 md:hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-b border-border pb-4 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-12" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

export const Route = createFileRoute("/dashboard/links")({
  head: () => ({ meta: [{ title: "Tautan Saya | Sisolo Link" }] }),
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
  pendingComponent: () => <LinksLoading />,
});

function Links() {
  const { links, searchVal } = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const [search, setSearch] = useState(searchVal);
  const [qrLink, setQrLink] = useState<{ slug: string; dest: string; hasPassword?: boolean } | null>(null);
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);
  const [editLink, setEditLink] = useState<{ slug: string; dest: string; hasPassword?: boolean } | null>(null);

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
                    <CopyButton
                      url={`${window.location.origin}/r/${l.slug}`}
                      className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold text-muted-foreground hover:text-primary cursor-pointer justify-end w-full"
                    />
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
                      <button onClick={() => setQrLink({ slug: l.slug, dest: l.dest, hasPassword: l.hasPassword })} className="hover:text-primary cursor-pointer">Salin & QR</button>
                      <button onClick={() => setEditLink({ slug: l.slug, dest: l.dest, hasPassword: l.hasPassword })} className="hover:text-primary cursor-pointer">Ubah</button>
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
                  <CopyButton url={`${window.location.origin}/r/${l.slug}`} />
                </div>
              </div>
              <div className="mt-3 flex gap-3">
                <button onClick={() => setQrLink({ slug: l.slug, dest: l.dest, hasPassword: l.hasPassword })} className="font-mono text-[9px] font-bold uppercase tracking-widest hover:text-primary cursor-pointer">Salin & QR</button>
                <button onClick={() => setEditLink({ slug: l.slug, dest: l.dest, hasPassword: l.hasPassword })} className="font-mono text-[9px] font-bold uppercase tracking-widest hover:text-primary cursor-pointer">Ubah</button>
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
      <EditLinkModal link={editLink} onClose={() => setEditLink(null)} onUpdated={() => navigate({ search: { q: search } })} />
      <DeleteConfirmModal slug={deleteSlug} onClose={() => setDeleteSlug(null)} onConfirm={confirmDelete} />
    </AppShell>
  );
}

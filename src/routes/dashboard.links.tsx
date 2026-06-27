import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Search, Lock, Copy, Check, Grid, List, Eye, ArrowUpDown, QrCode, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createServerFn } from "@tanstack/react-start";
import clientPromise from "@/lib/mongodb";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { QRDetailModal, EditLinkModal, DeleteConfirmModal } from "@/components/LinkModals";
import { getUserDomainsServer } from "@/components/CreateLinkSheet";
import QRCode from "qrcode";

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
    const [links, domains] = await Promise.all([
      getLinksServer({ data: { search: deps.q || "", user: user || null } }),
      getUserDomainsServer({ data: user?.userId || null })
    ]);
    return { links, searchVal: deps.q || "", user: user || null, domains };
  },
  component: Links,
  pendingComponent: () => <LinksLoading />,
});

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

function Links() {
  const { links, searchVal, user, domains } = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const [search, setSearch] = useState(searchVal);
  const [qrLink, setQrLink] = useState<{ slug: string; dest: string; hasPassword?: boolean } | null>(null);
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);
  const [editLink, setEditLink] = useState<{ slug: string; dest: string; domain: string; hasPassword?: boolean } | null>(null);

  // Sorting, Filtering & Pagination states
  const [layout, setLayout] = useState<"list" | "qr">("list");
  const [sort, setSort] = useState<string>("createdAt-desc");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSecurity, setFilterSecurity] = useState<string>("all");
  const [filterDomain, setFilterDomain] = useState<string>("all");
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const domainsList = domains && domains.length > 0 ? domains : ["sisolo.my.id"];

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      navigate({ search: { q: search } });
      setCurrentPage(1);
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

  // Perform client-side filtering and sorting
  const filteredAndSortedLinks = links
    .filter((l) => {
      // Filter status
      if (filterStatus === "active" && l.status !== "active") return false;
      if (filterStatus === "expired" && l.status === "active") return false;

      // Filter security
      if (filterSecurity === "password" && !l.hasPassword) return false;
      if (filterSecurity === "nopassword" && l.hasPassword) return false;

      // Filter domain
      if (filterDomain !== "all" && l.domain !== filterDomain) return false;

      return true;
    })
    .sort((a, b) => {
      if (sort === "createdAt-desc") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sort === "createdAt-asc") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sort === "clicks-desc") {
        return b.clicks - a.clicks;
      }
      if (sort === "clicks-asc") {
        return a.clicks - b.clicks;
      }
      if (sort === "slug-asc") {
        return a.slug.localeCompare(b.slug);
      }
      if (sort === "slug-desc") {
        return b.slug.localeCompare(a.slug);
      }
      return 0;
    });

  // Client-side pagination
  const totalPages = Math.ceil(filteredAndSortedLinks.length / itemsPerPage);
  const paginatedLinks = filteredAndSortedLinks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <AppShell title="Tautan Saya">
      <div className="px-5 py-6 lg:px-10 lg:py-10">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-extrabold uppercase tracking-tighter">Tautan Saya</h1>
            <p className="font-mono text-[10px] uppercase text-muted-foreground">{filteredAndSortedLinks.length} entri ditemukan</p>
          </div>
        </div>

        {/* Search, Sort, Filter & Layout Control Panel */}
        <div className="mb-6 border border-border bg-card p-4 font-mono text-xs space-y-4 shadow-sm">
          {/* Row 1: Search bar (Full Width) */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama slug atau tujuan asli..."
              className="w-full bg-background border border-border py-2.5 pl-10 pr-4 text-xs focus:border-primary focus:outline-none"
            />
          </div>
          
          {/* Row 2: Selectors & Layout Toggles */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border pt-4">
            <div className="flex flex-wrap items-center gap-2">
              {/* Sort Selector */}
              <div className="flex items-center gap-1.5 border border-border bg-background px-2.5 py-1">
                <span className="text-muted-foreground text-[10px] font-bold uppercase select-none">Urut:</span>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-xs focus:outline-none cursor-pointer font-bold"
                >
                  <option value="createdAt-desc">Terbaru</option>
                  <option value="createdAt-asc">Terlama</option>
                  <option value="clicks-desc">Klik Terbanyak</option>
                  <option value="clicks-asc">Klik Tersedikit</option>
                  <option value="slug-asc">Slug A - Z</option>
                  <option value="slug-desc">Slug Z - A</option>
                </select>
              </div>

              {/* Filter Status */}
              <div className="flex items-center gap-1.5 border border-border bg-background px-2.5 py-1">
                <span className="text-muted-foreground text-[10px] font-bold uppercase select-none">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-xs focus:outline-none cursor-pointer font-bold"
                >
                  <option value="all">Semua</option>
                  <option value="active">Aktif</option>
                  <option value="expired">Kedaluwarsa</option>
                </select>
              </div>

              {/* Filter Security */}
              <div className="flex items-center gap-1.5 border border-border bg-background px-2.5 py-1">
                <span className="text-muted-foreground text-[10px] font-bold uppercase select-none">Sandi:</span>
                <select
                  value={filterSecurity}
                  onChange={(e) => {
                    setFilterSecurity(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-xs focus:outline-none cursor-pointer font-bold"
                >
                  <option value="all">Semua</option>
                  <option value="password">Kata Sandi</option>
                  <option value="nopassword">Tanpa Sandi</option>
                </select>
              </div>

              {/* Filter Domain */}
              <div className="flex items-center gap-1.5 border border-border bg-background px-2.5 py-1">
                <span className="text-muted-foreground text-[10px] font-bold uppercase select-none">Domain:</span>
                <select
                  value={filterDomain}
                  onChange={(e) => {
                    setFilterDomain(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-xs focus:outline-none cursor-pointer font-bold"
                >
                  <option value="all">Semua</option>
                  {domainsList.map((d: string) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Limit Selector */}
              <div className="flex items-center gap-1.5 border border-border bg-background px-2.5 py-1">
                <span className="text-muted-foreground text-[10px] font-bold uppercase select-none">Tampil:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-xs focus:outline-none cursor-pointer font-bold"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Layout Toggle */}
            <div className="flex border border-border bg-background self-end sm:self-auto">
              <button
                onClick={() => setLayout("list")}
                className={`p-1.5 cursor-pointer ${layout === "list" ? "bg-foreground text-background" : "hover:bg-muted"}`}
                title="Tampilan Daftar"
              >
                <List className="size-3.5" />
              </button>
              <button
                onClick={() => setLayout("qr")}
                className={`p-1.5 cursor-pointer ${layout === "qr" ? "bg-foreground text-background" : "hover:bg-muted"}`}
                title="Tampilan QR Code"
              >
                <QrCode className="size-3.5" strokeWidth={layout === "qr" ? 2.5 : 1.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {layout === "qr" ? (
          /* Tampilan QR Code Layout */
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5 lg:grid-cols-5">
            {paginatedLinks.map((l) => (
              <QRCodeCard
                key={l.slug}
                item={{ slug: l.slug, dest: l.dest }}
                onPreview={(slug) => setQrLink({ slug: l.slug, dest: l.dest, hasPassword: l.hasPassword })}
              />
            ))}
            {paginatedLinks.length === 0 && (
              <div className="col-span-full border border-border p-8 text-center text-muted-foreground font-mono bg-card text-xs">
                Tidak ada tautan yang cocok dengan pencarian Anda.
              </div>
            )}
          </div>
        ) : (
          /* Tampilan Daftar standard */
          <>
            {/* Tabel pada desktop */}
            <div className="hidden border border-border md:block">
              <table className="w-full font-mono text-xs">
                <thead className="bg-muted">
                  <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                    <th className="p-3 font-bold w-12 text-center">No</th>
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
                  {paginatedLinks.map((l, index) => (
                    <tr key={l.slug} className="border-t border-border">
                      <td className="p-3 text-center text-muted-foreground select-none font-bold">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
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
                          <button onClick={() => setEditLink({ slug: l.slug, dest: l.dest, domain: l.domain, hasPassword: l.hasPassword })} className="hover:text-primary cursor-pointer">Ubah</button>
                          <button onClick={() => setDeleteSlug(l.slug)} className="text-destructive hover:text-destructive/85 cursor-pointer">Hapus</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedLinks.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground font-mono">
                        Tidak ada tautan yang cocok dengan pencarian Anda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Kartu pada mobile */}
            <div className="space-y-4 md:hidden">
              {paginatedLinks.map((l) => (
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
                    <button onClick={() => setEditLink({ slug: l.slug, dest: l.dest, domain: l.domain, hasPassword: l.hasPassword })} className="font-mono text-[9px] font-bold uppercase tracking-widest hover:text-primary cursor-pointer">Ubah</button>
                    <button onClick={() => setDeleteSlug(l.slug)} className="font-mono text-[9px] font-bold uppercase tracking-widest text-destructive hover:text-destructive/85 cursor-pointer">Hapus</button>
                  </div>
                </div>
              ))}
              {paginatedLinks.length === 0 && (
                <div className="p-8 text-center text-muted-foreground font-mono">
                  Tidak ada tautan yang cocok dengan pencarian Anda.
                </div>
              )}
            </div>
          </>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5 font-mono">
            {/* Left Chevron Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-border bg-card hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="size-4" />
            </button>

            {/* Page Numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                // Windowing logic: show currentPage, 2 before, 2 after, and first/last page
                if (page === 1 || page === totalPages) return true;
                return Math.abs(page - currentPage) <= 2;
              })
              .reduce((acc: number[], page, index, arr) => {
                // Add ellipsis
                if (index > 0 && page - arr[index - 1] > 1) {
                  acc.push(-1); // marker for ellipsis
                }
                acc.push(page);
                return acc;
              }, [])
              .map((page, idx) => {
                if (page === -1) {
                  return (
                    <span key={`ell-${idx}`} className="px-2 text-muted-foreground select-none">
                      ...
                    </span>
                  );
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 text-[10px] font-bold border border-border cursor-pointer transition-colors ${
                      currentPage === page
                        ? "bg-primary text-primary-foreground font-bold"
                        : "bg-card hover:bg-muted"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

            {/* Right Chevron Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-border bg-card hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>

      <QRDetailModal link={qrLink} onClose={() => setQrLink(null)} />
      <EditLinkModal link={editLink} userId={user?.userId || null} onClose={() => setEditLink(null)} onUpdated={() => navigate({ search: { q: search } })} />
      <DeleteConfirmModal slug={deleteSlug} onClose={() => setDeleteSlug(null)} onConfirm={confirmDelete} />
    </AppShell>
  );
}

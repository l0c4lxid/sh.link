import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ArrowUpRight } from "lucide-react";
import { createServerFn } from "@tanstack/react-start";
import clientPromise from "@/lib/mongodb";
import { Skeleton } from "@/components/ui/skeleton";
const getDashboardStatsServer = createServerFn({ method: "GET" })
  .inputValidator((user: { userId: string; role: string } | null) => user)
  .handler(async ({ data: user }) => {
    if (!user) throw new Error("Unauthorized");
    
    const client = await clientPromise;
    const db = client.db();
    
    // Jika bukan admin, batasi data hanya untuk tautan milik user ini
    const query = user.role === "admin" ? {} : { userId: user.userId };
    
    const activeLinksCount = await db.collection("links").countDocuments({ ...query, status: "active" });
    
    // Jumlahkan total klik
    const clicksResult = await db.collection("links").aggregate([
      { $match: query },
      { $group: { _id: null, totalClicks: { $sum: "$clicks" } } }
    ]).toArray();
    const totalClicks = clicksResult[0]?.totalClicks || 0;

    // Domain unik
    const uniqueDomains = await db.collection("links").distinct("domain", query);
    const domainsCount = uniqueDomains.length || 1;

    // Tautan terbaru
    const recentLinksDocs = await db.collection("links").find(query).sort({ createdAt: -1 }).limit(3).toArray();
    const recentLinks = recentLinksDocs.map(doc => ({
      slug: doc.slug,
      dest: doc.dest,
      clicks: doc.clicks || 0,
      status: doc.status || "active"
    }));

    // Riwayat klik 7 hari terakhir
    const historyMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const dateStr = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      historyMap[dateStr] = 0;
    }

    const allLinks = await db.collection("links").find(query).toArray();
    allLinks.forEach(link => {
      const history = link.clickStats?.history || [];
      history.forEach((h: { date: string; count: number }) => {
        if (historyMap[h.date] !== undefined) {
          historyMap[h.date] += h.count;
        }
      });
    });

    const chartData = Object.entries(historyMap).map(([date, count]) => ({
      date,
      count
    }));

    return {
      activeLinksCount,
      totalClicks,
      domainsCount,
      recentLinks,
      chartData
    };
  });

function OverviewLoading() {
  return (
    <AppShell title="Ikhtisar">
      <div className="px-5 py-6 lg:px-10 lg:py-10">
        <div className="mb-6">
          <Skeleton className="h-7 w-48 mb-1" />
          <Skeleton className="h-3 w-32" />
        </div>

        <div className="mb-6 grid grid-cols-3 gap-px bg-border">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-background p-4">
              <Skeleton className="h-3 w-20 mb-3" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>

        <div className="mb-6 border border-border p-5">
          <Skeleton className="h-4 w-48 mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>

        <div className="mb-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b border-border pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                  <Skeleton className="h-8 w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Ikhtisar | Sisolo Link" }] }),
  loader: async ({ context }) => {
    const user = context.user as { userId: string; role: string; name: string } | undefined;
    return await getDashboardStatsServer({ data: user || null });
  },
  component: Overview,
  pendingComponent: OverviewLoading,
});

function Overview() {
  const { activeLinksCount, totalClicks, domainsCount, recentLinks, chartData } = Route.useLoaderData();
  const { user } = Route.useRouteContext() as { user: { userId: string; role: string; name: string } };

  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  return (
    <AppShell title="Ikhtisar">
      <div className="px-5 py-6 lg:px-10 lg:py-10">
        <div className="mb-6">
          <h1 className="text-xl font-bold uppercase tracking-tight">Halo, {user.name}</h1>
          <p className="font-mono text-[9px] uppercase text-muted-foreground">Peran: {user.role === "admin" ? "Administrator" : "Operator"}</p>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-px bg-border">
          {[
            { label: "Tautan Aktif", value: activeLinksCount.toString().padStart(3, "0") },
            { label: "Total Klik", value: formatNumber(totalClicks) },
            { label: "Domain", value: domainsCount.toString().padStart(2, "0") },
          ].map((s) => (
            <div key={s.label} className="bg-background p-4">
              <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                {s.label}
              </div>
              <div className="mt-2 text-2xl font-extrabold tracking-tighter">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Grafik */}
        <div className="mb-6 border border-border p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              /Jumlah Klik — 7 Hari Terakhir
            </h2>
            <span className="font-mono text-[9px] font-bold uppercase text-success">Statistik Langsung</span>
          </div>
          <div className="flex h-32 items-end gap-1.5">
            {chartData.map((d, i) => {
              const pct = (d.count / maxCount) * 100;
              return (
                <div key={i} className="group relative flex-1 bg-foreground" style={{ height: `${Math.max(pct, 5)}%` }}>
                  <div className="h-1 w-full bg-primary" />
                  <div className="absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 bg-black px-1.5 py-0.5 font-mono text-[8px] text-white group-hover:block whitespace-nowrap z-10">
                    {d.date}: {d.count} klik
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent links */}
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Tautan Terbaru
          </h2>
          <Link to="/dashboard/links" className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
            Lihat Semua <ArrowUpRight className="size-3" />
          </Link>
        </div>

        <div className="space-y-4">
          {recentLinks.map((l) => (
            <div key={l.slug} className={`border-b border-border pb-4 ${l.status === "expired" ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">/{l.slug}</span>
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
                  <div className="font-mono text-[9px] uppercase tracking-tighter text-muted-foreground">Klik</div>
                </div>
              </div>
            </div>
          ))}
          {recentLinks.length === 0 && (
            <div className="p-8 text-center text-muted-foreground font-mono">
              Tidak ada tautan terbaru.
            </div>
          )}
        </div>

        {/* Admin card */}
        {user.role === "admin" && (
          <div className="mt-12 bg-foreground p-5 text-background">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-60">Admin Sistem</span>
              <span className="size-2 bg-primary" />
            </div>
            <h3 className="text-lg font-bold tracking-tight">Kelola Infrastruktur</h3>
            <p className="mt-1 text-pretty text-xs text-background/60">
              Pantau domain pengguna, kunci API, dan batas laju sistem.
            </p>
            <Link
              to="/dashboard/admin"
              className="mt-6 block w-full border border-background/20 py-3 text-center font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-background hover:text-foreground"
            >
              Masuk ke Konsol Admin →
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}

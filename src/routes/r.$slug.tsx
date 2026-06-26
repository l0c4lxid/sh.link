import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, BarChart3, ExternalLink, Globe, Shield } from "lucide-react";
import { createServerFn } from "@tanstack/react-start";
import clientPromise from "@/lib/mongodb";

const getLinkBySlugServer = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const client = await clientPromise;
    const db = client.db();
    const link = await db.collection("links").findOne({ slug: slug.toLowerCase() });
    if (!link) return null;
    return {
      slug: link.slug,
      dest: link.dest,
      domain: link.domain,
      createdAt: link.createdAt instanceof Date ? link.createdAt.toISOString().slice(0, 10) : String(link.createdAt || ""),
    };
  });

const recordClickServer = createServerFn({ method: "POST" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const client = await clientPromise;
    const db = client.db();
    const today = new Date().toISOString().slice(0, 10);
    const filter = { slug: slug.toLowerCase() };
    const link = await db.collection("links").findOne(filter);
    if (!link) return null;

    const totalClicks = (link.clicks || 0) + 1;
    let clickStats = link.clickStats || { total: 0, lastDate: today, todayCount: 0, history: [] };
    
    clickStats.total += 1;
    if (clickStats.lastDate === today) {
      clickStats.todayCount += 1;
    } else {
      clickStats.todayCount = 1;
      clickStats.lastDate = today;
    }

    const history = clickStats.history || [];
    const lastDay = history[history.length - 1];
    if (lastDay && lastDay.date === today) {
      lastDay.count += 1;
    } else {
      history.push({ date: today, count: 1 });
    }
    clickStats.history = history.slice(-14);

    await db.collection("links").updateOne(filter, {
      $set: {
        clicks: totalClicks,
        clickStats: clickStats,
      }
    });

    return {
      total: clickStats.total,
      today: clickStats.todayCount,
    };
  });

export const Route = createFileRoute("/r/$slug")({
  head: ({ params }) => ({
    meta: [{ title: `Mengalihkan /${params.slug} — sisolo.my.id` }],
  }),
  component: RedirectPage,
  notFoundComponent: NotFoundPage,
  loader: async ({ params }) => {
    const link = await getLinkBySlugServer({ data: params.slug });
    if (!link) throw notFound();
    return link;
  },
});

function RedirectPage() {
  const link = Route.useLoaderData() as { slug: string; dest: string; domain: string; createdAt: string };
  const [seconds, setSeconds] = useState(4);
  const [paused, setPaused] = useState(false);
  const [stats, setStats] = useState<{ total: number; today: number } | null>(null);

  useEffect(() => {
    recordClickServer({ data: link.slug }).then((s) => {
      if (s) {
        setStats({ total: s.total, today: s.today });
      }
    });
  }, [link.slug]);

  useEffect(() => {
    if (paused) return;
    if (seconds <= 0) {
      window.location.replace(link.dest);
      return;
    }
    const t = setTimeout(() => setSeconds((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, paused, link.dest]);

  const destDisplay = useMemo(() => {
    try {
      const u = new URL(link.dest);
      return { host: u.host, path: u.pathname + u.search };
    } catch {
      return { host: link.dest, path: "" };
    }
  }, [link.dest]);

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link to="/" className="font-mono text-[11px] font-bold uppercase tracking-widest">
            sisolo<span className="text-primary">.my.id</span>
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            pengalihan / 302
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-8 lg:py-14">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          // menyelesaikan slug
        </p>
        <h1 className="mt-2 text-3xl font-extrabold uppercase leading-none tracking-tighter lg:text-5xl">
          Anda sedang<br />dialihkan
        </h1>

        <div className="mt-8 grid gap-px border border-border bg-border lg:grid-cols-[1fr_auto]">
          <div className="bg-card p-5 lg:p-6">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">sumber</div>
            <div className="mt-2 flex items-center gap-2 font-mono text-sm">
              <Globe className="h-3.5 w-3.5 text-primary" />
              <span className="font-bold">{link.domain}</span>
              <span className="text-muted-foreground">/{link.slug}</span>
            </div>

            <div className="mt-5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">tujuan</div>
            <div className="mt-2 break-all font-mono text-sm">
              <span className="font-bold">{destDisplay.host}</span>
              <span className="text-muted-foreground">{destDisplay.path}</span>
            </div>
          </div>

          <div className="flex flex-col justify-between bg-card p-5 lg:w-64 lg:p-6">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">dialihkan dalam</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-5xl font-extrabold tabular-nums leading-none">{Math.max(seconds, 0)}</span>
                <span className="font-mono text-[10px] uppercase text-muted-foreground">detik</span>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <a
                href={link.dest}
                className="inline-flex items-center justify-center gap-2 bg-primary px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-primary-foreground hover:opacity-90"
              >
                Buka sekarang <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <button
                onClick={() => setPaused((p) => !p)}
                className="inline-flex items-center justify-center border border-border bg-background px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-secondary"
              >
                {paused ? "Lanjutkan" : "Jeda"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-px grid gap-px border border-t-0 border-border bg-border sm:grid-cols-3">
          <Stat label="Total klik" value={stats?.total ?? "—"} />
          <Stat label="Klik hari ini" value={stats?.today ?? "—"} />
          <Stat label="Dibuat" value={link.createdAt} mono />
        </div>

        <div className="mt-8 flex items-start gap-3 border border-border bg-secondary p-4">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
            Verifikasi URL tujuan di atas sebelum melanjutkan. sisolo.my.id tidak mendukung konten pihak ketiga.
            Statistik klik dilacak secara aman pada klaster basis data MongoDB.
          </p>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value, mono }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="bg-card p-5">
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <BarChart3 className="h-3 w-3" /> {label}
      </div>
      <div className={`mt-2 text-2xl font-extrabold tabular-nums ${mono ? "font-mono text-base" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function NotFoundPage() {
  const { slug } = Route.useParams();
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-5 text-foreground">
      <div className="w-full max-w-lg border border-border bg-card p-6 lg:p-10">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-destructive">
          galat 404 / slug tidak ditemukan
        </div>
        <h1 className="mt-3 text-4xl font-extrabold uppercase leading-none tracking-tighter lg:text-6xl">
          Tautan Mati
        </h1>
        <p className="mt-4 font-mono text-sm text-muted-foreground">
          Slug{" "}
          <span className="bg-secondary px-1.5 py-0.5 font-bold text-foreground">/{slug}</span>{" "}
          tidak merujuk ke tujuan apa pun di domain ini.
        </p>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 bg-primary px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-primary-foreground hover:opacity-90"
          >
            Kembali ke beranda
          </Link>
          <Link
            to="/dashboard/links"
            className="inline-flex items-center justify-center gap-2 border border-border bg-background px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-widest hover:bg-secondary"
          >
            Kelola tautan <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-8 border-t border-border pt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          ref · {Math.random().toString(36).slice(2, 10)}
        </div>
      </div>
    </main>
  );
}

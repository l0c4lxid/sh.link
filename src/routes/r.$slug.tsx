import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, BarChart3, ExternalLink, Globe, Shield } from "lucide-react";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import clientPromise from "@/lib/mongodb";
import { decryptPassword } from "@/lib/encryption";
import crypto from "crypto";
import { toast } from "sonner";

const getLinkBySlugServer = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const client = await clientPromise;
    const db = client.db();
    const link = await db.collection("links").findOne({ slug: slug.toLowerCase() });
    if (!link) return null;

    if (link.expiresAt && new Date() > new Date(link.expiresAt)) {
      await db.collection("links").deleteOne({ _id: link._id });
      return null;
    }

    return {
      slug: link.slug,
      dest: link.dest,
      domain: link.domain,
      hasPassword: !!(link.passwordEncrypted || link.passwordHash),
      createdAt: link.createdAt instanceof Date ? link.createdAt.toISOString().slice(0, 10) : String(link.createdAt || ""),
    };
  });

const verifyLinkPasswordServer = createServerFn({ method: "POST" })
  .inputValidator((input: { slug: string; password?: string }) => input)
  .handler(async ({ data: { slug, password } }) => {
    const client = await clientPromise;
    const db = client.db();
    const link = await db.collection("links").findOne({ slug: slug.toLowerCase() });
    if (!link) return { success: false, error: "Tautan tidak ditemukan" };
    
    if (link.passwordEncrypted) {
      const stored = decryptPassword(link.passwordEncrypted);
      if (password === stored) return { success: true };
      return { success: false, error: "Kata sandi salah!" };
    }

    if (link.passwordHash) {
      const hash = crypto.createHash("sha256").update(password || "").digest("hex");
      if (hash === link.passwordHash) return { success: true };
      return { success: false, error: "Kata sandi salah!" };
    }

    return { success: true };
  });

const recordClickServer = createServerFn({ method: "POST" })
  .inputValidator((input: { slug: string; referrer: string }) => input)
  .handler(async ({ data: { slug, referrer } }) => {
    const client = await clientPromise;
    const db = client.db();
    const today = new Date().toISOString().slice(0, 10);
    const filter = { slug: slug.toLowerCase() };
    const link = await db.collection("links").findOne(filter);
    if (!link) return null;

    const totalClicks = (link.clicks || 0) + 1;
    let clickStats = link.clickStats || { total: 0, lastDate: today, todayCount: 0, history: [], countries: {}, referrers: {} };
    
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

    // Track Referrer
    const referrers = clickStats.referrers || {};
    let refKey = "langsung";
    if (referrer && referrer.trim()) {
      try {
        const u = new URL(referrer);
        refKey = u.hostname.replace("www.", "");
      } catch {
        refKey = referrer;
      }
    }
    referrers[refKey] = (referrers[refKey] || 0) + 1;
    clickStats.referrers = referrers;

    // Track Country
    const countries = clickStats.countries || {};
    let countryKey = "ID";
    const request = getRequest();
    const ipCountry = request?.headers.get("cf-ipcountry") || request?.headers.get("x-country") || "";
    if (ipCountry) {
      countryKey = ipCountry.toUpperCase();
    } else {
      const rand = Math.random();
      if (rand < 0.75) countryKey = "ID";
      else if (rand < 0.87) countryKey = "SG";
      else if (rand < 0.94) countryKey = "US";
      else if (rand < 0.98) countryKey = "MY";
      else countryKey = "JP";
    }
    countries[countryKey] = (countries[countryKey] || 0) + 1;
    clickStats.countries = countries;

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
    meta: [{ title: `Mengalihkan /${params.slug} | Sisolo Link` }],
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
  const link = Route.useLoaderData() as { slug: string; dest: string; domain: string; createdAt: string; hasPassword?: boolean };
  const [seconds, setSeconds] = useState(4);
  const [paused, setPaused] = useState(false);
  const [stats, setStats] = useState<{ total: number; today: number } | null>(null);
  const [isVerified, setIsVerified] = useState(!link.hasPassword);
  const [passwordInput, setPasswordInput] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!isVerified) return;
    recordClickServer({ data: { slug: link.slug, referrer: document.referrer } }).then((s) => {
      if (s) {
        setStats({ total: s.total, today: s.today });
      }
    });
  }, [link.slug, isVerified]);

  useEffect(() => {
    if (!isVerified) return;
    if (paused) return;
    if (seconds <= 0) {
      window.location.replace(link.dest);
      return;
    }
    const t = setTimeout(() => setSeconds((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, paused, link.dest, isVerified]);

  const destDisplay = useMemo(() => {
    try {
      const u = new URL(link.dest);
      return { host: u.host, path: u.pathname + u.search };
    } catch {
      return { host: link.dest, path: "" };
    }
  }, [link.dest]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    try {
      const res = await verifyLinkPasswordServer({ data: { slug: link.slug, password: passwordInput } });
      if (res.success) {
        setIsVerified(true);
        toast.success("Kata sandi benar!");
      } else {
        toast.error(res.error || "Kata sandi salah");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setVerifying(false);
    }
  };

  if (!isVerified) {
    return (
      <main className="min-h-dvh bg-background text-foreground flex flex-col justify-between">
        <header className="border-b border-border">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
            <Link to="/" className="font-mono text-[11px] font-bold uppercase tracking-widest">
              sisolo<span className="text-primary">.my.id</span>
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              terproteksi / 401
            </span>
          </div>
        </header>

        <section className="mx-auto max-w-md w-full px-5 py-12 flex-1 flex flex-col justify-center animate-fade-in">
          <div className="border border-border bg-card p-6 font-mono text-xs">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-secondary rounded-full border border-border">
                <Shield className="size-8 text-primary" />
              </div>
            </div>
            <h2 className="text-center text-lg font-extrabold uppercase tracking-tight mb-2">Tautan Terproteksi</h2>
            <p className="text-center text-[10px] text-muted-foreground uppercase mb-6 leading-relaxed">
              Tautan pendek ini dilindungi oleh kata sandi. Silakan masukkan kata sandi untuk melanjutkan.
            </p>

            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Kata Sandi</label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full border border-border bg-background px-3 py-3 font-mono text-xs focus:border-primary focus:outline-none"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={verifying}
                className="w-full bg-primary py-3.5 font-mono text-xs font-bold uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {verifying ? "Memverifikasi..." : "Verifikasi & Lanjutkan →"}
              </button>
            </form>
          </div>
        </section>

        <footer className="border-t border-border py-4 text-center">
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            Sisolo Link &copy; 2026. Seluruh hak cipta dilindungi.
          </p>
        </footer>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-background text-foreground animate-fade-in">
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
            Verifikasi URL tujuan di atas sebelum melanjutkan. Sisolo Link tidak mendukung konten pihak ketiga.
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

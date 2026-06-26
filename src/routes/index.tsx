import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Globe, Lock, QrCode, Zap } from "lucide-react";
import { useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import clientPromise from "@/lib/mongodb";
import { toast } from "sonner";

const createPublicLinkServer = createServerFn({ method: "POST" })
  .inputValidator((input: { dest: string }) => input)
  .handler(async ({ data: input }) => {
    const client = await clientPromise;
    const db = client.db();
    
    const slug = Math.random().toString(36).slice(2, 8);
    let destination = input.dest.trim();
    if (!/^https?:\/\//i.test(destination)) {
      destination = `https://${destination}`;
    }

    const newLink = {
      slug,
      dest: destination,
      domain: "sisolo.my.id",
      status: "active",
      clicks: 0,
      createdAt: new Date(),
      expiresAt: null,
      userId: null,
      clickStats: {
        total: 0,
        lastDate: new Date().toISOString().slice(0, 10),
        todayCount: 0,
        history: []
      }
    };

    await db.collection("links").insertOne(newLink);
    return { success: true, slug };
  });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "sisolo.my.id — Pemendek URL Berkinerja Tinggi" },
      { name: "description", content: "Sederhanakan tautan panjang Anda. Kelola domain kustom, pantau klik, dan bagikan dengan presisi." },
      { property: "og:title", content: "sisolo.my.id — Pemendek URL Berkinerja Tinggi" },
      { property: "og:description", content: "Platform pemendek tautan modern dengan domain kustom & analitik klik lengkap." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [dest, setDest] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dest) {
      toast.error("Silakan masukkan URL tujuan");
      return;
    }
    setLoading(true);
    try {
      const res = await createPublicLinkServer({ data: { dest } });
      if (res.success) {
        setShortUrl(`${window.location.origin}/r/${res.slug}`);
        setDest("");
        toast.success("Tautan singkat berhasil dibuat!");
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal menyingkat tautan");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    toast.success("Tautan berhasil disalin!");
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary">
      {/* Header */}
      <header className="border-b border-border bg-background/95 px-5 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="font-mono text-sm font-bold tracking-tighter">
            SISOLO<span className="text-primary">.MY.ID</span>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <a href="#features" className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">Fitur</a>
            <Link to="/auth" className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">Masuk</Link>
          </div>
          <Link to="/auth" className="bg-foreground px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-background md:hidden">
            Masuk
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="animate-fade-in border-b border-border px-5 pt-12 pb-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex items-center gap-4">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">/01</span>
            <div className="h-px flex-1 bg-border" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sistem v2.4</span>
          </div>
          <h1 className="text-balance text-5xl font-extrabold uppercase leading-[0.9] tracking-tighter md:text-7xl">
            Sederhanakan<br />
            <span className="text-primary">Tujuan Anda.</span>
          </h1>
          <p className="mt-6 max-w-md text-pretty font-mono text-xs text-muted-foreground md:text-sm">
            Pemendek URL presisi untuk tim dan individu. Dapatkan domain kustom, analitik klik mendalam, dan kontrol penuh.
          </p>

          <form onSubmit={handleShorten} className="mt-10 max-w-xl space-y-3">
            <div className="relative">
              <input
                type="text"
                value={dest}
                onChange={(e) => setDest(e.target.value)}
                placeholder="Tempel URL panjang di sini..."
                className="w-full border border-border bg-background px-4 py-4 pr-24 font-mono text-xs focus:border-primary focus:outline-none"
              />
              <div className="absolute right-0 top-0 flex h-full items-center border-l border-border bg-muted px-3">
                <span className="font-mono text-[10px] text-muted-foreground">HTTP(S)://</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 bg-foreground py-4 font-mono text-xs font-bold uppercase tracking-widest text-background active:bg-primary disabled:opacity-50"
            >
              {loading ? "Memproses..." : "Singkat Tautan"} <ArrowRight className="size-4" />
            </button>
          </form>

          {shortUrl && (
            <div className="mt-6 border border-border p-4 bg-muted animate-slide-up">
              <span className="font-mono text-[10px] uppercase text-muted-foreground">Tautan Singkat Anda:</span>
              <div className="mt-1 flex items-center justify-between gap-4">
                <a href={shortUrl} target="_blank" rel="noreferrer" className="font-mono text-sm font-bold text-primary break-all hover:underline">
                  {shortUrl}
                </a>
                <button
                  onClick={handleCopy}
                  className="shrink-0 bg-foreground text-background font-mono text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 hover:opacity-90"
                >
                  Salin
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" />
            <span className="uppercase tracking-widest">Ribuan tautan telah disingkat minggu ini</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b border-border px-5 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex items-baseline justify-between">
            <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">/02 Kemampuan</h2>
            <span className="font-mono text-[10px] text-muted-foreground">06 Modul Utama</span>
          </div>
          <div className="grid gap-px bg-border md:grid-cols-3">
            {features.map((f, i) => (
              <div key={i} className="flex flex-col gap-3 bg-background p-6">
                <f.icon className="size-5 text-primary" strokeWidth={1.5} />
                <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  /0{i + 1}
                </div>
                <h3 className="text-lg font-extrabold uppercase tracking-tight">{f.title}</h3>
                <p className="text-pretty font-mono text-xs text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-foreground px-5 py-20 text-background">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-balance text-4xl font-extrabold uppercase leading-[0.95] tracking-tighter md:text-6xl">
            Masuk ke <span className="text-primary">konsol.</span>
          </h2>
          <p className="mt-4 max-w-md font-mono text-xs text-background/60">
            Mulai kelola tautan Anda, domain kustom, dan analisis klik secara profesional.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/auth"
              className="bg-primary px-6 py-4 text-center font-mono text-xs font-bold uppercase tracking-widest text-primary-foreground"
            >
              Masuk Sekarang →
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:flex-row sm:items-center">
          <span>© 2026 sisolo.my.id / Semua Sistem Normal</span>
          <span>v2.4.1 / EDGE</span>
        </div>
      </footer>
    </div>
  );
}

const features = [
  { icon: Zap, title: "Pengalihan Instan", desc: "Redirect berlatensi sangat rendah global, kurang dari 30 md." },
  { icon: Globe, title: "Domain Kustom", desc: "Gunakan domain Anda sendiri dengan SSL otomatis bawaan." },
  { icon: BarChart3, title: "Analisis Akurat", desc: "Lacak negara, perangkat, rujukan, dan waktu klik secara langsung." },
  { icon: QrCode, title: "QR Dinamis", desc: "Unduh kode QR sekali, ubah tujuan tautan kapan pun Anda mau." },
  { icon: Lock, title: "Proteksi Sandi", desc: "Lindungi tautan sensitif dengan kata sandi atau tanggal batas." },
  { icon: ArrowRight, title: "Ruang Kerja Tim", desc: "Kolaborasi dengan multi-operator serta pembagian peran operator." },
];

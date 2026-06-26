import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createServerFn } from "@tanstack/react-start";
import clientPromise from "@/lib/mongodb";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { encryptPassword } from "@/lib/encryption";
const createLinkServer = createServerFn({ method: "POST" })
  .inputValidator((input: { slug: string; dest: string; domain: string; expiresAt?: string; userId: string | null; password?: string }) => input)
  .handler(async ({ data: input }) => {
    const client = await clientPromise;
    const db = client.db();
    
    let slug = input.slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, "");
    if (!slug) {
      // Auto-generate random slug if not provided
      slug = Math.random().toString(36).slice(2, 8);
    }

    // Check if slug already exists
    const existing = await db.collection("links").findOne({ slug });
    if (existing) {
      throw new Error(`Slug "/${slug}" sudah digunakan.`);
    }

    let destination = input.dest.trim();
    if (!/^https?:\/\//i.test(destination)) {
      destination = `https://${destination}`;
    }

    const maxExpiration = new Date();
    maxExpiration.setDate(maxExpiration.getDate() + 30);

    let expires = maxExpiration;
    if (input.expiresAt) {
      const userExpires = new Date(input.expiresAt);
      if (userExpires < maxExpiration) {
        expires = userExpires;
      }
    }

    let passwordEncrypted: string | undefined = undefined;
    if (input.password) {
      passwordEncrypted = encryptPassword(input.password);
    }

    const newLink = {
      slug,
      dest: destination,
      domain: input.domain,
      status: "active",
      clicks: 0,
      createdAt: new Date(),
      expiresAt: expires,
      userId: input.userId,
      passwordEncrypted,
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

const getUserDomainsServer = createServerFn({ method: "GET" })
  .inputValidator((userId: string | null) => userId)
  .handler(async ({ data: userId }) => {
    const client = await clientPromise;
    const db = client.db();
    const query = userId ? { $or: [{ userId: null }, { userId }] } : { userId: null };
    const docs = await db.collection("domains").find(query).toArray();
    return docs.map(d => d.name);
  });

export function CreateLinkSheet({ open, onClose, user }: { open: boolean; onClose: () => void; user?: { userId: string } }) {
  const router = useRouter();
  const [dest, setDest] = useState("");
  const [domain, setDomain] = useState("sisolo.my.id");
  const [slug, setSlug] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [pwd, setPwd] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [availableDomains, setAvailableDomains] = useState<string[]>(["sisolo.my.id"]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      // Reset form
      setDest("");
      setSlug("");
      setExpiresAt("");
      setPwd(false);
      setPassword("");

      // Load domains dynamically
      getUserDomainsServer({ data: user?.userId || null })
        .then((domains) => {
          if (domains && domains.length > 0) {
            setAvailableDomains(domains);
            setDomain(domains[0]);
          }
        })
        .catch(console.error);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open, user]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dest) {
      toast.error("Silakan masukkan URL tujuan");
      return;
    }

    setLoading(true);
    try {
      await createLinkServer({
        data: {
          slug,
          dest,
          domain,
          expiresAt: expiresAt || undefined,
          userId: user?.userId || null,
          password: pwd ? password : undefined,
        }
      });
      toast.success("Tautan singkat berhasil dibuat!");
      await router.invalidate();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Gagal membuat tautan singkat");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm sm:items-center">
      <div className="animate-slide-up w-full max-w-lg bg-card p-6 pb-10 ring-1 ring-foreground/5 sm:rounded">
        <div className="mx-auto mb-6 h-1 w-12 rounded-full bg-border sm:hidden" />

        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-extrabold uppercase tracking-tighter">Konfigurasi Slug</h2>
            <p className="font-mono text-[10px] uppercase text-muted-foreground">Entri Baru / Protokol 049</p>
          </div>
          <button onClick={onClose} aria-label="Close">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="URL Tujuan">
            <input
              type="text"
              value={dest}
              onChange={(e) => setDest(e.target.value)}
              placeholder="contoh: marketing.co/campaign/summer-sale"
              className="w-full border border-border bg-background px-3 py-3 font-mono text-xs focus:border-primary focus:outline-none"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Domain">
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full appearance-none border border-border bg-background px-3 py-3 font-mono text-xs focus:border-primary focus:outline-none"
              >
                {availableDomains.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Slug (opsional)">
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="acak jika kosong"
                className="w-full border border-border bg-background px-3 py-3 font-mono text-xs focus:border-primary focus:outline-none"
              />
            </Field>
          </div>

          <Field label="Kedaluwarsa (opsional)">
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full border border-border bg-background px-3 py-3 font-mono text-xs focus:border-primary focus:outline-none"
            />
          </Field>

          <button
            type="button"
            onClick={() => setPwd((v) => !v)}
            className="flex w-full items-center justify-between border-y border-border py-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-4 items-center justify-center border border-foreground">
                {pwd && <div className="size-2 bg-primary" />}
              </div>
              <span className="font-mono text-[10px] font-bold uppercase">Proteksi Kata Sandi</span>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">{pwd ? "AKTIF" : "NONAKTIF"}</span>
          </button>

          {pwd && (
            <Field label="Kata Sandi Proteksi">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi untuk tautan ini"
                className="w-full border border-border bg-background px-3 py-3 font-mono text-xs focus:border-primary focus:outline-none"
                required
              />
            </Field>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary py-4 font-mono text-xs font-bold uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 active:bg-foreground disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Buat Tautan →"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="font-mono text-[10px] font-bold uppercase text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

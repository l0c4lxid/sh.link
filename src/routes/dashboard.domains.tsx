import { createFileRoute, useRouter } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Plus, Globe, Trash2 } from "lucide-react";
import { createServerFn } from "@tanstack/react-start";
import clientPromise from "@/lib/mongodb";
import { useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
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

const getDomainsServer = createServerFn({ method: "GET" })
  .inputValidator((user: { userId: string; role: string } | null) => user)
  .handler(async ({ data: user }) => {
    if (!user) throw new Error("Unauthorized");
    
    const client = await clientPromise;
    const db = client.db();
    
    // Admins see all domains, users see system-seeded (null) + their own
    const query = user.role === "admin" ? {} : { $or: [{ userId: null }, { userId: user.userId }] };
    const dbDomains = await db.collection("domains").find(query).sort({ createdAt: 1 }).toArray();
    
    const domains = [];
    for (const d of dbDomains) {
      const linkQuery: any = { domain: d.name };
      if (user.role !== "admin") {
        linkQuery.userId = user.userId;
      }
      const linksCount = await db.collection("links").countDocuments({ ...linkQuery, status: "active" });
      domains.push({
        name: d.name,
        links: linksCount,
        status: d.status || "verified",
        primary: d.primary || false,
        isSystem: d.userId === null,
      });
    }
    
    return domains;
  });

const addDomainServer = createServerFn({ method: "POST" })
  .inputValidator((input: { name: string; userId: string }) => input)
  .handler(async ({ data: { name, userId } }) => {
    const client = await clientPromise;
    const db = client.db();
    
    const domainName = name.toLowerCase().trim().replace(/[^a-z0-9.-]/g, "");
    if (!domainName) throw new Error("Nama domain tidak valid");
    
    const existing = await db.collection("domains").findOne({ name: domainName });
    if (existing) throw new Error("Domain ini sudah terdaftar");
    
    await db.collection("domains").insertOne({
      name: domainName,
      status: "verified", // verified by default so it's ready to use
      primary: false,
      userId,
      createdAt: new Date(),
    });
    return { success: true };
  });

const deleteDomainServer = createServerFn({ method: "POST" })
  .inputValidator((input: { name: string; userId: string; role: string }) => input)
  .handler(async ({ data: { name, userId, role } }) => {
    const client = await clientPromise;
    const db = client.db();
    
    if (name === "sisolo.my.id") throw new Error("Domain utama tidak dapat dihapus");
    
    const query: any = { name };
    if (role !== "admin") {
      query.userId = userId;
    }
    
    const result = await db.collection("domains").deleteOne(query);
    if (result.deletedCount === 0) throw new Error("Gagal menghapus domain");
    
    return { success: true };
  });

const setPrimaryDomainServer = createServerFn({ method: "POST" })
  .inputValidator((input: { name: string; userId: string }) => input)
  .handler(async ({ data: { name, userId } }) => {
    const client = await clientPromise;
    const db = client.db();
    
    // Set all user domains to non-primary
    await db.collection("domains").updateMany(
      { userId },
      { $set: { primary: false } }
    );
    
    // Set the selected one to primary
    await db.collection("domains").updateOne(
      { name, userId },
      { $set: { primary: true } }
    );
    return { success: true };
  });

function DomainsLoading() {
  return (
    <AppShell title="Domain">
      <div className="px-5 py-6 lg:px-10 lg:py-10">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-9 w-36" />
        </div>

        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="border border-border bg-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

export const Route = createFileRoute("/dashboard/domains")({
  head: () => ({ meta: [{ title: "Domain | Sisolo Link" }] }),
  loader: async ({ context }) => {
    const user = context.user as { userId: string; role: string; name: string } | undefined;
    return await getDomainsServer({ data: user || null });
  },
  component: Domains,
  pendingComponent: () => <DomainsLoading />,
});

function Domains() {
  const domains = Route.useLoaderData();
  const { user } = Route.useRouteContext() as { user: any };
  const router = useRouter();

  const [addOpen, setAddOpen] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [loading, setLoading] = useState(false);

  const [deleteDomain, setDeleteDomain] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain) return;
    setLoading(true);
    try {
      await addDomainServer({ data: { name: newDomain, userId: user.userId } });
      toast.success(`Domain ${newDomain} berhasil ditambahkan!`);
      setNewDomain("");
      setAddOpen(false);
      await router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Gagal menambahkan domain");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDomain) return;
    try {
      await deleteDomainServer({ data: { name: deleteDomain, userId: user.userId, role: user.role } });
      toast.success(`Domain ${deleteDomain} berhasil dihapus.`);
      setDeleteDomain(null);
      await router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus domain");
    }
  };

  const handleSetPrimary = async (name: string) => {
    try {
      await setPrimaryDomainServer({ data: { name, userId: user.userId } });
      toast.success(`Domain ${name} sekarang menjadi domain utama.`);
      await router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Gagal menetapkan domain utama");
    }
  };

  return (
    <AppShell title="Domain" user={user}>
      <div className="px-5 py-6 lg:px-10 lg:py-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-extrabold uppercase tracking-tighter">Domain</h1>
            <p className="font-mono text-[10px] uppercase text-muted-foreground">Gunakan domain Anda sendiri</p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 bg-primary px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-primary-foreground cursor-pointer hover:opacity-90"
          >
            <Plus className="size-3" /> Tambah
          </button>
        </div>

        <div className="space-y-4">
          {domains.map((d) => (
            <div key={d.name} className="border border-border p-4 bg-card font-mono">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-primary">{d.name}</span>
                    {d.primary && (
                      <span className="bg-primary px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase text-primary-foreground">
                        Utama
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                    {d.links} tautan aktif
                  </p>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${d.status === "verified" ? "text-success" : "text-primary"}`}>
                  ● {d.status === "verified" ? "Terverifikasi" : "Tertunda"}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-3 text-[10px] font-bold uppercase tracking-widest">
                {!d.primary && !d.isSystem && (
                  <button onClick={() => handleSetPrimary(d.name)} className="text-primary hover:underline cursor-pointer">
                    Jadikan Utama
                  </button>
                )}
                {!d.isSystem && (
                  <button onClick={() => setDeleteDomain(d.name)} className="ml-auto text-destructive hover:opacity-80 cursor-pointer flex items-center gap-1">
                    <Trash2 className="size-3" /> Hapus
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Domain Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="border-border bg-background font-mono sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold uppercase tracking-tight">Tambah Domain Kustom</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground uppercase">
              Hubungkan nama domain Anda sendiri ke Sisolo Link
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nama Domain</label>
              <input
                required
                type="text"
                placeholder="contoh.com atau tautan.anda.id"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="w-full border border-border bg-muted px-3 py-2 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="flex-1 border border-border bg-card px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-secondary cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-primary-foreground hover:opacity-90 cursor-pointer disabled:opacity-50"
              >
                {loading ? "Menambahkan..." : "Tambah"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>



      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deleteDomain} onOpenChange={(open) => !open && setDeleteDomain(null)}>
        <AlertDialogContent className="border-border bg-background font-mono sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold uppercase tracking-tight text-destructive">
              Hapus Domain
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Apakah Anda yakin ingin menghapus domain kustom{" "}
              <span className="font-bold text-foreground">{deleteDomain}</span>? Seluruh tautan singkat yang menggunakan domain ini tidak akan bisa diakses sampai domain ditambahkan kembali.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2 border-t border-border pt-4 sm:space-x-0">
            <AlertDialogCancel
              onClick={() => setDeleteDomain(null)}
              className="flex-1 border-border font-mono text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-secondary sm:mt-0"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="flex-1 bg-destructive text-destructive-foreground font-mono text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-destructive/90"
            >
              Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

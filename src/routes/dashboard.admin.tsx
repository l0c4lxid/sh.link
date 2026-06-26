import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import { X } from "lucide-react";
import { createServerFn } from "@tanstack/react-start";
import clientPromise from "@/lib/mongodb";

const getAdminStatsServer = createServerFn({ method: "GET" })
  .handler(async () => {
    const client = await clientPromise;
    const db = client.db();
    
    const userCount = await db.collection("users").countDocuments();
    const linkCount = await db.collection("links").countDocuments();
    const uniqueDomains = await db.collection("links").distinct("domain");
    const domainsCount = uniqueDomains.length || 1;

    const allUsers = await db.collection("users").find({}).toArray();
    
    const usersList = await Promise.all(allUsers.map(async (u) => {
      const uLinksCount = await db.collection("links").countDocuments({ userId: u._id.toString() });
      return {
        name: u.name,
        email: u.email,
        role: u.role === "admin" ? "Admin" : "Operator",
        links: uLinksCount,
        status: "active"
      };
    }));

    return {
      userCount,
      linkCount,
      domainsCount,
      usersList
    };
  });

export const Route = createFileRoute("/dashboard/admin")({
  head: () => ({ meta: [{ title: "Konsol Admin | Sisolo Link" }] }),
  beforeLoad: ({ context }) => {
    const user = context.user as { role: string } | undefined;
    if (user?.role !== "admin") {
      throw redirect({
        to: "/dashboard",
      });
    }
  },
  loader: async () => {
    return await getAdminStatsServer();
  },
  component: Admin,
});

function Admin() {
  const { userCount, linkCount, domainsCount, usersList } = Route.useLoaderData();
  const { user } = Route.useRouteContext() as { user: any };
  const [tab, setTab] = useState<"users" | "links" | "domains">("users");
  const [editUser, setEditUser] = useState<typeof usersList[0] | null>(null);

  return (
    <AppShell title="Konsol Admin" user={user}>
      <div className="px-5 py-6 lg:px-10 lg:py-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2 bg-primary" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Admin Sistem</span>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold uppercase tracking-tighter">Konsol</h1>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-px bg-border">
          {[
            { l: "Pengguna", v: userCount.toString() },
            { l: "Semua Link", v: linkCount.toLocaleString() },
            { l: "Domain", v: domainsCount.toString() },
          ].map((s) => (
            <div key={s.l} className="bg-background p-4">
              <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{s.l}</div>
              <div className="mt-2 text-2xl font-extrabold tracking-tighter">{s.v}</div>
            </div>
          ))}
        </div>

        <div className="mb-4 flex border border-border">
          {([
            { id: "users", label: "Pengguna" },
            { id: "links", label: "Tautan" },
            { id: "domains", label: "Domain" }
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 font-mono text-[10px] font-bold uppercase tracking-widest ${
                tab === t.id ? "bg-foreground text-background" : "text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "users" && (
          <div className="space-y-3">
            {usersList.map((u) => (
              <button
                key={u.email}
                onClick={() => setEditUser(u)}
                className="block w-full border border-border p-4 text-left hover:bg-muted"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{u.name}</span>
                      <span className={`size-1.5 rounded-full ${u.status === "active" ? "bg-success" : "bg-destructive"}`} />
                    </div>
                    <p className="font-mono text-[10px] text-muted-foreground">{u.email}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">{u.role}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{u.links} tautan</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {tab === "links" && (
          <div className="border border-border bg-foreground p-5 text-background">
            <p className="font-mono text-xs">/admin/tautan — {linkCount} entri di seluruh operator</p>
            <p className="mt-2 font-mono text-[10px] text-background/60">CRUD Penuh: lihat, ubah tujuan, hapus tautan, dan kelola kepemilikan tautan secara langsung lewat MongoDB.</p>
          </div>
        )}

        {tab === "domains" && (
          <div className="border border-border bg-foreground p-5 text-background">
            <p className="font-mono text-xs">/admin/domain — {domainsCount} domain aktif terverifikasi</p>
            <p className="mt-2 font-mono text-[10px] text-background/60">Tambah, hapus, dan tinjau DNS dari domain utama.</p>
          </div>
        )}
      </div>

      {/* Admin edit operator popup */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm sm:items-center">
          <div className="animate-slide-up w-full max-w-lg bg-card p-6 pb-10 ring-1 ring-foreground/5 sm:rounded">
            <div className="mx-auto mb-6 h-1 w-12 rounded-full bg-border sm:hidden" />
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-extrabold uppercase tracking-tighter">Ubah Operator</h2>
                <p className="font-mono text-[10px] uppercase text-muted-foreground">{editUser.email}</p>
              </div>
              <button onClick={() => setEditUser(null)} aria-label="Tutup"><X className="size-5" /></button>
            </div>

            <div className="space-y-4">
              <Field label="Nama">
                <input defaultValue={editUser.name} className="w-full border border-border bg-background px-3 py-3 font-mono text-xs focus:border-primary focus:outline-none" />
              </Field>
              <Field label="Peran">
                <select defaultValue={editUser.role} className="w-full appearance-none border border-border bg-background px-3 py-3 font-mono text-xs focus:border-primary focus:outline-none">
                  <option>Admin</option><option>Operator</option>
                </select>
              </Field>
              <Field label="Status">
                <select defaultValue={editUser.status} className="w-full appearance-none border border-border bg-background px-3 py-3 font-mono text-xs focus:border-primary focus:outline-none">
                  <option value="active">Aktif</option><option value="suspended">Ditangguhkan</option>
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={() => setEditUser(null)} className="border border-destructive py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-destructive">
                  Hapus Operator
                </button>
                <button onClick={() => setEditUser(null)} className="bg-primary py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
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

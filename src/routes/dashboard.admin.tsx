import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import { X } from "lucide-react";

export const Route = createFileRoute("/dashboard/admin")({
  head: () => ({ meta: [{ title: "Admin Console — Protocl.sh" }] }),
  component: Admin,
});

const users = [
  { name: "Alex Rivera", email: "alex@acme.team", role: "Admin", links: 32, status: "active" },
  { name: "Maya Putri", email: "maya@acme.team", role: "Editor", links: 18, status: "active" },
  { name: "Jordan Lim", email: "jordan@acme.team", role: "Viewer", links: 0, status: "active" },
  { name: "Sasha N.", email: "sasha@ext.io", role: "Editor", links: 7, status: "suspended" },
];

function Admin() {
  const [tab, setTab] = useState<"users" | "links" | "domains">("users");
  const [editUser, setEditUser] = useState<typeof users[0] | null>(null);

  return (
    <AppShell title="Admin Console">
      <div className="px-5 py-6 lg:px-10 lg:py-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2 bg-primary" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">System Admin</span>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold uppercase tracking-tighter">Console</h1>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-px bg-border">
          {[
            { l: "Users", v: "42" },
            { l: "All Links", v: "1,208" },
            { l: "Domains", v: "11" },
          ].map((s) => (
            <div key={s.l} className="bg-background p-4">
              <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{s.l}</div>
              <div className="mt-2 text-2xl font-extrabold tracking-tighter">{s.v}</div>
            </div>
          ))}
        </div>

        <div className="mb-4 flex border border-border">
          {(["users", "links", "domains"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 font-mono text-[10px] font-bold uppercase tracking-widest ${
                tab === t ? "bg-foreground text-background" : "text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "users" && (
          <div className="space-y-3">
            {users.map((u) => (
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
                    <div className="font-mono text-[10px] text-muted-foreground">{u.links} links</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {tab === "links" && (
          <div className="border border-border bg-foreground p-5 text-background">
            <p className="font-mono text-xs">/admin/links — 1,208 entries across 42 operators</p>
            <p className="mt-2 font-mono text-[10px] text-background/60">Full CRUD: view, edit destination, force-expire, transfer ownership.</p>
          </div>
        )}

        {tab === "domains" && (
          <div className="border border-border bg-foreground p-5 text-background">
            <p className="font-mono text-xs">/admin/domains — 11 verified, 3 pending</p>
            <p className="mt-2 font-mono text-[10px] text-background/60">Approve, revoke, and inspect DNS health for all workspace domains.</p>
          </div>
        )}
      </div>

      {/* Admin edit popup */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm sm:items-center">
          <div className="animate-slide-up w-full max-w-lg bg-card p-6 pb-10 ring-1 ring-foreground/5 sm:rounded">
            <div className="mx-auto mb-6 h-1 w-12 rounded-full bg-border sm:hidden" />
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-extrabold uppercase tracking-tighter">Edit Operator</h2>
                <p className="font-mono text-[10px] uppercase text-muted-foreground">{editUser.email}</p>
              </div>
              <button onClick={() => setEditUser(null)} aria-label="Close"><X className="size-5" /></button>
            </div>

            <div className="space-y-4">
              <Field label="Name">
                <input defaultValue={editUser.name} className="w-full border border-border bg-background px-3 py-3 font-mono text-xs focus:border-primary focus:outline-none" />
              </Field>
              <Field label="Role">
                <select defaultValue={editUser.role} className="w-full appearance-none border border-border bg-background px-3 py-3 font-mono text-xs focus:border-primary focus:outline-none">
                  <option>Admin</option><option>Editor</option><option>Viewer</option>
                </select>
              </Field>
              <Field label="Status">
                <select defaultValue={editUser.status} className="w-full appearance-none border border-border bg-background px-3 py-3 font-mono text-xs focus:border-primary focus:outline-none">
                  <option value="active">Active</option><option value="suspended">Suspended</option>
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={() => setEditUser(null)} className="border border-destructive py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-destructive">
                  Delete User
                </button>
                <button onClick={() => setEditUser(null)} className="bg-primary py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                  Save Changes
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

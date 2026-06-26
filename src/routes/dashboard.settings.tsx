import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "Pengaturan — Sisolo Link" }] }),
  component: Settings,
});

function Settings() {
  const { user } = Route.useRouteContext() as { user: any };

  return (
    <AppShell title="Pengaturan" user={user}>
      <div className="px-5 py-6 lg:px-10 lg:py-10">
        <h1 className="text-3xl font-extrabold uppercase tracking-tighter">Pengaturan</h1>
        <p className="font-mono text-[10px] uppercase text-muted-foreground">Preferensi ruang kerja & operator</p>

        <div className="mt-6 space-y-6">
          <Section title="Profil">
            <Field label="Nama"><input defaultValue={user?.name || "Operator"} className="input" /></Field>
            <Field label="Email"><input defaultValue={user?.email || "operator@sisolo.my.id"} className="input" /></Field>
          </Section>

          <Section title="Ruang Kerja">
            <Field label="Nama Ruang Kerja"><input defaultValue="Sisolo Link" className="input" /></Field>
            <Field label="Domain Bawaan">
              <select className="input"><option>sisolo.my.id</option></select>
            </Field>
          </Section>

          <Section title="API">
            <div className="border border-border bg-muted p-3 font-mono text-[10px] text-muted-foreground">
              sk_live_••••••••••••••••a8f2
            </div>
            <button className="border border-border py-2 px-4 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-muted">
              Putar Kunci
            </button>
          </Section>
        </div>
      </div>
      <style>{`.input { width:100%; border:1px solid var(--border); background:var(--background); padding:0.75rem 0.75rem; font-family: var(--font-mono); font-size:0.75rem; outline:none; } .input:focus { border-color: var(--primary); }`}</style>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border">
      <div className="border-b border-border bg-muted p-3 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      <div className="space-y-4 p-4">{children}</div>
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

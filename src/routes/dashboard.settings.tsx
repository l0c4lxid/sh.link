import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "Settings — Protocl.sh" }] }),
  component: Settings,
});

function Settings() {
  return (
    <AppShell title="Settings">
      <div className="px-5 py-6 lg:px-10 lg:py-10">
        <h1 className="text-3xl font-extrabold uppercase tracking-tighter">Settings</h1>
        <p className="font-mono text-[10px] uppercase text-muted-foreground">Workspace & operator preferences</p>

        <div className="mt-6 space-y-6">
          <Section title="Profile">
            <Field label="Name"><input defaultValue="Alex Rivera" className="input" /></Field>
            <Field label="Email"><input defaultValue="alex@acme.team" className="input" /></Field>
          </Section>

          <Section title="Workspace">
            <Field label="Workspace Name"><input defaultValue="acme.team" className="input" /></Field>
            <Field label="Default Domain">
              <select className="input"><option>protocl.sh</option><option>my-brand.link</option></select>
            </Field>
          </Section>

          <Section title="API">
            <div className="border border-border bg-muted p-3 font-mono text-[10px] text-muted-foreground">
              sk_live_••••••••••••••••a8f2
            </div>
            <button className="border border-border py-2 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-muted">
              Rotate Key
            </button>
          </Section>
        </div>
      </div>
      <style>{`.input { width:100%; border:1px solid var(--border); background:var(--background); padding:0.75rem 0.75rem; font-family: var(--font-mono); font-size:0.75rem; outline:none; appearance:none; } .input:focus { border-color: var(--primary); }`}</style>
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

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Masuk — Protocl.sh" },
      { name: "description", content: "Masuk atau daftar ke konsol Protocl.sh." },
    ],
  }),
  component: Auth,
});

function Auth() {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-5 py-4">
        <Link to="/" className="font-mono text-sm font-bold tracking-tighter">
          PROTOCL<span className="text-primary">.SH</span>
        </Link>
      </header>

      <main className="px-5 py-12">
        <div className="mx-auto max-w-md">
          <div className="mb-8 flex items-center gap-4">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              /AUTH
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <h1 className="text-balance text-4xl font-extrabold uppercase leading-[0.9] tracking-tighter">
            {mode === "login" ? (
              <>Enter the<br /><span className="text-primary">Console.</span></>
            ) : (
              <>Initialize<br /><span className="text-primary">Operator.</span></>
            )}
          </h1>

          <div className="mt-8 flex border border-border">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-3 font-mono text-[10px] font-bold uppercase tracking-widest ${
                  mode === m ? "bg-foreground text-background" : "text-muted-foreground"
                }`}
              >
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
            {mode === "register" && (
              <Field label="Operator Name">
                <input type="text" defaultValue="Alex Rivera" className="input" />
              </Field>
            )}
            <Field label="Email">
              <input type="email" defaultValue="operator@acme.team" className="input" />
            </Field>
            <Field label="Password">
              <input type="password" defaultValue="••••••••••" className="input" />
            </Field>

            <Link
              to="/dashboard"
              className="block w-full bg-primary py-4 text-center font-mono text-xs font-bold uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20"
            >
              {mode === "login" ? "Authenticate →" : "Provision Account →"}
            </Link>

            <button
              type="button"
              className="w-full border border-border py-3 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-muted"
            >
              Continue with Google
            </button>
          </form>

          <p className="mt-8 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {mode === "login" ? (
              <>No account? <button onClick={() => setMode("register")} className="text-primary">Register →</button></>
            ) : (
              <>Have an account? <button onClick={() => setMode("login")} className="text-primary">Sign In →</button></>
            )}
          </p>
        </div>
      </main>

      <style>{`.input { width:100%; border:1px solid var(--border); background:var(--background); padding:0.75rem 0.75rem; font-family: var(--font-mono); font-size:0.75rem; outline:none; } .input:focus { border-color: var(--primary); }`}</style>
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

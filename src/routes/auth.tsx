import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import { setCookie, deleteCookie } from "@tanstack/react-start/server";
import crypto from "crypto";
import clientPromise from "@/lib/mongodb";
import { signJwt } from "@/lib/jwt";
import { toast } from "sonner";
export const authenticateServer = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; password?: string }) => input)
  .handler(async ({ data: input }) => {
    const client = await clientPromise;
    const db = client.db();
    
    const emailLower = input.email.toLowerCase().trim();
    const user = await db.collection("users").findOne({ email: emailLower });
    
    if (!user) {
      throw new Error("Pengguna tidak ditemukan.");
    }
    
    const passwordHash = crypto.createHash("sha256").update(input.password || "").digest("hex");
    if (user.passwordHash !== passwordHash) {
      throw new Error("Password salah.");
    }
    
    const token = signJwt({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });
    
    setCookie("jwt_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 hari
      path: "/",
    });
    
    return {
      success: true,
      user: {
        email: user.email,
        role: user.role,
        name: user.name,
      }
    };
  });

export const logoutServer = createServerFn({ method: "POST" })
  .handler(async () => {
    deleteCookie("jwt_token", { path: "/" });
    return { success: true };
  });

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Masuk — sisolo.my.id" },
      { name: "description", content: "Masuk ke konsol operator sisolo.my.id." },
    ],
  }),
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Silakan masukkan email dan password");
      return;
    }

    setLoading(true);
    try {
      const res = await authenticateServer({
        data: { email, password }
      });
      if (res.success) {
        toast.success(`Selamat datang kembali, ${res.user.name}!`);
        navigate({ to: "/dashboard" });
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal masuk");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-5 py-4">
        <Link to="/" className="font-mono text-sm font-bold tracking-tighter">
          SISOLO<span className="text-primary">.MY.ID</span>
        </Link>
      </header>

      <main className="px-5 py-12">
        <div className="mx-auto max-w-md">
          <div className="mb-8 flex items-center gap-4">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              /AUTENTIKASI
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <h1 className="text-balance text-4xl font-extrabold uppercase leading-[0.9] tracking-tighter">
            Masuk ke<br /><span className="text-primary">Konsol.</span>
          </h1>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <Field label="Email">
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="contoh: test@admin.com atau test@user.com" 
                className="input" 
                required 
              />
            </Field>
            <Field label="Password">
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="masukkan password" 
                className="input" 
                required 
              />
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="block w-full bg-primary py-4 text-center font-mono text-xs font-bold uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 active:bg-foreground disabled:opacity-50"
            >
              {loading ? "MENGOTENTIKASI..." : "MASUK →"}
            </button>
          </form>

          <div className="mt-8 border-t border-border pt-4 font-mono text-[10px] text-muted-foreground leading-relaxed">
            <p className="font-bold uppercase text-foreground mb-1">AKUN UJI COBA:</p>
            <p>🔑 Admin: <span className="text-foreground font-bold">test@admin.com</span> / Password: <span className="text-foreground font-bold">admin</span></p>
            <p>🔑 User: <span className="text-foreground font-bold">test@user.com</span> / Password: <span className="text-foreground font-bold">user</span></p>
          </div>
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

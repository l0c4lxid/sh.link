import { createFileRoute, useRouter } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import { toast } from "sonner";
import { createServerFn } from "@tanstack/react-start";
import { setCookie } from "@tanstack/react-start/server";
import clientPromise from "@/lib/mongodb";
import crypto from "crypto";
import { signJwt } from "@/lib/jwt";

const updateProfileServer = createServerFn({ method: "POST" })
  .inputValidator((input: { name: string; email: string; currentEmail: string }) => input)
  .handler(async ({ data: input }) => {
    const client = await clientPromise;
    const db = client.db();
    
    const emailLower = input.email.toLowerCase().trim();
    const nameTrim = input.name.trim();
    if (!nameTrim) throw new Error("Nama harus diisi.");
    if (!emailLower) throw new Error("Email harus diisi.");
    
    // If email changed, check uniqueness
    if (emailLower !== input.currentEmail.toLowerCase().trim()) {
      const existing = await db.collection("users").findOne({ email: emailLower });
      if (existing) {
        throw new Error("Email sudah terdaftar pada pengguna lain.");
      }
    }
    
    const user = await db.collection("users").findOne({ email: input.currentEmail.toLowerCase().trim() });
    if (!user) {
      throw new Error("Pengguna tidak ditemukan.");
    }
    
    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { name: nameTrim, email: emailLower } }
    );
    
    // Issue a new JWT token
    const token = signJwt({
      userId: user._id.toString(),
      email: emailLower,
      role: user.role,
      name: nameTrim,
    });
    
    setCookie("jwt_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    
    return { success: true };
  });

const changePasswordServer = createServerFn({ method: "POST" })
  .inputValidator((input: { oldPass: string; newPass: string; email: string }) => input)
  .handler(async ({ data: input }) => {
    const client = await clientPromise;
    const db = client.db();
    
    const user = await db.collection("users").findOne({ email: input.email.toLowerCase().trim() });
    if (!user) {
      throw new Error("Pengguna tidak ditemukan.");
    }
    
    const oldHash = crypto.createHash("sha256").update(input.oldPass).digest("hex");
    if (user.passwordHash !== oldHash) {
      throw new Error("Password lama salah.");
    }
    
    const newHash = crypto.createHash("sha256").update(input.newPass).digest("hex");
    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { passwordHash: newHash } }
    );
    
    return { success: true };
  });

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "Pengaturan — Sisolo Link" }] }),
  component: Settings,
});

function Settings() {
  const { user } = Route.useRouteContext() as { user: any };
  const router = useRouter();

  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileEmail, setProfileEmail] = useState(user?.email || "");
  const [profileUpdating, setProfileUpdating] = useState(false);

  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [updating, setUpdating] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName || !profileEmail) {
      toast.error("Nama dan Email wajib diisi");
      return;
    }
    setProfileUpdating(true);
    try {
      const res = await updateProfileServer({
        data: { name: profileName, email: profileEmail, currentEmail: user.email }
      });
      if (res.success) {
        toast.success("Profil berhasil diperbarui!");
        await router.invalidate();
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui profil");
    } finally {
      setProfileUpdating(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPass || !newPass || !confirmPass) {
      toast.error("Silakan lengkapi formulir password");
      return;
    }
    if (newPass !== confirmPass) {
      toast.error("Password baru dan konfirmasi tidak cocok");
      return;
    }
    if (newPass.length < 4) {
      toast.error("Password baru minimal 4 karakter");
      return;
    }
    setUpdating(true);
    try {
      const res = await changePasswordServer({
        data: { oldPass, newPass, email: user.email }
      });
      if (res.success) {
        toast.success("Password berhasil diperbarui!");
        setOldPass("");
        setNewPass("");
        setConfirmPass("");
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui password");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <AppShell title="Pengaturan" user={user}>
      <div className="px-5 py-6 lg:px-10 lg:py-10">
        <h1 className="text-3xl font-extrabold uppercase tracking-tighter">Pengaturan</h1>
        <p className="font-mono text-[10px] uppercase text-muted-foreground">Preferensi ruang kerja & operator</p>
 
        <div className="mt-6 space-y-6">
          <Section title="Profil">
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <Field label="Nama">
                <input 
                  type="text" 
                  value={profileName} 
                  onChange={(e) => setProfileName(e.target.value)} 
                  className="input" 
                  required 
                />
              </Field>
              <Field label="Email">
                <input 
                  type="email" 
                  value={profileEmail} 
                  onChange={(e) => setProfileEmail(e.target.value)} 
                  className="input" 
                  required 
                />
              </Field>
              <button 
                type="submit" 
                disabled={profileUpdating}
                className="bg-primary px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary-foreground hover:opacity-90 cursor-pointer disabled:opacity-50"
              >
                {profileUpdating ? "Menyimpan..." : "Simpan Profil"}
              </button>
            </form>
          </Section>

          <Section title="Ruang Kerja">
            <Field label="Nama Ruang Kerja"><input defaultValue="Sisolo Link" className="input" disabled /></Field>
            <Field label="Domain Bawaan">
              <select className="input" disabled><option>sisolo.my.id</option></select>
            </Field>
          </Section>

          <Section title="Ubah Password">
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <Field label="Password Lama">
                <input 
                  type="password" 
                  value={oldPass} 
                  onChange={(e) => setOldPass(e.target.value)} 
                  placeholder="Masukkan password lama" 
                  className="input" 
                  required 
                />
              </Field>
              <Field label="Password Baru">
                <input 
                  type="password" 
                  value={newPass} 
                  onChange={(e) => setNewPass(e.target.value)} 
                  placeholder="Minimal 4 karakter" 
                  className="input" 
                  required 
                />
              </Field>
              <Field label="Konfirmasi Password Baru">
                <input 
                  type="password" 
                  value={confirmPass} 
                  onChange={(e) => setConfirmPass(e.target.value)} 
                  placeholder="Ulangi password baru" 
                  className="input" 
                  required 
                />
              </Field>
              <button 
                type="submit" 
                disabled={updating}
                className="bg-primary px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary-foreground hover:opacity-90 cursor-pointer disabled:opacity-50"
              >
                {updating ? "Memproses..." : "Ubah Password"}
              </button>
            </form>
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

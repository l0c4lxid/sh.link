import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import { toast } from "sonner";
import { createServerFn } from "@tanstack/react-start";
import clientPromise from "@/lib/mongodb";
import crypto from "crypto";

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
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [updating, setUpdating] = useState(false);

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
            <Field label="Nama"><input defaultValue={user?.name || "Operator"} className="input" disabled /></Field>
            <Field label="Email"><input defaultValue={user?.email || "operator@sisolo.link"} className="input" disabled /></Field>
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

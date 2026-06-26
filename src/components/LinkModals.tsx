import { useEffect, useState, useRef, useCallback } from "react";
import { X, Check } from "lucide-react";
import { createServerFn } from "@tanstack/react-start";
import clientPromise from "@/lib/mongodb";
import { toast } from "sonner";
import QRCode from "qrcode";
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

export const updateLinkServer = createServerFn({ method: "POST" })
  .inputValidator((input: { slug: string; dest: string; expiresAt?: string; password?: string; removePassword?: boolean }) => input)
  .handler(async ({ data: input }) => {
    const client = await clientPromise;
    const db = client.db();
    
    let destination = input.dest.trim();
    if (!/^https?:\/\//i.test(destination)) {
      destination = `https://${destination}`;
    }

    const updateData: any = {
      dest: destination,
    };

    if (input.expiresAt !== undefined) {
      updateData.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
    }

    if (input.removePassword) {
      updateData.passwordHash = null;
    } else if (input.password) {
      const crypto = await import("crypto");
      updateData.passwordHash = crypto.createHash("sha256").update(input.password).digest("hex");
    }

    await db.collection("links").updateOne(
      { slug: input.slug.toLowerCase() },
      { $set: updateData }
    );

    return { success: true };
  });

export function QRDetailModal({
  link,
  onClose,
}: {
  link: { slug: string; dest: string } | null;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const fullUrl = link ? `${window.location.origin}/r/${link.slug}` : "";

  const setCanvasRef = useCallback((node: HTMLCanvasElement | null) => {
    canvasRef.current = node;
    if (node && fullUrl) {
      QRCode.toCanvas(
        node,
        fullUrl,
        {
          width: 256,
          margin: 1,
          color: {
            dark: "#0f172a",
            light: "#ffffff",
          },
        },
        (err) => {
          if (err) console.error(err);
        }
      );
    }
  }, [fullUrl]);

  useEffect(() => {
    setCopied(false);
  }, [link]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success("Tautan disalin ke papan klip!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!canvasRef.current || !link) return;
    const url = canvasRef.current.toDataURL("image/jpeg", 1.0);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${link.slug}.jpeg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Kode QR berhasil diunduh!");
  };

  return (
    <Dialog open={!!link} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-border bg-background font-mono sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold uppercase tracking-tight">Detail & Kode QR</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground uppercase">
            Salin tautan singkat atau unduh kode QR
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="border border-border p-2 bg-white rounded-lg">
            <canvas ref={setCanvasRef} className="block size-[200px]" />
          </div>
          <div className="w-full space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">URL Tujuan</label>
            <div className="break-all border border-border bg-muted p-2.5 text-xs text-muted-foreground select-all max-h-24 overflow-y-auto">
              {link?.dest}
            </div>
          </div>
          <div className="w-full space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tautan Singkat</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={fullUrl}
                className="flex-1 border border-border bg-muted px-3 py-2 text-xs font-bold text-primary select-all outline-none"
              />
              <button
                onClick={handleCopy}
                className="bg-primary px-4 font-bold text-[10px] uppercase tracking-widest text-primary-foreground hover:opacity-90 cursor-pointer"
              >
                {copied ? "Tersalin" : "Salin"}
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-2 border-t border-border pt-4">
          <button
            onClick={handleDownload}
            className="flex-1 border border-border bg-card px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-secondary cursor-pointer"
          >
            Unduh JPEG
          </button>
          <button
            onClick={onClose}
            className="flex-grow bg-primary px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-primary-foreground hover:opacity-90 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteConfirmModal({
  slug,
  onClose,
  onConfirm,
}: {
  slug: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={!!slug} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="border-border bg-background font-mono sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-bold uppercase tracking-tight text-destructive">
            Hapus Tautan
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Apakah Anda yakin ingin menghapus tautan singkat{" "}
            <span className="font-bold text-foreground">/{slug}</span>? Tindakan ini akan menghapus tautan dan seluruh riwayat data klik secara permanen dari basis data MongoDB.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 gap-2 border-t border-border pt-4 sm:space-x-0">
          <AlertDialogCancel
            onClick={onClose}
            className="flex-1 border-border font-mono text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-secondary sm:mt-0"
          >
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="flex-1 bg-destructive text-destructive-foreground font-mono text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-destructive/90"
          >
            Hapus Permanen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function EditLinkModal({
  link,
  onClose,
  onUpdated,
}: {
  link: { slug: string; dest: string; hasPassword?: boolean } | null;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [dest, setDest] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [pwd, setPwd] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (link) {
      setDest(link.dest);
      setExpiresAt("");
      setPwd(!!link.hasPassword);
      setPassword("");
    }
  }, [link]);

  if (!link) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dest) {
      toast.error("Silakan masukkan URL tujuan");
      return;
    }

    setLoading(true);
    try {
      await updateLinkServer({
        data: {
          slug: link.slug,
          dest,
          expiresAt: expiresAt || undefined,
          password: pwd && password ? password : undefined,
          removePassword: !pwd && link.hasPassword,
        }
      });
      toast.success("Tautan singkat berhasil diperbarui!");
      onUpdated();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui tautan singkat");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!link} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-border bg-background font-mono sm:max-w-md relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none cursor-pointer"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold uppercase tracking-tight">Ubah Tautan</DialogTitle>
          <DialogDescription className="text-[10px] text-muted-foreground uppercase">
            Mengedit slug: /{link.slug}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2 text-xs">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">URL Tujuan</label>
            <input
              type="text"
              value={dest}
              onChange={(e) => setDest(e.target.value)}
              placeholder="contoh: marketing.co/campaign"
              className="w-full border border-border bg-background px-3 py-3 font-mono text-xs focus:border-primary focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Kedaluwarsa Baru (opsional)</label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full border border-border bg-background px-3 py-3 font-mono text-xs focus:border-primary focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setPwd((v) => !v)}
            className="flex w-full items-center justify-between border-y border-border py-3"
          >
            <div className="flex items-center gap-2">
              <div className="flex size-3.5 items-center justify-center border border-foreground">
                {pwd && <div className="size-2 bg-primary" />}
              </div>
              <span className="font-mono text-[9px] font-bold uppercase">Proteksi Kata Sandi</span>
            </div>
            <span className="font-mono text-[9px] text-muted-foreground">{pwd ? "AKTIF" : "NONAKTIF"}</span>
          </button>

          {pwd && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Kata Sandi Baru (kosongkan jika tidak diubah)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi baru"
                className="w-full border border-border bg-background px-3 py-3 font-mono text-xs focus:border-primary focus:outline-none"
              />
            </div>
          )}

          <div className="flex gap-2 border-t border-border pt-4 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-border bg-card px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-secondary cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-grow bg-primary px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-primary-foreground hover:opacity-90 cursor-pointer"
            >
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

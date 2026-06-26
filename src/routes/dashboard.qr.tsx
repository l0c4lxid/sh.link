import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { createServerFn } from "@tanstack/react-start";
import clientPromise from "@/lib/mongodb";
import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
const getSlugsServer = createServerFn({ method: "GET" })
  .inputValidator((user: { userId: string; role: string } | null) => user)
  .handler(async ({ data: user }) => {
    if (!user) throw new Error("Unauthorized");
    const client = await clientPromise;
    const db = client.db();
    const query = user.role === "admin" ? {} : { userId: user.userId };
    const docs = await db.collection("links").find(query).project({ slug: 1 }).toArray();
    return docs.map(doc => doc.slug);
  });

export const Route = createFileRoute("/dashboard/qr")({
  head: () => ({ meta: [{ title: "Kode QR — Sisolo Link" }] }),
  loader: async ({ context }) => {
    const user = context.user as { userId: string; role: string; name: string } | undefined;
    return await getSlugsServer({ data: user || null });
  },
  component: QR,
});

function QR() {
  const codes = Route.useLoaderData();
  const { user } = Route.useRouteContext() as { user: any };

  return (
    <AppShell title="Kode QR" user={user}>
      <div className="px-5 py-6 lg:px-10 lg:py-10">
        <h1 className="text-3xl font-extrabold uppercase tracking-tighter">Kode QR</h1>
        <p className="font-mono text-[10px] uppercase text-muted-foreground">Buat, unduh, sebarkan</p>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {codes.map((slug) => (
            <QRCodeCard key={slug} slug={slug} />
          ))}
          {codes.length === 0 && (
            <div className="col-span-full p-8 text-center text-muted-foreground font-mono">
              Belum ada tautan singkat yang dibuat.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function QRCodeCard({ slug }: { slug: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fullUrl = `${window.location.origin}/r/${slug}`;

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
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
  }, [slug, fullUrl]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL("image/jpeg", 1.0);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${slug}.jpeg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Kode QR /${slug} berhasil diunduh!`);
  };

  return (
    <div className="border border-border p-4 bg-card font-mono">
      <div className="flex aspect-square items-center justify-center border border-border bg-white p-2">
        <canvas ref={canvasRef} className="block size-full max-w-[200px] max-h-[200px]" />
      </div>
      <div className="mt-3 text-xs font-bold text-primary">/{slug}</div>
      <button
        onClick={handleDownload}
        className="mt-2 w-full border border-border py-1.5 text-[9px] font-bold uppercase tracking-widest hover:bg-muted cursor-pointer"
      >
        Unduh JPEG
      </button>
    </div>
  );
}

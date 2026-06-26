import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Home, Link2, BarChart3, Globe, QrCode, Settings, ShieldCheck, Menu, X, LogOut, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { CreateLinkSheet } from "./CreateLinkSheet";
import { createServerFn } from "@tanstack/react-start";
import { deleteCookie } from "@tanstack/react-start/server";
import { toast } from "sonner";

const nav = [
  { to: "/dashboard", label: "Ikhtisar", icon: Home },
  { to: "/dashboard/links", label: "Tautan Saya", icon: Link2 },
  { to: "/dashboard/analytics", label: "Analitik", icon: BarChart3 },
  { to: "/dashboard/domains", label: "Domain", icon: Globe },
  { to: "/dashboard/qr", label: "Kode QR", icon: QrCode },
  { to: "/dashboard/admin", label: "Admin", icon: ShieldCheck },
  { to: "/dashboard/settings", label: "Pengaturan", icon: Settings },
];

const logoutServer = createServerFn({ method: "POST" })
  .handler(async () => {
    deleteCookie("jwt_token", { path: "/" });
    return { success: true };
  });

export function AppShell({ children, title, user }: { children: ReactNode; title: string; user?: any }) {
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  const isUserAdmin = user?.role === "admin";
  const filteredNav = nav.filter(item => item.to !== "/dashboard/admin" || isUserAdmin);

  const handleLogout = async () => {
    try {
      await logoutServer();
      toast.success("Berhasil keluar.");
      navigate({ to: "/auth" });
    } catch (error) {
      toast.error("Gagal keluar");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top bar (mobile + desktop) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-5 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={() => setOpen(true)} className="lg:hidden" aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <Link to="/" className="font-mono text-sm font-bold tracking-tighter">
            SISOLO<span className="text-primary">.MY.ID</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:inline">
            {title}
          </span>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 bg-primary px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-primary-foreground"
          >
            <Plus className="size-3" /> Baru
          </button>
        </div>
      </header>

      <div className="lg:flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-border lg:block sticky top-[45px] h-[calc(100vh-45px)]">
          <SidebarContent pathname={pathname} filteredNav={filteredNav} onLogout={handleLogout} />
        </aside>

        {/* Mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <aside className="relative h-full w-72 max-w-[85%] bg-background animate-slide-up">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <span className="font-mono text-sm font-bold tracking-tighter">SISOLO.MY.ID</span>
                <button onClick={() => setOpen(false)} aria-label="Close menu">
                  <X className="size-5" />
                </button>
              </div>
              <SidebarContent pathname={pathname} filteredNav={filteredNav} onNav={() => setOpen(false)} onLogout={handleLogout} />
            </aside>
          </div>
        )}

        <main className="flex-1 pb-24 lg:pb-12">{children}</main>
      </div>

      {/* Bottom tab bar (mobile) */}
      <nav className={`fixed bottom-0 left-0 right-0 z-30 grid ${isUserAdmin ? "grid-cols-5" : "grid-cols-4"} border-t border-border bg-background/95 backdrop-blur-md lg:hidden`}>
        {[
          { to: "/dashboard", label: "Beranda", icon: Home },
          { to: "/dashboard/links", label: "Tautan", icon: Link2 },
          { to: "/dashboard/analytics", label: "Statistik", icon: BarChart3 },
          ...(isUserAdmin ? [{ to: "/dashboard/admin", label: "Admin", icon: ShieldCheck }] : []),
          { to: "/dashboard/settings", label: "Pengaturan", icon: Settings },
        ].map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 py-3 ${active ? "text-primary" : "text-muted-foreground"}`}
            >
              <Icon className="size-4" strokeWidth={active ? 2.5 : 1.5} />
              <span className="font-mono text-[9px] font-bold uppercase tracking-tighter">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <CreateLinkSheet open={createOpen} onClose={() => setCreateOpen(false)} user={user} />
    </div>
  );
}

function SidebarContent({
  pathname,
  filteredNav,
  onNav,
  onLogout
}: {
  pathname: string;
  filteredNav: typeof nav;
  onNav?: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-5">
        <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ruang Kerja</div>
        <div className="mt-1 font-mono text-sm font-bold">sisolo.my.id</div>
      </div>
      <nav className="flex-1 px-3 py-4">
        {filteredNav.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNav}
              className={`flex items-center gap-3 px-3 py-2.5 font-mono text-xs ${
                active
                  ? "bg-foreground text-background"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="size-3.5" strokeWidth={active ? 2.5 : 1.5} />
              <span className="font-bold uppercase tracking-wider">{item.label}</span>
              {active && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary"
        >
          <LogOut className="size-3.5" />
          Keluar
        </button>
      </div>
    </div>
  );
}

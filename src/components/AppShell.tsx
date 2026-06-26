import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Link2, BarChart3, Globe, QrCode, Settings, ShieldCheck, Menu, X, LogOut, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { CreateLinkSheet } from "./CreateLinkSheet";

const nav = [
  { to: "/dashboard", label: "Overview", icon: Home },
  { to: "/dashboard/links", label: "My Links", icon: Link2 },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/domains", label: "Domains", icon: Globe },
  { to: "/dashboard/qr", label: "QR Codes", icon: QrCode },
  { to: "/dashboard/admin", label: "Admin", icon: ShieldCheck },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children, title }: { children: ReactNode; title: string }) {
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar (mobile + desktop) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-5 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={() => setOpen(true)} className="lg:hidden" aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <Link to="/" className="font-mono text-sm font-bold tracking-tighter">
            PROTOCL<span className="text-primary">.SH</span>
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
            <Plus className="size-3" /> New
          </button>
        </div>
      </header>

      <div className="lg:flex">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-border lg:block">
          <SidebarContent pathname={pathname} />
        </aside>

        {/* Mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <aside className="relative h-full w-72 max-w-[85%] bg-background animate-slide-up">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <span className="font-mono text-sm font-bold tracking-tighter">PROTOCL.SH</span>
                <button onClick={() => setOpen(false)} aria-label="Close menu">
                  <X className="size-5" />
                </button>
              </div>
              <SidebarContent pathname={pathname} onNav={() => setOpen(false)} />
            </aside>
          </div>
        )}

        <main className="flex-1 pb-24 lg:pb-12">{children}</main>
      </div>

      {/* Bottom tab bar (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
        {[
          { to: "/dashboard", label: "Home", icon: Home },
          { to: "/dashboard/links", label: "Links", icon: Link2 },
          { to: "/dashboard/analytics", label: "Stats", icon: BarChart3 },
          { to: "/dashboard/admin", label: "Admin", icon: ShieldCheck },
          { to: "/dashboard/settings", label: "Set", icon: Settings },
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

      <CreateLinkSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

function SidebarContent({ pathname, onNav }: { pathname: string; onNav?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-5">
        <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Workspace</div>
        <div className="mt-1 font-mono text-sm font-bold">acme.team</div>
      </div>
      <nav className="flex-1 px-3 py-4">
        {nav.map((item) => {
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
        <button className="flex w-full items-center gap-3 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary">
          <LogOut className="size-3.5" />
          Log Out
        </button>
      </div>
    </div>
  );
}

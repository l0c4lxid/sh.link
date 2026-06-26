import { useEffect, useState } from "react";
import { X } from "lucide-react";

export function CreateLinkSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [pwd, setPwd] = useState(false);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm sm:items-center">
      <div className="animate-slide-up w-full max-w-lg bg-card p-6 pb-10 ring-1 ring-foreground/5 sm:rounded">
        <div className="mx-auto mb-6 h-1 w-12 rounded-full bg-border sm:hidden" />

        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-extrabold uppercase tracking-tighter">Configure Slug</h2>
            <p className="font-mono text-[10px] uppercase text-muted-foreground">New Entry / Protocol 049</p>
          </div>
          <button onClick={onClose} aria-label="Close">
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4">
          <Field label="Destination">
            <input
              type="text"
              defaultValue="https://product.com/very-long-ref-link"
              className="w-full border border-border bg-background px-3 py-3 font-mono text-xs focus:border-primary focus:outline-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Domain">
              <select className="w-full appearance-none border border-border bg-background px-3 py-3 font-mono text-xs focus:border-primary focus:outline-none">
                <option>protocl.sh</option>
                <option>my-brand.link</option>
              </select>
            </Field>
            <Field label="Slug">
              <input
                type="text"
                placeholder="custom-name"
                className="w-full border border-border bg-background px-3 py-3 font-mono text-xs focus:border-primary focus:outline-none"
              />
            </Field>
          </div>

          <Field label="Expires (optional)">
            <input
              type="date"
              className="w-full border border-border bg-background px-3 py-3 font-mono text-xs focus:border-primary focus:outline-none"
            />
          </Field>

          <button
            type="button"
            onClick={() => setPwd((v) => !v)}
            className="flex w-full items-center justify-between border-y border-border py-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-4 items-center justify-center border border-foreground">
                {pwd && <div className="size-2 bg-primary" />}
              </div>
              <span className="font-mono text-[10px] font-bold uppercase">Password Protect</span>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">{pwd ? "ON" : "OFF"}</span>
          </button>

          <button
            onClick={onClose}
            className="w-full bg-primary py-4 font-mono text-xs font-bold uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 active:bg-foreground"
          >
            Generate Tautan →
          </button>
        </div>
      </div>
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

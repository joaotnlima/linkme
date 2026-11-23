"use client";

import { useActionState, useTransition, type ReactNode } from "react";
import type { ActionResult } from "@/lib/actions";

export const inputCls = "h-12 w-full box-border px-3.5 rounded-xl border border-line bg-card text-ink text-base";
export const labelCls = "text-[13px] font-semibold text-muted";

export function Field({ label, name, children, error }: { label: string; name: string; children: ReactNode; error?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className={labelCls}>{label}</label>
      {children}
      {error ? <span className="text-xs text-[#B45309]">{error}</span> : null}
    </div>
  );
}

export function Toggle({ name, defaultChecked, label }: { name: string; defaultChecked: boolean; label: string }) {
  return (
    <label className="flex items-center justify-between min-h-11 cursor-pointer gap-3">
      <span className="text-[15px] font-medium">{label}</span>
      <input type="hidden" name={name} value="off" />
      <input type="checkbox" name={name} value="on" defaultChecked={defaultChecked} className="peer sr-only" />
      <span aria-hidden="true" className="w-11 h-[26px] rounded-full bg-[#C9C7BF] peer-checked:bg-accent relative transition-colors after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-5 after:h-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-[18px]" />
    </label>
  );
}

/** Wraps a Server Action that takes (prev, FormData). Renders children(state, pending). */
export function ActionForm({
  action,
  children,
  className,
  onDone,
  id,
}: {
  action: (prev: ActionResult | null, fd: FormData) => Promise<ActionResult>;
  children: (state: ActionResult | null, pending: boolean) => ReactNode;
  className?: string;
  onDone?: (state: ActionResult) => void;
  id?: string;
}) {
  const [state, formAction, pending] = useActionState(
    async (prev: ActionResult | null, fd: FormData) => {
      const r = await action(prev, fd);
      if (onDone) onDone(r);
      return r;
    },
    null,
  );
  return (
    <form id={id} action={formAction} className={className}>
      {children(state, pending)}
    </form>
  );
}

export function Status({ state }: { state: ActionResult | null }) {
  if (!state) return null;
  return state.ok ? (
    <span className="text-sm text-accent font-semibold">Saved</span>
  ) : (
    <span className="text-sm text-[#B45309]">{state.error}</span>
  );
}

/** Button that calls a parameterless-ish Server Action (id-based) with a pending state. */
export function ActionButton({ run, children, className, confirm: confirmText }: { run: () => Promise<ActionResult>; children: ReactNode; className?: string; confirm?: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className={`${className ?? ""} disabled:opacity-50 cursor-pointer`}
      onClick={() => {
        if (confirmText && !window.confirm(confirmText)) return;
        start(async () => {
          const r = await run();
          if (!r.ok) window.alert(r.error);
        });
      }}
    >
      {children}
    </button>
  );
}

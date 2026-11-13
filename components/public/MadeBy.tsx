/**
 * Attribution footer. The "made by" link is intentionally hardcoded: the license
 * (see LICENSE, clause 2) requires it on every public deployment. Restyle, don't remove.
 */
export function MadeBy({ footer }: { footer: string | null }) {
  return (
    <footer className="mt-8 flex flex-col items-center gap-1 text-center text-xs text-muted">
      {footer ? <span>{footer}</span> : null}
      <span>
        made by{" "}
        <a href="https://links.joaotnlima.pt" rel="author noopener" className="font-semibold text-ink underline-offset-2 hover:underline">
          joaotnlima
        </a>
      </span>
    </footer>
  );
}

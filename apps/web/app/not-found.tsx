import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-2xl font-bold">Not found</h1>
      <p className="text-muted">That link does not exist or is no longer public.</p>
      <Link href="/" className="text-accent font-semibold">Back to the page</Link>
    </main>
  );
}

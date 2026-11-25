import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-sm font-medium text-accent">404</p>
      <h1 className="mt-2 text-2xl font-semibold">We couldn&apos;t find that page</h1>
      <p className="mt-3 text-fg-muted">The link may be old, or the plan it pointed to may have been removed.</p>
      <Link href="/" className="mt-6 inline-block text-sm font-medium text-accent hover:underline">
        Back to the home page
      </Link>
    </div>
  );
}

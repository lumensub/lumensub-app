"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-semibold">Something broke on this page</h1>
      <p className="mt-3 text-fg-muted">
        It&apos;s on our side, not yours. Nothing was signed or sent. Try again, and if it keeps happening, let us know
        what you were doing.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}

"use client";

import ErrorContent from "@/components/overa/ErrorContent";

/** Global error boundary — the source 500.html design with retry. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("[Overa] runtime error:", error.message);
  return <ErrorContent reset={reset} />;
}

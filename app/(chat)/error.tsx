"use client";

import { ErrorView } from "@/components/common/error-view";

export default function ChatErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorView context="Erreur espace de travail" error={error} reset={reset} />
  );
}

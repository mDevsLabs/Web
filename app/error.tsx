"use client";

import { ErrorView } from "@/components/common/error-view";

export default function RootErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorView context="Erreur racine" error={error} reset={reset} />;
}

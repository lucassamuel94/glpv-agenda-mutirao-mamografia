"use client";

import AppError from "@/views/AppError";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AppError error={error} reset={reset} />;
}

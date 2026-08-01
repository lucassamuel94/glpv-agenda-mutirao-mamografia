import { EmptyState } from "@/modules/common/empty-state";
import { AlertTriangle } from "lucide-react";

export function ErrorMessage({
  title = "Algo deu errado",
  error,
}: {
  error?: string | Error;
  title?: string;
}) {
  const errorMessage = error instanceof Error ? error.message : error;
  return (
    <EmptyState
      icon={AlertTriangle}
      title={title}
      description={errorMessage}
      variant="danger"
    />
  );
}

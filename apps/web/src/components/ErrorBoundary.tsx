import React, { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "./Button";
import { Card } from "./Card";
import { APP_NAME } from "@/environments";
interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-6 text-center font-sans">
          <Card
            variant="default"
            className="p-8 rounded-2xl shadow-xl max-w-md w-full"
          >
            <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle
                size={32}
                className="text-red-500 dark:text-red-400"
              />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Ops! Algo deu errado.
            </h2>
            <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
              Encontramos um erro inesperado na aplicação. Nossa equipe foi
              notificada.
            </p>
            <div className="bg-accent p-4 rounded-lg mb-6 text-left overflow-auto max-h-32">
              <code className="text-xs text-muted-foreground font-mono">
                {this.state.error?.message || "Unknown Error"}
              </code>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={this.handleReload}
                variant="primary"
                size="lg"
                className="flex-1"
              >
                <RefreshCw size={16} /> Recarregar
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="secondary"
                size="lg"
                className="flex-1"
              >
                <Home size={16} /> Dashboard
              </Button>
            </div>
          </Card>
          <p className="mt-8 text-xs text-muted-foreground">
            {APP_NAME} &copy; {new Date().getFullYear()}
          </p>
        </div>
      );
    }

    // Fix: Property 'props' does not exist on type 'ErrorBoundary'
    return (this as any).props.children;
  }
}

export default ErrorBoundary;

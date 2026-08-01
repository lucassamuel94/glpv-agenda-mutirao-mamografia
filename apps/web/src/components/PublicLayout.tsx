"use client";

import React from "react";
import { Command } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import Image from "next/image";

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const { currentTenant } = useAuth();

  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center pt-12 pb-12 px-4 sm:px-6 font-sans text-foreground">
      {/* Branding Header */}
      <div className="mb-10 text-center animate-fadeIn">
        {currentTenant?.logoUrl ? (
          <Image
            src={currentTenant.logoUrl}
            alt={currentTenant.name}
            className="h-12 mx-auto mb-4 rounded-lg shadow-sm"
          />
        ) : (
          <div
            className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white mx-auto mb-4 shadow-sm"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <Command size={24} />
          </div>
        )}
        <h1 className="text-xl font-bold text-foreground tracking-tight">
          {currentTenant?.name || "N-Fretes"}
        </h1>
      </div>

      {/* Main Card */}
      <div
        className="w-full max-w-lg bg-card rounded-xl shadow-popover border border-border overflow-hidden animate-fadeIn"
        style={{ animationDelay: "0.1s" }}
      >
        {children}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-muted-foreground font-medium">
          Powered by{" "}
          <span className="text-muted-foreground font-bold">N-Fretes</span>
        </p>
        <div className="mt-2 text-[10px] text-muted-foreground flex items-center justify-center space-x-2">
          <span>Privacidade</span>
          <span>•</span>
          <span>Termos</span>
        </div>
      </div>
    </div>
  );
};

export default PublicLayout;

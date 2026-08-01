"use client";

import React from "react";
import Loading from "@/components/Loading";

interface PageLoadingProps {
  message?: string;
}

export function PageLoading({ message = "Carregando..." }: PageLoadingProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <Loading message={message} fullScreen={true} />
      </div>
    </div>
  );
}

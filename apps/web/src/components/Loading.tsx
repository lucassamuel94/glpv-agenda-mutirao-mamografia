import React from "react";

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

const Loading: React.FC<LoadingProps> = ({
  message = "Carregando...",
  fullScreen = false,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 animate-fadeIn">
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-border rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="text-sm font-medium text-muted-foreground animate-pulse">
        {message}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-[400px] flex items-center justify-center h-full w-full">
        {content}
      </div>
    );
  }

  return content;
};

export default Loading;

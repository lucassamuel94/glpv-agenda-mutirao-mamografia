import React, { useState, useRef, useEffect } from "react";
import { HelpCircle, MessageCircle, Book, ExternalLink, X } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./ui/input";

const HelpWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        widgetRef.current &&
        !widgetRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end"
      ref={widgetRef}
    >
      {isOpen && (
        <div className="bg-card rounded-xl shadow-2xl border border-border w-80 mb-4 overflow-hidden animate-fadeIn">
          <div className="bg-card p-4 flex justify-between items-center">
            <h4 className="text-white font-bold text-sm">Central de Ajuda</h4>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-white"
            >
              <X size={16} />
            </Button>
          </div>
          <div className="p-2">
            <div className="p-2">
              <Input
                name="help-search"
                type="text"
                placeholder="Buscar ajuda..."
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1 mt-1">
              <Button
                variant="ghost"
                size="md"
                className="w-full justify-start text-foreground"
              >
                <Book size={16} className="text-primary" /> Documentação
              </Button>
              <Button
                variant="ghost"
                size="md"
                className="w-full justify-start text-foreground"
              >
                <MessageCircle
                  size={16}
                  className="text-emerald-600 dark:text-emerald-400"
                />{" "}
                Chat com Suporte
              </Button>
              <Button
                variant="ghost"
                size="md"
                className="w-full justify-start text-foreground"
              >
                <ExternalLink
                  size={16}
                  className="text-blue-600 dark:text-blue-400"
                />{" "}
                Abrir Ticket
              </Button>
            </div>
          </div>
          <div className="bg-secondary p-3 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">
              Status do Sistema
            </span>
            <span className="flex items-center text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></div>{" "}
              Operacional
            </span>
          </div>
        </div>
      )}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="primary"
        size="icon-lg"
        className="rounded-full shadow-lg shadow-indigo-600/30 hover:scale-105"
      >
        <HelpCircle size={24} />
      </Button>
    </div>
  );
};

export default HelpWidget;

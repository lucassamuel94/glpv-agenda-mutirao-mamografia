"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import { getWsUrl } from "@/lib/socket";
import { useAuth } from "@/hooks/use-auth";

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
});

/**
 * Provider WebSocket. Conecta ao backend com withCredentials para enviar o cookie auth-token.
 * Só mantém conexão quando o usuário está autenticado; desconecta no logout.
 */
export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  // O socket É um sistema externo: conectar, desconectar e guardar a instância
  // é exatamente para isso que useEffect existe. A regra dispara pelo setState da
  // instância; mover isso para o render criaria conexão a cada render.
  useEffect(() => {
    if (!isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSocket((prev) => {
        if (prev) {
          prev.disconnect();
        }
        return null;
      });
      setConnected(false);
      return;
    }

    const url = getWsUrl();
    // Sessão é o cookie httpOnly `auth-token` — withCredentials manda ele no
    // handshake automaticamente (o gateway prioriza cookie sobre auth/query
    // token; ver apps/api/src/modules/websocket/websocket.gateway.ts).
    const s = io(url, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    setSocket(s);

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));

    return () => {
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error("useSocket deve ser usado dentro de SocketProvider");
  }
  return ctx;
}

import useSWR from "swr";

/**
 * Fetcher padrão para SWR. Sessão é o cookie httpOnly `auth-token` — vai
 * automaticamente com `credentials: "include"`, nunca via header manual.
 */
const fetcher = async (url: string) => {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      if (currentPath !== "/login") {
        localStorage.setItem("redirect_after_login", currentPath);
        window.location.href = "/login";
      }
    }

    const errorData = await res.json().catch(() => ({
      error: `Failed to fetch: ${res.status} ${res.statusText}`,
    }));
    throw new Error(
      errorData.error || errorData.message || "Failed to fetch data",
    );
  }

  return res.json();
};

export default fetcher;

"use client";

import { useRouter, usePathname, useParams } from 'next/navigation';

// Helper hooks to replace react-router-dom hooks
export function useNavigate() {
  const router = useRouter();
  return (path: string) => router.push(path);
}

export function useLocation() {
  const pathname = usePathname();
  return { pathname };
}

// Re-export useParams for convenience
export { useParams };


import { redirect } from "next/navigation";

/** Rota legada — o dashboard do mutirão agora é a rota principal (/). */
export default function MutiraoDashboardRoute() {
  redirect("/");
}

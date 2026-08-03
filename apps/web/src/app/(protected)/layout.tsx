"use client";

import React from 'react';
import NextDynamic from 'next/dynamic';
import Layout from '@/components/Layout';
import { LayoutSlotsProvider, useLayoutSlots } from '@/components/LayoutSlots';
import { NewBookingProvider } from '@/contexts/new-booking-context';
import { NewBookingModal } from '@/modules/agenda/new-booking-modal';

export const dynamic = 'force-dynamic';

const RequireAuth = NextDynamic(() => import('@/components/RequireAuth'), {
  ssr: false,
});

/**
 * Wrapper que conecta `<Layout>` aos slots do Provider.
 *
 * O `<Layout>` é o componente original do projeto (com Sidebar + header
 * fixo top-0). Aqui passamos `title`/`actions` como `undefined` para que
 * ele renderize os slots vazios (refs DOM) em vez do conteúdo padrão. As
 * views injetam título/ações via `<PageHeader>` (Portal).
 *
 * Mantém o Layout persistente entre navegações dentro da área autenticada
 * — Sidebar não remonta, seleção do usuário não é perdida, listeners
 * globais (keydown, resize) não são realocados a cada rota.
 */
function PersistentLayoutShell({ children }: { children: React.ReactNode }) {
  const { setTitleSlot, setActionsSlot } = useLayoutSlots();
  return (
    <Layout
      titleSlotRef={setTitleSlot}
      actionsSlotRef={setActionsSlot}
    >
      {children}
    </Layout>
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <NewBookingProvider>
        <LayoutSlotsProvider>
          <PersistentLayoutShell>{children}</PersistentLayoutShell>
        </LayoutSlotsProvider>
        <NewBookingModal />
      </NewBookingProvider>
    </RequireAuth>
  );
}

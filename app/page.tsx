'use client';

import { EditorScreen } from '@/components/EditorScreen';
import { SetupScreen } from '@/components/SetupScreen';
import { TranslatorProvider, useTranslator } from '@/lib/store';

function Screens() {
  const { state, activeLocales } = useTranslator();
  const inEditor = state.step === 'editor' && activeLocales.length > 0;
  return inEditor ? <EditorScreen /> : <SetupScreen />;
}

export default function Page() {
  return (
    <TranslatorProvider>
      <Screens />
    </TranslatorProvider>
  );
}

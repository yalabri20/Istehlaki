"use client";

import { ApplianceSimulator } from "@/components/appliance-simulator";
import { BillUpload } from "@/components/bill-upload";
import {
  CalculatorProvider,
  useCalculator,
} from "@/components/calculator-context";
import { ElectricityCalculator } from "@/components/electricity-calculator";
import { Header } from "@/components/header";
import { I18nProvider, useI18n } from "@/components/i18n-provider";
import { SummaryPanel } from "@/components/summary-panel";
import { Button } from "@/components/ui/button";

function Dashboard() {
  const { t } = useI18n();
  const { reset, hasReceipt } = useCalculator();

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(1000px_460px_at_100%_-12%,rgba(13,148,136,0.16),transparent_58%),radial-gradient(760px_400px_at_-10%_8%,rgba(196,163,90,0.18),transparent_52%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.4] [background-image:radial-gradient(rgba(28,25,23,0.05)_1px,transparent_1px)] [background-size:22px_22px]" />
      <Header />
      <main className="relative mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
        <section className="mb-8 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold-soft/30 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            <span className="text-xs font-bold tracking-wide text-[#8a6d2f]">
              {t("residential")} · {t("billAnalyzer")}
            </span>
          </div>
          <h1 className="mt-4 text-balance text-3xl font-black leading-[1.15] tracking-tight text-stone-900 sm:text-[2.75rem]">
            {t("tagline")}
          </h1>
          <div className="mt-4 h-px w-24 gold-rule" />
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">
            {t("subtitle")}
          </p>
        </section>

        <div className="mb-4">
          <BillUpload />
        </div>

        {hasReceipt ? (
          <>
            <div className="mb-4">
              <SummaryPanel />
            </div>
            <div className="mb-4">
              <ElectricityCalculator />
            </div>
            <ApplianceSimulator />
          </>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-3xl text-xs leading-relaxed text-stone-500">
            {t("footer")}
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            {t("reset")}
          </Button>
        </div>
      </main>
    </div>
  );
}

export function AppShell() {
  return (
    <I18nProvider>
      <CalculatorProvider>
        <Dashboard />
      </CalculatorProvider>
    </I18nProvider>
  );
}

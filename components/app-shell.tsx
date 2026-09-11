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
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(900px_420px_at_100%_-10%,rgba(13,148,136,0.14),transparent_55%),radial-gradient(700px_380px_at_-10%_10%,rgba(196,163,90,0.16),transparent_50%)]" />
      <Header />
      <main className="relative mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
        <section className="mb-6 max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black leading-tight text-stone-900 sm:text-4xl">
              {t("tagline")}
            </h1>
            <span className="rounded-md bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-800">
              {t("residential")}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-stone-600 sm:text-base">
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

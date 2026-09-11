"use client";

import { CalendarDays, Receipt, Sun, Wallet } from "lucide-react";
import { useCalculator } from "@/components/calculator-context";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatKwh, formatSar } from "@/lib/format";
import type { MessageKey } from "@/lib/i18n";
import {
  acDutyCycleForTemp,
  acOptimizedMonthlyKwh,
  calculateElectricity,
  combinedAcMonthlyKwh,
  ELECTRICITY_TIER1_RATE,
  ELECTRICITY_TIER2_RATE,
  projectSeasonalAnnual,
  tier2AvoidanceAnnualSaving,
} from "@/lib/tariffs";
import type { ClimateSeason } from "@/lib/types";
import { cn } from "@/lib/utils";

const SEASONS: ClimateSeason[] = ["summer", "winter", "spring"];

const SEASON_LABEL: Record<ClimateSeason, MessageKey> = {
  summer: "seasonSummer",
  winter: "seasonWinter",
  spring: "seasonSpring",
};

const SCALE_LABEL: Record<"efficient" | "average" | "high", MessageKey> = {
  efficient: "scaleEfficient",
  average: "scaleAverage",
  high: "scaleHigh",
};

export function SummaryPanel() {
  const { locale, t } = useI18n();
  const {
    electricityKwh,
    electricityMeterFee,
    periodDays,
    setPeriodDays,
    billSeason,
    setBillSeason,
    ac18Qty,
    ac24Qty,
    acHoursMode,
    acHours,
    ac18Hours,
    ac24Hours,
    acTempC,
    acFilterHabit,
  } = useCalculator();

  const electricity = calculateElectricity(electricityKwh, electricityMeterFee);
  const days = Math.max(1, periodDays);
  const daily = electricity.total / days;

  const projection = projectSeasonalAnnual(
    electricityKwh,
    billSeason,
    electricityMeterFee,
  );
  const selectedBlock =
    projection.blocks.find((block) => block.season === billSeason) ?? null;

  const fleet = {
    qty18: ac18Qty,
    qty24: ac24Qty,
    hours18: acHoursMode === "shared" ? acHours : ac18Hours,
    hours24: acHoursMode === "shared" ? acHours : ac24Hours,
  };
  const acKwh = combinedAcMonthlyKwh(
    fleet,
    undefined,
    acDutyCycleForTemp(acTempC),
  );
  const optimizedAcKwh = acOptimizedMonthlyKwh(
    fleet,
    acTempC,
    acFilterHabit === "overdue",
  );
  const acSavedKwh = Math.max(0, acKwh - optimizedAcKwh);
  const summerKwh = projection.summerPeakKwh;
  const avoidance =
    projection.scale === "high"
      ? tier2AvoidanceAnnualSaving(
          projection,
          Math.max(0, summerKwh - acSavedKwh),
        )
      : null;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-teal-900 text-white shadow-[0_16px_40px_rgba(19,78,74,0.28)]">
          <CardContent className="flex h-full flex-col justify-between p-5">
            <div className="flex items-center gap-2 text-teal-100">
              <Wallet className="h-4 w-4" />
              <span className="text-xs font-bold tracking-wide">
                {t("electricity")}
              </span>
            </div>
            <p className="mt-4 text-3xl font-black">
              {formatSar(electricity.total, locale)}
            </p>
            <p className="mt-1 text-xs text-teal-100/80">{t("vatIncluded")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-stone-500">
              <Receipt className="h-4 w-4" />
              <span className="text-xs font-bold">{t("summary")}</span>
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs text-stone-500">{t("kwh")}</span>
                <span className="font-black text-stone-900">
                  {formatKwh(electricity.kwh, locale)}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs text-stone-500">{t("tier1")}</span>
                <span className="font-semibold text-stone-800">
                  {formatKwh(electricity.tier1Kwh, locale)} ·{" "}
                  {formatSar(electricity.tier1Charge, locale)}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs text-stone-500">{t("tier2")}</span>
                <span className="font-semibold text-stone-800">
                  {formatKwh(electricity.tier2Kwh, locale)} ·{" "}
                  {formatSar(electricity.tier2Charge, locale)}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs text-stone-500">{t("meterFee")}</span>
                <span className="font-semibold text-stone-800">
                  {formatSar(electricity.meterFee, locale)}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs text-stone-500">{t("vat")}</span>
                <span className="font-semibold text-stone-800">
                  {formatSar(electricity.vat, locale)}
                </span>
              </div>
              <p className="pt-1 text-[11px] leading-relaxed text-stone-400">
                {ELECTRICITY_TIER1_RATE} / {ELECTRICITY_TIER2_RATE} · {t("residential")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-stone-500">
              <CalendarDays className="h-4 w-4" />
              <span className="text-xs font-bold">{t("quarterAvg")}</span>
            </div>
            {selectedBlock ? (
              <>
                <p className="mt-2 text-sm font-semibold text-stone-800">
                  {t(SEASON_LABEL[selectedBlock.season])}
                </p>
                <p className="mt-1 text-2xl font-black text-stone-900">
                  {formatKwh(selectedBlock.monthlyKwh, locale)}
                </p>
                <p className="text-sm text-stone-600">
                  {formatSar(selectedBlock.monthlyBill.total, locale)} · {t("perMonth")}
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  {selectedBlock.source === "measured"
                    ? t("measuredFromBill")
                    : t("typicalHomeMax")}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-stone-600">
                {t("dailyAvg")}: {formatSar(daily, locale)}
              </p>
            )}
            <div className="mt-3 flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={90}
                value={periodDays}
                onChange={(event) =>
                  setPeriodDays(Math.max(1, Number(event.target.value) || 30))
                }
                className="h-9 w-20 bg-white text-center font-bold"
              />
              <Label className="text-stone-500">{t("days")}</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-bold text-stone-500">{t("annualEst")}</p>
            <p className="mt-3 text-2xl font-black text-stone-900">
              {formatSar(projection.annualTotal, locale)}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-stone-500">
              {t("annualSeasonalHint")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold text-stone-500">
                <Sun className="h-4 w-4" />
                {t("seasonMatrix")}
              </p>
              <p className="mt-1 text-lg font-black text-stone-900">
                {t(SCALE_LABEL[projection.scale])}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-stone-500">
                {t("seasonMatrixHint")}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold text-stone-500">{t("billSeason")}</p>
              <div className="flex flex-wrap gap-2">
                {SEASONS.map((item) => (
                  <Button
                    key={item}
                    type="button"
                    size="sm"
                    variant={billSeason === item ? "default" : "secondary"}
                    onClick={() => setBillSeason(item)}
                    className={cn("rounded-2xl")}
                  >
                    {t(SEASON_LABEL[item])}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {projection.blocks.map((block) => (
              <div
                key={block.season}
                className={cn(
                  "rounded-2xl px-4 py-3",
                  block.source === "measured"
                    ? "bg-teal-50 ring-1 ring-teal-800/20"
                    : "bg-stone-50",
                )}
              >
                <p className="text-xs font-bold text-stone-500">
                  {t(SEASON_LABEL[block.season])}
                </p>
                <p className="mt-1 text-[11px] text-teal-800">
                  {block.source === "measured"
                    ? t("measuredFromBill")
                    : t("typicalHomeMax")}
                </p>
                <p className="mt-1 text-lg font-black text-stone-900">
                  {formatSar(block.seasonTotal, locale)}
                </p>
                <p className="text-xs text-stone-500">
                  {formatSar(block.monthlyBill.total, locale)} · {t("perMonth")}
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  {formatKwh(block.monthlyKwh, locale)}
                </p>
              </div>
            ))}
          </div>

          {projection.scale === "high" ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
              <p className="font-bold">{t("savings")}</p>
              <p className="mt-1 text-xs">{t("highUseGuidance")}</p>
              <p className="mt-1 text-xs">{t("highUseDetail")}</p>
              {avoidance?.dropsBelowTier2 ? (
                <p className="mt-2 font-semibold text-emerald-800">
                  {t("tier2Avoidance")}: {formatSar(avoidance.savedSar, locale)}
                </p>
              ) : (
                <p className="mt-2 text-xs">{t("tier2StillHigh")}</p>
              )}
            </div>
          ) : null}

          <p className="text-[11px] leading-relaxed text-stone-400">
            {t("savingsDisclaimer")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

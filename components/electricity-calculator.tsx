"use client";

import { useCalculator } from "@/components/calculator-context";
import { useI18n } from "@/components/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RangeSlider } from "@/components/ui/range-slider";
import { formatKwh, formatSar } from "@/lib/format";
import {
  calculateElectricity,
  ELECTRICITY_KWH_MAX,
  ELECTRICITY_SLIDER_STEP,
  ELECTRICITY_TIER1_LIMIT_KWH,
  ELECTRICITY_TIER1_RATE,
  ELECTRICITY_TIER2_RATE,
  electricitySliderMax,
} from "@/lib/tariffs";
import { cn } from "@/lib/utils";

export function ElectricityCalculator() {
  const { locale, t } = useI18n();
  const {
    electricityKwh,
    electricityMeterFee,
    setElectricityKwh,
    setElectricityMeterFee,
  } = useCalculator();

  const bill = calculateElectricity(electricityKwh, electricityMeterFee);
  const sliderMax = electricitySliderMax(electricityKwh);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{t("electricity")}</CardTitle>
          <Badge variant={bill.inExpensiveTier ? "danger" : "success"}>
            {bill.inExpensiveTier ? t("expensiveTier") : t("cheapTier")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <div className="mb-2 flex items-end justify-between gap-3">
            <Label htmlFor="kwh">{t("kwh")}</Label>
            <Input
              id="kwh"
              type="number"
              min={0}
              max={ELECTRICITY_KWH_MAX}
              step={ELECTRICITY_SLIDER_STEP}
              value={electricityKwh}
              onChange={(event) =>
                setElectricityKwh(Number(event.target.value) || 0)
              }
              className="h-9 w-28 text-center font-bold"
            />
          </div>
          <RangeSlider
            min={0}
            max={sliderMax}
            step={ELECTRICITY_SLIDER_STEP}
            value={Math.min(electricityKwh, sliderMax)}
            onChange={setElectricityKwh}
            accent={bill.inExpensiveTier ? "rose" : "teal"}
            ariaLabel={t("kwh")}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-stone-500">
            <span>{t("threshold")}</span>
            <span>
              {formatKwh(electricityKwh, locale)} /{" "}
              {formatKwh(ELECTRICITY_TIER1_LIMIT_KWH, locale)}
            </span>
          </div>
          <Progress
            value={Math.round(bill.progressToTier2 * 100)}
            indicatorClassName={bill.inExpensiveTier ? "bg-rose-600" : "bg-emerald-600"}
          />
          <p
            className={cn(
              "mt-2 text-sm font-semibold",
              bill.inExpensiveTier ? "text-rose-700" : "text-emerald-700",
            )}
          >
            {bill.inExpensiveTier
              ? `${t("crossedTier2")} · ${formatKwh(bill.tier2Kwh, locale)} ${t("overflow")}`
              : `${t("remainingToTier2")}: ${formatKwh(bill.remainingToTier2, locale)}`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-emerald-50 p-3">
            <p className="text-xs font-semibold text-emerald-800">{t("tier1")}</p>
            <p className="mt-1 font-bold text-stone-900">
              {formatSar(bill.tier1Charge, locale)}
            </p>
            <p className="text-xs text-stone-500">
              {formatKwh(bill.tier1Kwh, locale)} × {ELECTRICITY_TIER1_RATE}
            </p>
          </div>
          <div
            className={cn(
              "rounded-2xl p-3",
              bill.inExpensiveTier ? "bg-rose-50" : "bg-stone-50",
            )}
          >
            <p
              className={cn(
                "text-xs font-semibold",
                bill.inExpensiveTier ? "text-rose-800" : "text-stone-500",
              )}
            >
              {t("tier2")}
            </p>
            <p className="mt-1 font-bold text-stone-900">
              {formatSar(bill.tier2Charge, locale)}
            </p>
            <p className="text-xs text-stone-500">
              {formatKwh(bill.tier2Kwh, locale)} × {ELECTRICITY_TIER2_RATE}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="meter-fee">{t("meterFee")}</Label>
          <Input
            id="meter-fee"
            type="number"
            min={0}
            step={0.5}
            value={electricityMeterFee}
            onChange={(event) =>
              setElectricityMeterFee(Math.max(0, Number(event.target.value) || 0))
            }
            className="h-9 w-28 text-center"
          />
        </div>

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between text-stone-600">
            <dt>{t("consumption")}</dt>
            <dd className="font-medium">{formatSar(bill.consumptionCharge, locale)}</dd>
          </div>
          <div className="flex justify-between text-stone-600">
            <dt>{t("subtotal")}</dt>
            <dd className="font-medium">{formatSar(bill.subtotal, locale)}</dd>
          </div>
          <div className="flex justify-between text-stone-600">
            <dt>{t("vat")}</dt>
            <dd className="font-medium">{formatSar(bill.vat, locale)}</dd>
          </div>
          <div className="flex justify-between border-t border-stone-100 pt-2 text-base font-extrabold text-stone-900">
            <dt>{t("total")}</dt>
            <dd>{formatSar(bill.total, locale)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

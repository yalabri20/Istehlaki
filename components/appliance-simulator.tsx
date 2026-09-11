"use client";

import { AirVent, Minus, Plus, Snowflake, Thermometer, Timer } from "lucide-react";
import { useCalculator } from "@/components/calculator-context";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatKwh, formatSar } from "@/lib/format";
import {
  acFilterCleaningSaving,
  acSetpointSaving,
  acTwoHoursEarlierSaving,
} from "@/lib/tariffs";
import type { AcFleet } from "@/lib/types";
import { cn } from "@/lib/utils";

const TEMP_PRESETS = [18, 20, 22, 24] as const;

function Counter({
  id,
  label,
  hint,
  value,
  onChange,
  max = 20,
}: {
  id: string;
  label: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {hint ? (
        <p className="mt-1 text-xs leading-relaxed text-stone-500">{hint}</p>
      ) : null}
      <div className="mt-2 flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          className="size-11 shrink-0 rounded-2xl p-0"
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label="-"
        >
          <Minus className="size-4" />
        </Button>
        <Input
          id={id}
          type="number"
          min={0}
          max={max}
          step={1}
          value={value}
          onChange={(event) =>
            onChange(Math.max(0, Number(event.target.value) || 0))
          }
          className="h-11 bg-stone-50 text-center text-base font-bold"
        />
        <Button
          type="button"
          variant="secondary"
          className="size-11 shrink-0 rounded-2xl p-0"
          onClick={() => onChange(Math.min(max, value + 1))}
          aria-label="+"
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function ApplianceSimulator() {
  const { locale, t } = useI18n();
  const {
    electricityKwh,
    ac18Qty,
    ac24Qty,
    acHoursMode,
    acHours,
    ac18Hours,
    ac24Hours,
    acTempC,
    acFilterHabit,
    setAc18Qty,
    setAc24Qty,
    setAcHoursMode,
    setAcHours,
    setAc18Hours,
    setAc24Hours,
    setAcTempC,
    setAcFilterHabit,
  } = useCalculator();

  const fleet: AcFleet = {
    qty18: ac18Qty,
    qty24: ac24Qty,
    hours18: acHoursMode === "shared" ? acHours : ac18Hours,
    hours24: acHoursMode === "shared" ? acHours : ac24Hours,
  };
  const totalQty = ac18Qty + ac24Qty;
  const hoursReady =
    acHoursMode === "shared"
      ? acHours > 0
      : (ac18Qty === 0 || ac18Hours > 0) && (ac24Qty === 0 || ac24Hours > 0);
  const answered = totalQty > 0 && hoursReady;
  const twoHour = acTwoHoursEarlierSaving(fleet, electricityKwh, acTempC);
  const setpoint =
    acTempC == null
      ? null
      : acSetpointSaving(fleet, electricityKwh, acTempC);
  const filterSaving = acFilterCleaningSaving(fleet, electricityKwh, acTempC);

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>{t("askAcTitle")}</CardTitle>
          <p className="text-sm text-stone-500">{t("askAcHint")}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Counter
              id="ac-18"
              label={t("askAc18Qty")}
              hint={t("askAc18Hint")}
              value={ac18Qty}
              onChange={setAc18Qty}
            />
            <Counter
              id="ac-24"
              label={t("askAc24Qty")}
              hint={t("askAc24Hint")}
              value={ac24Qty}
              onChange={setAc24Qty}
            />
          </div>
          <div>
            <Label>{t("askAcHoursMode")}</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={acHoursMode === "shared" ? "default" : "secondary"}
                onClick={() => setAcHoursMode("shared")}
                className={cn("h-auto min-h-11 whitespace-normal rounded-2xl py-2")}
              >
                {t("acHoursShared")}
              </Button>
              <Button
                type="button"
                variant={acHoursMode === "split" ? "default" : "secondary"}
                onClick={() => setAcHoursMode("split")}
                className={cn("h-auto min-h-11 whitespace-normal rounded-2xl py-2")}
              >
                {t("acHoursSplit")}
              </Button>
            </div>
          </div>
          {acHoursMode === "shared" ? (
            <div>
              <Label htmlFor="ac-hours">{t("askAcHours")}</Label>
              <p className="mt-1 text-xs leading-relaxed text-stone-500">
                {t("askAcHoursHint")}
              </p>
              <Input
                id="ac-hours"
                type="number"
                min={0}
                max={24}
                step={0.5}
                value={acHours}
                onChange={(event) =>
                  setAcHours(Math.max(0, Number(event.target.value) || 0))
                }
                className="mt-2 h-11 bg-stone-50 text-base font-bold"
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="ac-hours-18">{t("askAcHours18")}</Label>
                <Input
                  id="ac-hours-18"
                  type="number"
                  min={0}
                  max={24}
                  step={0.5}
                  value={ac18Hours}
                  onChange={(event) =>
                    setAc18Hours(Math.max(0, Number(event.target.value) || 0))
                  }
                  className="mt-2 h-11 bg-stone-50 text-base font-bold"
                />
              </div>
              <div>
                <Label htmlFor="ac-hours-24">{t("askAcHours24")}</Label>
                <Input
                  id="ac-hours-24"
                  type="number"
                  min={0}
                  max={24}
                  step={0.5}
                  value={ac24Hours}
                  onChange={(event) =>
                    setAc24Hours(Math.max(0, Number(event.target.value) || 0))
                  }
                  className="mt-2 h-11 bg-stone-50 text-base font-bold"
                />
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="ac-temp">{t("askAcTemp")}</Label>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">
              {t("askAcTempHint")}
            </p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {TEMP_PRESETS.map((temp) => (
                <Button
                  key={temp}
                  type="button"
                  variant={acTempC === temp ? "default" : "secondary"}
                  onClick={() => setAcTempC(temp)}
                  className="h-11 rounded-2xl"
                >
                  {temp}°
                </Button>
              ))}
            </div>
            <Input
              id="ac-temp"
              type="number"
              min={16}
              max={30}
              step={1}
              placeholder="16–30"
              value={acTempC ?? ""}
              onChange={(event) => {
                const raw = event.target.value;
                if (raw.trim() === "") {
                  setAcTempC(null);
                  return;
                }
                const next = Number(raw);
                if (!Number.isFinite(next)) return;
                setAcTempC(Math.min(30, Math.max(16, next)));
              }}
              className="mt-2 h-11 bg-stone-50 text-base font-bold"
            />
          </div>
          <div>
            <Label>{t("askAcFilter")}</Label>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">
              {t("askAcFilterHint")}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={acFilterHabit === "regular" ? "default" : "secondary"}
                onClick={() => setAcFilterHabit("regular")}
                className="h-auto min-h-11 whitespace-normal rounded-2xl py-2"
              >
                {t("filterRegular")}
              </Button>
              <Button
                type="button"
                variant={acFilterHabit === "overdue" ? "default" : "secondary"}
                onClick={() => setAcFilterHabit("overdue")}
                className="h-auto min-h-11 whitespace-normal rounded-2xl py-2"
              >
                {t("filterOverdue")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-teal-800/15 bg-gradient-to-b from-teal-50 to-white lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Snowflake className="h-5 w-5 text-teal-800" />
            {t("savings")}
          </CardTitle>
          <p className="text-sm text-stone-500">{t("savingsFromAc")}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {!answered ? (
            <p className="rounded-2xl bg-white px-4 py-6 text-sm leading-relaxed text-stone-600 shadow-sm">
              {t("savingsNeedAnswers")}
            </p>
          ) : (
            <>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-stone-700">
                  <Timer className="h-4 w-4 text-teal-800" />
                  {t("twoHours")}
                </div>
                <p className="text-2xl font-black text-emerald-700">
                  {formatSar(twoHour.savedSar, locale)}
                </p>
                <p className="text-xs text-stone-500">
                  {formatKwh(twoHour.savedKwh, locale)} · {t("perMonth")}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-stone-500">
                  {t("twoHoursHow")}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-stone-700">
                  <Thermometer className="h-4 w-4 text-teal-800" />
                  {t("temp24")}
                </div>
                {setpoint == null ? (
                  <p className="text-sm leading-relaxed text-stone-600">
                    {t("askAcTemp")}
                  </p>
                ) : setpoint.savedSar <= 0 ? (
                  <p className="text-sm leading-relaxed text-stone-600">
                    {t("tempAlreadyGood")}
                  </p>
                ) : (
                  <>
                    <p className="text-2xl font-black text-emerald-700">
                      {formatSar(setpoint.savedSar, locale)}
                    </p>
                    <p className="text-xs text-stone-500">
                      {formatKwh(setpoint.savedKwh, locale)} · {t("perMonth")}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-stone-500">
                      {t("tempHow")}
                    </p>
                  </>
                )}
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-stone-700">
                  <AirVent className="h-4 w-4 text-teal-800" />
                  {t("dustTitle")}
                </div>
                {acFilterHabit == null ? (
                  <p className="text-sm leading-relaxed text-stone-600">
                    {t("askAcFilter")}
                  </p>
                ) : acFilterHabit === "regular" ? (
                  <p className="text-sm leading-relaxed text-stone-600">
                    {t("dustAlreadyClean")}
                  </p>
                ) : (
                  <>
                    <p className="text-2xl font-black text-emerald-700">
                      {formatSar(filterSaving.savedSar, locale)}
                    </p>
                    <p className="text-xs text-stone-500">
                      {formatKwh(filterSaving.savedKwh, locale)} · {t("perMonth")}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-stone-500">
                      {t("dustHow")}
                    </p>
                  </>
                )}
              </div>
            </>
          )}
          <p className="pt-1 text-[11px] leading-relaxed text-stone-400">
            {t("savingsDisclaimer")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

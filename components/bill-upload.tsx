"use client";

import { FormEvent, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useCalculator } from "@/components/calculator-context";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ELECTRICITY_KWH_MAX,
  ELECTRICITY_METER_FEE_DEFAULT,
} from "@/lib/tariffs";
import type { ClimateSeason } from "@/lib/types";
import { cn } from "@/lib/utils";

const SEASONS: ClimateSeason[] = ["summer", "winter", "spring"];

export function BillUpload() {
  const { t } = useI18n();
  const { applyManualEntry, periodDays, billSeason, setBillSeason } =
    useCalculator();

  const [consumption, setConsumption] = useState("");
  const [days, setDays] = useState(String(periodDays || 30));
  const [meterFee, setMeterFee] = useState(String(ELECTRICITY_METER_FEE_DEFAULT));
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const onManualSubmit = (event: FormEvent) => {
    event.preventDefault();
    const value = Number(consumption);
    if (!Number.isFinite(value) || value <= 0) {
      setFormError(t("errorManualRequired"));
      setSuccess("");
      return;
    }
    if (value > ELECTRICITY_KWH_MAX) {
      setFormError(t("errorKwhMax"));
      setSuccess("");
      return;
    }
    applyManualEntry({
      consumption: value,
      periodDays: Number(days) || 30,
      meterFee: Number(meterFee) || ELECTRICITY_METER_FEE_DEFAULT,
      billSeason,
    });
    setFormError("");
    setSuccess(t("manualSuccessElectricity"));
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{t("uploadTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onManualSubmit} className="space-y-4">
          <div>
            <Label htmlFor="consumption">{t("askKwh")}</Label>
            <Input
              id="consumption"
              inputMode="decimal"
              type="number"
              min={0}
              max={ELECTRICITY_KWH_MAX}
              step="any"
              required
              value={consumption}
              onChange={(event) => setConsumption(event.target.value)}
              className="mt-2 h-12 bg-white text-base font-bold"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="days">{t("askDays")}</Label>
              <Input
                id="days"
                type="number"
                min={1}
                max={90}
                value={days}
                onChange={(event) => setDays(event.target.value)}
                className="mt-2 h-11 bg-white"
              />
            </div>
            <div>
              <Label htmlFor="meter">{t("askMeterFee")}</Label>
              <Input
                id="meter"
                type="number"
                min={0}
                step="0.5"
                value={meterFee}
                onChange={(event) => setMeterFee(event.target.value)}
                className="mt-2 h-11 bg-white"
              />
            </div>
          </div>
          <div>
            <Label>{t("billSeason")}</Label>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">
              {t("billSeasonHint")}
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {SEASONS.map((item) => (
                <Button
                  key={item}
                  type="button"
                  variant={billSeason === item ? "default" : "secondary"}
                  onClick={() => setBillSeason(item)}
                  className={cn(
                    "h-auto min-h-11 whitespace-normal rounded-2xl py-2 text-xs",
                  )}
                >
                  {t(
                    item === "summer"
                      ? "seasonSummer"
                      : item === "winter"
                        ? "seasonWinter"
                        : "seasonSpring",
                  )}
                </Button>
              ))}
            </div>
          </div>
          {formError ? (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">
              {formError}
            </p>
          ) : null}
          <Button type="submit" className="h-12 w-full rounded-2xl text-base">
            {t("calculateBill")}
          </Button>
        </form>

        <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-stone-500">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
          {t("privacyManual")}
        </p>
        {success ? (
          <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
            {success}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ELECTRICITY_METER_FEE_DEFAULT,
  clampElectricityKwh,
  seasonFromMonth,
} from "@/lib/tariffs";
import type {
  ActiveService,
  AcFilterHabit,
  AcHoursMode,
  ClimateSeason,
  ParsedBill,
} from "@/lib/types";

export type CalculatorState = {
  activeService: ActiveService;
  electricityKwh: number;
  electricityMeterFee: number;
  periodDays: number;
  billSeason: ClimateSeason;
  ac18Qty: number;
  ac24Qty: number;
  acHoursMode: AcHoursMode;
  acHours: number;
  ac18Hours: number;
  ac24Hours: number;
  acTempC: number | null;
  acFilterHabit: AcFilterHabit | null;
  parsedBill: ParsedBill | null;
  importedAt: number | null;
};

type CalculatorContextValue = CalculatorState & {
  hasReceipt: boolean;
  showAcSavings: boolean;
  setElectricityKwh: (value: number) => void;
  setElectricityMeterFee: (value: number) => void;
  setPeriodDays: (value: number) => void;
  setBillSeason: (value: ClimateSeason) => void;
  setAc18Qty: (value: number) => void;
  setAc24Qty: (value: number) => void;
  setAcHoursMode: (value: AcHoursMode) => void;
  setAcHours: (value: number) => void;
  setAc18Hours: (value: number) => void;
  setAc24Hours: (value: number) => void;
  setAcTempC: (value: number | null) => void;
  setAcFilterHabit: (value: AcFilterHabit | null) => void;
  applyManualEntry: (input: {
    consumption: number;
    periodDays: number;
    meterFee?: number;
    billSeason?: ClimateSeason;
  }) => void;
  reset: () => void;
};

const defaults: CalculatorState = {
  activeService: "idle",
  electricityKwh: 2_400,
  electricityMeterFee: ELECTRICITY_METER_FEE_DEFAULT,
  periodDays: 30,
  billSeason: seasonFromMonth(new Date().getMonth() + 1),
  ac18Qty: 0,
  ac24Qty: 0,
  acHoursMode: "shared",
  acHours: 8,
  ac18Hours: 8,
  ac24Hours: 8,
  acTempC: null,
  acFilterHabit: null,
  parsedBill: null,
  importedAt: null,
};

const CalculatorContext = createContext<CalculatorContextValue | null>(null);

export function CalculatorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CalculatorState>(defaults);

  const setElectricityKwh = useCallback((electricityKwh: number) => {
    setState((s) => ({ ...s, electricityKwh: clampElectricityKwh(electricityKwh) }));
  }, []);

  const setElectricityMeterFee = useCallback((electricityMeterFee: number) => {
    setState((s) => ({ ...s, electricityMeterFee }));
  }, []);

  const setPeriodDays = useCallback((periodDays: number) => {
    setState((s) => ({ ...s, periodDays }));
  }, []);

  const setBillSeason = useCallback((billSeason: ClimateSeason) => {
    setState((s) => ({ ...s, billSeason }));
  }, []);

  const setAc18Qty = useCallback((ac18Qty: number) => {
    setState((s) => ({ ...s, ac18Qty: Math.max(0, ac18Qty) }));
  }, []);

  const setAc24Qty = useCallback((ac24Qty: number) => {
    setState((s) => ({ ...s, ac24Qty: Math.max(0, ac24Qty) }));
  }, []);

  const setAcHoursMode = useCallback((acHoursMode: AcHoursMode) => {
    setState((s) => ({
      ...s,
      acHoursMode,
      ac18Hours: acHoursMode === "shared" ? s.acHours : s.ac18Hours,
      ac24Hours: acHoursMode === "shared" ? s.acHours : s.ac24Hours,
    }));
  }, []);

  const setAcHours = useCallback((acHours: number) => {
    const hours = Math.max(0, acHours);
    setState((s) => ({
      ...s,
      acHours: hours,
      ac18Hours: s.acHoursMode === "shared" ? hours : s.ac18Hours,
      ac24Hours: s.acHoursMode === "shared" ? hours : s.ac24Hours,
    }));
  }, []);

  const setAc18Hours = useCallback((ac18Hours: number) => {
    setState((s) => ({ ...s, ac18Hours: Math.max(0, ac18Hours) }));
  }, []);

  const setAc24Hours = useCallback((ac24Hours: number) => {
    setState((s) => ({ ...s, ac24Hours: Math.max(0, ac24Hours) }));
  }, []);

  const setAcTempC = useCallback((acTempC: number | null) => {
    setState((s) => ({ ...s, acTempC }));
  }, []);

  const setAcFilterHabit = useCallback((acFilterHabit: AcFilterHabit | null) => {
    setState((s) => ({ ...s, acFilterHabit }));
  }, []);

  const applyManualEntry = useCallback(
    (input: {
      consumption: number;
      periodDays: number;
      meterFee?: number;
      billSeason?: ClimateSeason;
    }) => {
      const period = Math.max(1, Math.round(input.periodDays) || 30);
      const kwh = clampElectricityKwh(input.consumption);
      setState((s) => ({
        ...s,
        activeService: "electricity",
        periodDays: period,
        importedAt: Date.now(),
        billSeason: input.billSeason ?? s.billSeason,
        electricityKwh: kwh,
        electricityMeterFee: input.meterFee ?? s.electricityMeterFee,
        parsedBill: {
          service_type: "electricity",
          period_days: period,
          total_consumption: kwh,
          meter_fee: input.meterFee ?? s.electricityMeterFee,
          vat_amount: null,
          total_amount: null,
          electricity_kwh: kwh,
          water_m3: null,
        },
      }));
    },
    [],
  );

  const reset = useCallback(() => setState(defaults), []);

  const hasReceipt = state.activeService === "electricity";
  const showAcSavings = hasReceipt;

  const value = useMemo(
    () => ({
      ...state,
      hasReceipt,
      showAcSavings,
      setElectricityKwh,
      setElectricityMeterFee,
      setPeriodDays,
      setBillSeason,
      setAc18Qty,
      setAc24Qty,
      setAcHoursMode,
      setAcHours,
      setAc18Hours,
      setAc24Hours,
      setAcTempC,
      setAcFilterHabit,
      applyManualEntry,
      reset,
    }),
    [
      state,
      hasReceipt,
      showAcSavings,
      setElectricityKwh,
      setElectricityMeterFee,
      setPeriodDays,
      setBillSeason,
      setAc18Qty,
      setAc24Qty,
      setAcHoursMode,
      setAcHours,
      setAc18Hours,
      setAc24Hours,
      setAcTempC,
      setAcFilterHabit,
      applyManualEntry,
      reset,
    ],
  );

  return (
    <CalculatorContext.Provider value={value}>
      {children}
    </CalculatorContext.Provider>
  );
}

export function useCalculator() {
  const ctx = useContext(CalculatorContext);
  if (!ctx) throw new Error("useCalculator must be used within CalculatorProvider");
  return ctx;
}

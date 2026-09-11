import type {
  AcFleet,
  ApplianceConfig,
  ApplianceCost,
  ApplianceInput,
  ClimateSeason,
  ElectricityBill,
  HouseholdScale,
  SeasonalMonthBlock,
  SeasonalProjection,
  WaterBill,
  WaterTierId,
  WaterTierUsage,
} from "./types";

export const VAT_RATE = 0.15;

export const ELECTRICITY_TIER1_LIMIT_KWH = 6_000;
export const ELECTRICITY_TIER1_RATE = 0.18;
export const ELECTRICITY_TIER2_RATE = 0.3;
export const ELECTRICITY_METER_FEE_DEFAULT = 15;
export const ELECTRICITY_KWH_MAX = 50_000;
export const ELECTRICITY_SLIDER_MAX_DEFAULT = 30_000;
export const ELECTRICITY_SLIDER_STEP = 100;

export const WATER_METER_FEE = 10;

/** Comfort target used for the “raise the setpoint” tip. */
export const AC_TARGET_C = 24;
/** Degrees of setpoint increase from 18°C to 24°C. */
export const AC_TEMP_DELTA_C = 6;
/** Rule-of-thumb HVAC saving per 1°C higher setpoint. */
export const AC_SAVING_PER_DEGREE = 0.06;
/** Extra AC energy with a clogged filter (typical published range 5–15%). */
export const AC_DIRTY_FILTER_FACTOR = 0.1;
/** 18,000 BTU / 1.5-ton split, rated kW. */
export const AC_18K_KW = 1.8;
/** 24,000 BTU / 2.0-ton split, rated kW. */
export const AC_24K_KW = 2.2;
/** Default duty when setpoint is unknown or ≤20°C (compressor runs full). */
export const AC_DUTY_CYCLE = 1;
/** Compressor cycling when setpoint is 22°C or higher. */
export const AC_DUTY_CYCLE_MILD = 0.7;
/** Setpoints at or above this use AC_DUTY_CYCLE_MILD. */
export const AC_DUTY_MILD_FROM_C = 22;
export const AC_DAYS_PER_MONTH = 30;

/** Compressor factor for savings: ≤20°C → 1, ≥22°C → 0.7. */
export function acDutyCycleForTemp(tempC: number | null | undefined): number {
  if (tempC != null && Number.isFinite(tempC) && tempC >= AC_DUTY_MILD_FROM_C) {
    return AC_DUTY_CYCLE_MILD;
  }
  return AC_DUTY_CYCLE;
}

/**
 * Typical Saudi villa/apartment load vs that home’s summer cooling max.
 * Summer: AC at peak. Spring: milder cooling. Winter: base load, little AC.
 */
export const SEASON_TYPICAL_MAX: Record<ClimateSeason, number> = {
  summer: 1,
  winter: 0.38,
  spring: 0.68,
};
/** @deprecated use SEASON_TYPICAL_MAX */
export const SEASON_WEIGHT = SEASON_TYPICAL_MAX;
export const SEASON_MONTH_COUNT = 4;
export const SUMMER_EFFICIENT_KWH = 3_500;
export const SUMMER_HIGH_KWH = ELECTRICITY_TIER1_LIMIT_KWH;

export const WATER_TIERS: ReadonlyArray<{
  tier: WaterTierId;
  from: number;
  to: number | null;
  waterRate: number;
  sewageRate: number;
}> = [
  { tier: 1, from: 1, to: 15, waterRate: 0.15, sewageRate: 0.05 },
  { tier: 2, from: 16, to: 30, waterRate: 1.5, sewageRate: 0.75 },
  { tier: 3, from: 31, to: 45, waterRate: 4, sewageRate: 2 },
  { tier: 4, from: 46, to: 60, waterRate: 6, sewageRate: 3 },
  { tier: 5, from: 61, to: null, waterRate: 8, sewageRate: 4 },
];

export const APPLIANCES: readonly ApplianceConfig[] = [
  { id: "ac18", watts: 1800, defaultHours: 8, defaultQty: 1, isAc: true },
  { id: "ac24", watts: 2200, defaultHours: 8, defaultQty: 1, isAc: true },
  { id: "heater", watts: 1500, defaultHours: 3, defaultQty: 1, isAc: false },
  { id: "fridge", watts: 200, defaultHours: 24, defaultQty: 1, isAc: false },
  { id: "washer", watts: 500, defaultHours: 1, defaultQty: 1, isAc: false },
];

export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function roundUnits(value: number, digits = 3): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clampElectricityKwh(value: number): number {
  const safe = Number.isFinite(value) ? value : 0;
  return clamp(safe, 0, ELECTRICITY_KWH_MAX);
}

/** Slider stays at 30,000 unless typed kWh is higher (up to 50,000). */
export function electricitySliderMax(kwh: number): number {
  return Math.min(
    ELECTRICITY_KWH_MAX,
    Math.max(ELECTRICITY_SLIDER_MAX_DEFAULT, clampElectricityKwh(kwh)),
  );
}

export function calculateElectricity(
  kwh: number,
  meterFee: number = ELECTRICITY_METER_FEE_DEFAULT,
): ElectricityBill {
  const safeKwh = Math.max(0, Number.isFinite(kwh) ? kwh : 0);
  const safeFee = Math.max(0, Number.isFinite(meterFee) ? meterFee : 0);

  const tier1Kwh = Math.min(safeKwh, ELECTRICITY_TIER1_LIMIT_KWH);
  const tier2Kwh = Math.max(0, safeKwh - ELECTRICITY_TIER1_LIMIT_KWH);
  const tier1Charge = roundMoney(tier1Kwh * ELECTRICITY_TIER1_RATE);
  const tier2Charge = roundMoney(tier2Kwh * ELECTRICITY_TIER2_RATE);
  const consumptionCharge = roundMoney(tier1Charge + tier2Charge);
  const subtotal = roundMoney(consumptionCharge + safeFee);
  const vat = roundMoney(subtotal * VAT_RATE);
  const total = roundMoney(subtotal + vat);
  const inExpensiveTier = safeKwh > ELECTRICITY_TIER1_LIMIT_KWH;
  const remainingToTier2 = Math.max(0, ELECTRICITY_TIER1_LIMIT_KWH - safeKwh);
  const progressToTier2 = clamp(safeKwh / ELECTRICITY_TIER1_LIMIT_KWH, 0, 1);
  const blendedRate = safeKwh > 0 ? consumptionCharge / safeKwh : ELECTRICITY_TIER1_RATE;
  const marginalRate = inExpensiveTier
    ? ELECTRICITY_TIER2_RATE
    : ELECTRICITY_TIER1_RATE;

  return {
    kwh: safeKwh,
    meterFee: safeFee,
    tier1Kwh,
    tier2Kwh,
    tier1Charge,
    tier2Charge,
    consumptionCharge,
    subtotal,
    vat,
    total,
    inExpensiveTier,
    remainingToTier2,
    progressToTier2,
    blendedRate,
    marginalRate,
  };
}

function slabCapacity(from: number, to: number | null): number {
  if (to === null) return Number.POSITIVE_INFINITY;
  return to - from + 1;
}

export function calculateWater(
  m3: number,
  hasSewage: boolean = true,
  meterFee: number = WATER_METER_FEE,
): WaterBill {
  const safeM3 = Math.max(0, Number.isFinite(m3) ? m3 : 0);
  const safeFee = Math.max(0, Number.isFinite(meterFee) ? meterFee : 0);

  let remaining = safeM3;
  const slabs: WaterTierUsage[] = [];

  for (const tier of WATER_TIERS) {
    const capacity = slabCapacity(tier.from, tier.to);
    const units = Math.min(remaining, capacity);
    const sewageRate = hasSewage ? tier.sewageRate : 0;
    const combinedRate = tier.waterRate + sewageRate;
    const waterCharge = roundMoney(units * tier.waterRate);
    const sewageCharge = roundMoney(units * sewageRate);
    const charge = roundMoney(waterCharge + sewageCharge);

    slabs.push({
      tier: tier.tier,
      from: tier.from,
      to: tier.to,
      units: roundUnits(units),
      waterRate: tier.waterRate,
      sewageRate,
      combinedRate,
      waterCharge,
      sewageCharge,
      charge,
    });

    remaining = Math.max(0, remaining - units);
    if (remaining <= 0) break;
  }

  const waterCharge = roundMoney(slabs.reduce((sum, s) => sum + s.waterCharge, 0));
  const sewageCharge = roundMoney(slabs.reduce((sum, s) => sum + s.sewageCharge, 0));
  const consumptionCharge = roundMoney(waterCharge + sewageCharge);
  const subtotal = roundMoney(consumptionCharge + safeFee);
  const vat = roundMoney(subtotal * VAT_RATE);
  const total = roundMoney(subtotal + vat);

  const currentTier: WaterTierId =
    safeM3 <= 0 ? 1 : (slabs[slabs.length - 1]?.tier ?? 1);

  const currentDef = WATER_TIERS.find((t) => t.tier === currentTier);
  const nextDef = WATER_TIERS.find((t) => t.tier === currentTier + 1);
  let remainingToNextTier: number | null = null;
  if (currentDef?.to != null && safeM3 > 0) {
    remainingToNextTier = roundUnits(Math.max(0, currentDef.to - safeM3));
  } else if (safeM3 <= 0 && currentDef?.to != null) {
    remainingToNextTier = currentDef.to;
  }

  return {
    m3: safeM3,
    hasSewage,
    meterFee: safeFee,
    currentTier,
    slabs,
    waterCharge,
    sewageCharge,
    consumptionCharge,
    subtotal,
    vat,
    total,
    remainingToNextTier: nextDef ? remainingToNextTier : null,
    nextTier: nextDef ? nextDef.tier : null,
  };
}

/** Effective SAR/kWh for extra usage, using progressive slabs then VAT separately. */
export function effectiveRateForAdditionalKwh(
  currentKwh: number,
  additionalKwh: number,
): number {
  const extra = Math.max(0, additionalKwh);
  if (extra <= 0) {
    return currentKwh > ELECTRICITY_TIER1_LIMIT_KWH
      ? ELECTRICITY_TIER2_RATE
      : ELECTRICITY_TIER1_RATE;
  }
  const before = calculateElectricity(currentKwh, 0).consumptionCharge;
  const after = calculateElectricity(currentKwh + extra, 0).consumptionCharge;
  return roundUnits((after - before) / extra, 6);
}

export function monthlyKwh(
  watts: number,
  hoursPerDay: number,
  qty: number,
  days = 30,
): number {
  const safeWatts = Math.max(0, watts);
  const safeHours = Math.max(0, hoursPerDay);
  const safeQty = Math.max(0, qty);
  return roundUnits((safeWatts * safeHours * days * safeQty) / 1000, 4);
}

function safeCount(value: number): number {
  return Math.max(0, Number.isFinite(value) ? value : 0);
}

function fleetCapacityKw(fleet: AcFleet): { load18: number; load24: number } {
  return {
    load18: safeCount(fleet.qty18) * AC_18K_KW * safeCount(fleet.hours18),
    load24: safeCount(fleet.qty24) * AC_24K_KW * safeCount(fleet.hours24),
  };
}

/**
 * Total AC kWh = (N18k × kW18k × h18 + N24k × kW24k × h24) × duty × days.
 * Duty is 1 at 20°C or below, 0.7 at 22°C or above.
 */
export function combinedAcMonthlyKwh(
  fleet: AcFleet,
  days = AC_DAYS_PER_MONTH,
  dutyCycle = AC_DUTY_CYCLE,
): number {
  const { load18, load24 } = fleetCapacityKw(fleet);
  return roundUnits((load18 + load24) * Math.max(0, dutyCycle) * days, 4);
}

export function applianceMonthlyCost(
  watts: number,
  hoursPerDay: number,
  qty: number,
  currentHouseholdKwh: number,
  days = 30,
): { monthlyKwh: number; monthlySar: number; effectiveRate: number } {
  const kwh = monthlyKwh(watts, hoursPerDay, qty, days);
  const rate = effectiveRateForAdditionalKwh(currentHouseholdKwh, kwh);
  const monthlySar = roundMoney(kwh * rate * (1 + VAT_RATE));
  return { monthlyKwh: kwh, monthlySar, effectiveRate: rate };
}

export function acFleetMonthlyCost(
  fleet: AcFleet,
  currentHouseholdKwh: number,
  dutyCycle = AC_DUTY_CYCLE,
): { monthlyKwh: number; monthlySar: number; effectiveRate: number } {
  const kwh = combinedAcMonthlyKwh(fleet, AC_DAYS_PER_MONTH, dutyCycle);
  const rate = effectiveRateForAdditionalKwh(currentHouseholdKwh, kwh);
  const monthlySar = roundMoney(kwh * rate * (1 + VAT_RATE));
  return { monthlyKwh: kwh, monthlySar, effectiveRate: rate };
}

export function costAppliances(
  inputs: ApplianceInput[],
  currentHouseholdKwh: number,
): ApplianceCost[] {
  return inputs.map((input) => {
    const config = APPLIANCES.find((a) => a.id === input.id);
    const watts = config?.watts ?? 0;
    const { monthlyKwh: kwh, monthlySar, effectiveRate } = applianceMonthlyCost(
      watts,
      input.hoursPerDay,
      input.qty,
      currentHouseholdKwh,
    );
    return {
      ...input,
      watts,
      monthlyKwh: kwh,
      monthlySar,
      effectiveRate,
    };
  });
}

function withHours(fleet: AcFleet, hours18: number, hours24: number): AcFleet {
  return { ...fleet, hours18: Math.max(0, hours18), hours24: Math.max(0, hours24) };
}

export function acTwoHoursEarlierSaving(
  fleet: AcFleet,
  currentHouseholdKwh: number,
  tempC: number | null = null,
): { savedKwh: number; savedSar: number } {
  const duty = acDutyCycleForTemp(tempC);
  const reduced = withHours(
    fleet,
    Math.max(0, fleet.hours18 - 2),
    Math.max(0, fleet.hours24 - 2),
  );
  const savedKwh = roundUnits(
    combinedAcMonthlyKwh(fleet, AC_DAYS_PER_MONTH, duty) -
      combinedAcMonthlyKwh(reduced, AC_DAYS_PER_MONTH, duty),
    4,
  );
  const rate = effectiveRateForAdditionalKwh(currentHouseholdKwh, savedKwh);
  return {
    savedKwh,
    savedSar: roundMoney(savedKwh * rate * (1 + VAT_RATE)),
  };
}

export function acSetpointSaving(
  fleet: AcFleet,
  currentHouseholdKwh: number,
  currentTempC: number,
  targetC = AC_TARGET_C,
): { factor: number; degrees: number; savedKwh: number; savedSar: number } {
  const degrees = Math.max(0, targetC - currentTempC);
  const factor = clamp(degrees * AC_SAVING_PER_DEGREE, 0, 0.8);
  const full = acFleetMonthlyCost(
    fleet,
    currentHouseholdKwh,
    acDutyCycleForTemp(currentTempC),
  );
  return {
    factor,
    degrees,
    savedKwh: roundUnits(full.monthlyKwh * factor, 4),
    savedSar: roundMoney(full.monthlySar * factor),
  };
}

export function acSetpoint24vs18Saving(
  fleet: AcFleet,
  currentHouseholdKwh: number,
): { factor: number; degrees: number; savedKwh: number; savedSar: number } {
  return acSetpointSaving(fleet, currentHouseholdKwh, 18);
}

export function acFilterCleaningSaving(
  fleet: AcFleet,
  currentHouseholdKwh: number,
  tempC: number | null = null,
): { savedKwh: number; savedSar: number } {
  const full = acFleetMonthlyCost(
    fleet,
    currentHouseholdKwh,
    acDutyCycleForTemp(tempC),
  );
  return {
    savedKwh: roundUnits(full.monthlyKwh * AC_DIRTY_FILTER_FACTOR, 4),
    savedSar: roundMoney(full.monthlySar * AC_DIRTY_FILTER_FACTOR),
  };
}

/** Combined kWh if the fleet runs 2 hours less, cooler setpoint, and clean filters. */
export function acOptimizedMonthlyKwh(
  fleet: AcFleet,
  currentTempC: number | null,
  filterOverdue: boolean,
): number {
  const reduced = withHours(
    fleet,
    Math.max(0, fleet.hours18 - 2),
    Math.max(0, fleet.hours24 - 2),
  );
  const targetTemp = currentTempC == null ? null : Math.max(currentTempC, AC_TARGET_C);
  let kwh = combinedAcMonthlyKwh(
    reduced,
    AC_DAYS_PER_MONTH,
    acDutyCycleForTemp(targetTemp ?? currentTempC),
  );
  if (currentTempC != null) {
    const degrees = Math.max(0, AC_TARGET_C - currentTempC);
    kwh *= 1 - clamp(degrees * AC_SAVING_PER_DEGREE, 0, 0.8);
  }
  if (filterOverdue) {
    kwh *= 1 - AC_DIRTY_FILTER_FACTOR;
  }
  return roundUnits(kwh, 4);
}

export function defaultApplianceInputs(): ApplianceInput[] {
  return APPLIANCES.map((a) => ({
    id: a.id,
    qty: a.defaultQty,
    hoursPerDay: a.defaultHours,
  }));
}

export function seasonFromMonth(month: number): ClimateSeason {
  const m = Math.min(12, Math.max(1, Math.round(month)));
  if (m >= 7 && m <= 10) return "summer";
  if (m >= 3 && m <= 6) return "spring";
  return "winter";
}

export function householdScale(summerPeakKwh: number): HouseholdScale {
  if (summerPeakKwh < SUMMER_EFFICIENT_KWH) return "efficient";
  if (summerPeakKwh <= SUMMER_HIGH_KWH) return "average";
  return "high";
}

export function projectSeasonalAnnual(
  inputKwh: number,
  inputSeason: ClimateSeason,
  meterFee: number = ELECTRICITY_METER_FEE_DEFAULT,
): SeasonalProjection {
  const safeKwh = Math.max(0, Number.isFinite(inputKwh) ? inputKwh : 0);
  const inputShare = SEASON_TYPICAL_MAX[inputSeason];
  const summerPeakKwh = inputShare > 0 ? safeKwh / inputShare : safeKwh;
  const order: ClimateSeason[] = ["summer", "winter", "spring"];
  const blocks: SeasonalMonthBlock[] = order.map((season) => {
    const monthlyKwh = roundUnits(
      season === inputSeason
        ? safeKwh
        : summerPeakKwh * SEASON_TYPICAL_MAX[season],
      4,
    );
    const monthlyBill = calculateElectricity(monthlyKwh, meterFee);
    return {
      season,
      monthlyKwh,
      monthCount: SEASON_MONTH_COUNT,
      monthlyBill,
      seasonTotal: roundMoney(monthlyBill.total * SEASON_MONTH_COUNT),
      source: season === inputSeason ? "measured" : "typical",
    };
  });
  const annualTotal = roundMoney(blocks.reduce((sum, block) => sum + block.seasonTotal, 0));
  const annualKwh = roundUnits(
    blocks.reduce((sum, block) => sum + block.monthlyKwh * block.monthCount, 0),
    4,
  );
  return {
    inputSeason,
    inputKwh: safeKwh,
    summerPeakKwh: roundUnits(summerPeakKwh, 4),
    blocks,
    annualTotal,
    annualKwh,
    scale: householdScale(summerPeakKwh),
  };
}

export function tier2AvoidanceAnnualSaving(
  projection: SeasonalProjection,
  optimizedSummerKwh: number,
): { dropsBelowTier2: boolean; savedSar: number; optimized: SeasonalProjection } {
  const summerBlock = projection.blocks.find((block) => block.season === "summer");
  const currentSummer = summerBlock?.monthlyKwh ?? projection.summerPeakKwh;
  const capped = Math.max(0, optimizedSummerKwh);
  const dropsBelowTier2 =
    currentSummer > ELECTRICITY_TIER1_LIMIT_KWH &&
    capped <= ELECTRICITY_TIER1_LIMIT_KWH;
  const winterKwh =
    projection.blocks.find((block) => block.season === "winter")?.monthlyKwh ?? 0;
  const springKwh =
    projection.blocks.find((block) => block.season === "spring")?.monthlyKwh ?? 0;
  const meterFee = summerBlock?.monthlyBill.meterFee ?? ELECTRICITY_METER_FEE_DEFAULT;
  const sourceOf = (season: ClimateSeason) =>
    projection.blocks.find((block) => block.season === season)?.source ?? "typical";
  const optimizedSummerBill = calculateElectricity(capped, meterFee);
  const winterBill = calculateElectricity(winterKwh, meterFee);
  const springBill = calculateElectricity(springKwh, meterFee);
  const optimizedTotal = roundMoney(
    optimizedSummerBill.total * SEASON_MONTH_COUNT +
      winterBill.total * SEASON_MONTH_COUNT +
      springBill.total * SEASON_MONTH_COUNT,
  );
  const optimized: SeasonalProjection = {
    ...projection,
    summerPeakKwh: roundUnits(capped, 4),
    blocks: [
      {
        season: "summer",
        monthlyKwh: roundUnits(capped, 4),
        monthCount: SEASON_MONTH_COUNT,
        monthlyBill: optimizedSummerBill,
        seasonTotal: roundMoney(optimizedSummerBill.total * SEASON_MONTH_COUNT),
        source: sourceOf("summer"),
      },
      {
        season: "winter",
        monthlyKwh: winterKwh,
        monthCount: SEASON_MONTH_COUNT,
        monthlyBill: winterBill,
        seasonTotal: roundMoney(winterBill.total * SEASON_MONTH_COUNT),
        source: sourceOf("winter"),
      },
      {
        season: "spring",
        monthlyKwh: springKwh,
        monthCount: SEASON_MONTH_COUNT,
        monthlyBill: springBill,
        seasonTotal: roundMoney(springBill.total * SEASON_MONTH_COUNT),
        source: sourceOf("spring"),
      },
    ],
    annualTotal: optimizedTotal,
    annualKwh: roundUnits(
      capped * SEASON_MONTH_COUNT +
        winterKwh * SEASON_MONTH_COUNT +
        springKwh * SEASON_MONTH_COUNT,
      4,
    ),
    scale: householdScale(capped),
  };
  return {
    dropsBelowTier2,
    savedSar: roundMoney(Math.max(0, projection.annualTotal - optimizedTotal)),
    optimized,
  };
}

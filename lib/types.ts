export type ServiceType = "electricity" | "water" | "both" | "unknown";

export type ActiveService = "idle" | "electricity";

export type Locale = "ar" | "en";

export type ParsedBill = {
  service_type: ServiceType;
  period_days: number | null;
  total_consumption: number | null;
  meter_fee: number | null;
  vat_amount: number | null;
  total_amount: number | null;
  electricity_kwh: number | null;
  water_m3: number | null;
};

export type WaterTierId = 1 | 2 | 3 | 4 | 5;

export type WaterTierUsage = {
  tier: WaterTierId;
  from: number;
  to: number | null;
  units: number;
  waterRate: number;
  sewageRate: number;
  combinedRate: number;
  waterCharge: number;
  sewageCharge: number;
  charge: number;
};

export type ElectricityBill = {
  kwh: number;
  meterFee: number;
  tier1Kwh: number;
  tier2Kwh: number;
  tier1Charge: number;
  tier2Charge: number;
  consumptionCharge: number;
  subtotal: number;
  vat: number;
  total: number;
  inExpensiveTier: boolean;
  remainingToTier2: number;
  progressToTier2: number;
  blendedRate: number;
  marginalRate: number;
};

export type WaterBill = {
  m3: number;
  hasSewage: boolean;
  meterFee: number;
  currentTier: WaterTierId;
  slabs: WaterTierUsage[];
  waterCharge: number;
  sewageCharge: number;
  consumptionCharge: number;
  subtotal: number;
  vat: number;
  total: number;
  remainingToNextTier: number | null;
  nextTier: WaterTierId | null;
};

export type ApplianceId = "ac18" | "ac24" | "heater" | "fridge" | "washer";

export type AcFilterHabit = "regular" | "overdue";

export type AcHoursMode = "shared" | "split";

/** Mixed 18k / 24k BTU fleet used by the AC savings engine. */
export type AcFleet = {
  qty18: number;
  qty24: number;
  hours18: number;
  hours24: number;
};

/** Three 4-month Saudi climate blocks (not calendar Q1–Q4). */
export type ClimateSeason = "summer" | "winter" | "spring";

export type HouseholdScale = "efficient" | "average" | "high";

export type SeasonalMonthBlock = {
  season: ClimateSeason;
  monthlyKwh: number;
  monthCount: number;
  monthlyBill: ElectricityBill;
  seasonTotal: number;
  source: "measured" | "typical";
};

export type SeasonalProjection = {
  inputSeason: ClimateSeason;
  inputKwh: number;
  summerPeakKwh: number;
  blocks: SeasonalMonthBlock[];
  annualTotal: number;
  annualKwh: number;
  scale: HouseholdScale;
};

export type ApplianceConfig = {
  id: ApplianceId;
  watts: number;
  defaultHours: number;
  defaultQty: number;
  isAc: boolean;
};

export type ApplianceInput = {
  id: ApplianceId;
  qty: number;
  hoursPerDay: number;
};

export type ApplianceCost = ApplianceInput & {
  watts: number;
  monthlyKwh: number;
  monthlySar: number;
  effectiveRate: number;
};

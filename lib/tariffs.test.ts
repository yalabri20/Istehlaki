import { describe, expect, it } from "vitest";
import {
  acFilterCleaningSaving,
  acDutyCycleForTemp,
  acSetpoint24vs18Saving,
  acSetpointSaving,
  acTwoHoursEarlierSaving,
  applianceMonthlyCost,
  calculateElectricity,
  clampElectricityKwh,
  combinedAcMonthlyKwh,
  ELECTRICITY_KWH_MAX,
  ELECTRICITY_SLIDER_MAX_DEFAULT,
  ELECTRICITY_TIER1_LIMIT_KWH,
  electricitySliderMax,
  householdScale,
  monthlyKwh,
  projectSeasonalAnnual,
  seasonFromMonth,
  SEASON_MONTH_COUNT,
  SEASON_TYPICAL_MAX,
  tier2AvoidanceAnnualSaving,
  VAT_RATE,
} from "./tariffs";

describe("calculateElectricity", () => {
  it("uses 0.18 SAR/kWh through 6,000 kWh", () => {
    const bill = calculateElectricity(6_000, 15);
    expect(bill.tier1Kwh).toBe(6_000);
    expect(bill.tier2Kwh).toBe(0);
    expect(bill.consumptionCharge).toBe(1_080);
    expect(bill.inExpensiveTier).toBe(false);
    expect(bill.remainingToTier2).toBe(0);
  });

  it("applies 0.30 SAR/kWh above 6,000 kWh", () => {
    const bill = calculateElectricity(7_000, 15);
    expect(bill.tier2Kwh).toBe(1_000);
    expect(bill.consumptionCharge).toBe(1_380);
    expect(bill.inExpensiveTier).toBe(true);
    expect(bill.marginalRate).toBe(0.3);
  });

  it("applies 15% VAT on consumption plus meter fee", () => {
    const bill = calculateElectricity(1_000, 15);
    expect(bill.consumptionCharge).toBe(180);
    expect(bill.subtotal).toBe(195);
    expect(bill.vat).toBe(29.25);
    expect(bill.total).toBe(224.25);
  });

  it("treats 6,001 kWh as the expensive tier", () => {
    const bill = calculateElectricity(6_001, 15);
    expect(bill.inExpensiveTier).toBe(true);
    expect(bill.progressToTier2).toBe(1);
    expect(bill.tier2Charge).toBe(0.3);
  });

  it("handles zero consumption with meter fee and VAT", () => {
    const bill = calculateElectricity(0, 15);
    expect(bill.consumptionCharge).toBe(0);
    expect(bill.subtotal).toBe(15);
    expect(bill.vat).toBe(2.25);
    expect(bill.total).toBe(17.25);
  });

  it("bills 50,000 kWh through both residential tiers plus VAT", () => {
    const bill = calculateElectricity(50_000, 15);
    expect(bill.tier1Kwh).toBe(6_000);
    expect(bill.tier2Kwh).toBe(44_000);
    expect(bill.consumptionCharge).toBe(1_080 + 13_200);
    expect(bill.inExpensiveTier).toBe(true);
  });
});

describe("electricity kWh input limits", () => {
  it("clamps manual kWh to 50,000", () => {
    expect(clampElectricityKwh(0)).toBe(0);
    expect(clampElectricityKwh(12_000)).toBe(12_000);
    expect(clampElectricityKwh(ELECTRICITY_KWH_MAX)).toBe(50_000);
    expect(clampElectricityKwh(80_000)).toBe(50_000);
  });

  it("keeps the slider at 30,000 until typed kWh exceeds it", () => {
    expect(electricitySliderMax(2_400)).toBe(ELECTRICITY_SLIDER_MAX_DEFAULT);
    expect(electricitySliderMax(30_000)).toBe(30_000);
    expect(electricitySliderMax(35_000)).toBe(35_000);
    expect(electricitySliderMax(50_000)).toBe(50_000);
    expect(electricitySliderMax(80_000)).toBe(50_000);
  });
});

describe("appliance simulator", () => {
  it("matches Monthly SAR = ((W * h * 30) / 1000) * rate * 1.15", () => {
    const kwh = monthlyKwh(1800, 8, 1, 30);
    expect(kwh).toBe(432);
    const { monthlySar, effectiveRate } = applianceMonthlyCost(1800, 8, 1, 2_000);
    expect(effectiveRate).toBeCloseTo(0.18, 6);
    expect(monthlySar).toBe(89.42);
  });

  it("uses the 30-halala rate once household usage is over the limit", () => {
    const { effectiveRate, monthlySar } = applianceMonthlyCost(
      2200,
      8,
      1,
      ELECTRICITY_TIER1_LIMIT_KWH,
    );
    expect(effectiveRate).toBeCloseTo(0.3, 6);
    expect(monthlySar).toBe(182.16);
  });

  it("credits two hours earlier on a mixed AC fleet", () => {
    const fleet = { qty18: 1, qty24: 0, hours18: 8, hours24: 8 };
    const saving = acTwoHoursEarlierSaving(fleet, 2_000);
    const full = combinedAcMonthlyKwh(fleet);
    const reduced = combinedAcMonthlyKwh({ ...fleet, hours18: 6, hours24: 6 });
    expect(saving.savedKwh).toBeCloseTo(full - reduced);
    expect(saving.savedSar).toBeGreaterThan(0);
  });

  it("credits ~36% for 24°C vs 18°C on the combined fleet", () => {
    const fleet = { qty18: 1, qty24: 0, hours18: 8, hours24: 8 };
    const saving = acSetpoint24vs18Saving(fleet, 2_000);
    expect(saving.factor).toBeCloseTo(0.36);
    expect(saving.degrees).toBe(6);
  });

  it("adds 18k and 24k units: (N18×kW18 + N24×kW24) × hours × 30", () => {
    const fleet = { qty18: 2, qty24: 3, hours18: 8, hours24: 8 };
    const expected = (2 * 1.8 + 3 * 2.2) * 8 * 1 * 30;
    expect(combinedAcMonthlyKwh(fleet)).toBeCloseTo(expected, 4);
  });

  it("uses per-size hours when the fleet is split", () => {
    const shared = combinedAcMonthlyKwh({
      qty18: 2,
      qty24: 3,
      hours18: 8,
      hours24: 8,
    });
    const split = combinedAcMonthlyKwh({
      qty18: 2,
      qty24: 3,
      hours18: 6,
      hours24: 10,
    });
    expect(split).not.toBe(shared);
    expect(split).toBeCloseTo((2 * 1.8 * 6 + 3 * 2.2 * 10) * 1 * 30, 4);
  });

  it("treats daily hours as per AC, not a house total", () => {
    const sevenAtEight = combinedAcMonthlyKwh({
      qty18: 7,
      qty24: 0,
      hours18: 8,
      hours24: 8,
    });
    const oneAtEight = combinedAcMonthlyKwh({
      qty18: 1,
      qty24: 0,
      hours18: 8,
      hours24: 8,
    });
    expect(sevenAtEight).toBeCloseTo(oneAtEight * 7);
    expect(sevenAtEight).not.toBe(
      combinedAcMonthlyKwh({ qty18: 7, qty24: 0, hours18: 42, hours24: 42 }),
    );
  });

  it("scales 24°C savings from the user’s current setpoint", () => {
    const fleet = { qty18: 1, qty24: 0, hours18: 8, hours24: 8 };
    const from22 = acSetpointSaving(fleet, 2_000, 22);
    expect(from22.degrees).toBe(2);
    expect(from22.factor).toBeCloseTo(0.12);
    const already24 = acSetpointSaving(fleet, 2_000, 24);
    expect(already24.savedSar).toBe(0);
  });

  it("credits ~10% when dirty filters are cleaned", () => {
    const fleet = { qty18: 1, qty24: 0, hours18: 8, hours24: 8 };
    const twoHour = acTwoHoursEarlierSaving(fleet, 2_000);
    const filter = acFilterCleaningSaving(fleet, 2_000);
    expect(filter.savedKwh).toBeGreaterThan(0);
    expect(filter.savedSar).toBeGreaterThan(0);
    expect(twoHour.savedSar).not.toBe(filter.savedSar);
  });

  it("uses compressor factor 1 at 20°C or below and 0.7 at 22°C or above", () => {
    expect(acDutyCycleForTemp(18)).toBe(1);
    expect(acDutyCycleForTemp(20)).toBe(1);
    expect(acDutyCycleForTemp(21)).toBe(1);
    expect(acDutyCycleForTemp(22)).toBe(0.7);
    expect(acDutyCycleForTemp(24)).toBe(0.7);
    expect(acDutyCycleForTemp(null)).toBe(1);
    const fleet = { qty18: 1, qty24: 0, hours18: 8, hours24: 8 };
    const cold = acTwoHoursEarlierSaving(fleet, 2_000, 18);
    const mild = acTwoHoursEarlierSaving(fleet, 2_000, 24);
    expect(cold.savedKwh).toBeCloseTo(mild.savedKwh / 0.7, 4);
    const from18 = acSetpointSaving(fleet, 2_000, 18);
    const from22 = acSetpointSaving(fleet, 2_000, 22);
    expect(from18.savedKwh).toBeGreaterThan(from22.savedKwh);
  });
});

describe("seasonal annual projection", () => {
  it("maps calendar months onto the three 4-month climate blocks", () => {
    expect(seasonFromMonth(8)).toBe("summer");
    expect(seasonFromMonth(1)).toBe("winter");
    expect(seasonFromMonth(4)).toBe("spring");
  });

  it("keeps the entered season as measured and bills the other seasons at typical home maxima", () => {
    const winterInput = 1_900;
    const projection = projectSeasonalAnnual(winterInput, "winter", 15);
    expect(projection.summerPeakKwh).toBeCloseTo(
      winterInput / SEASON_TYPICAL_MAX.winter,
      4,
    );
    const summer = projection.blocks.find((b) => b.season === "summer");
    const winter = projection.blocks.find((b) => b.season === "winter");
    const spring = projection.blocks.find((b) => b.season === "spring");
    expect(winter?.monthlyKwh).toBeCloseTo(winterInput, 4);
    expect(winter?.source).toBe("measured");
    expect(summer?.source).toBe("typical");
    expect(spring?.source).toBe("typical");
    expect(summer?.monthlyKwh).toBeCloseTo(projection.summerPeakKwh, 4);
    expect(spring?.monthlyKwh).toBeCloseTo(
      projection.summerPeakKwh * SEASON_TYPICAL_MAX.spring,
      4,
    );
    expect(summer?.monthCount).toBe(SEASON_MONTH_COUNT);
    expect(winter?.monthlyBill.total).not.toBe(summer?.monthlyBill.total);
  });

  it("applies tier tariffs, meter fee, and 15% VAT independently per season month", () => {
    const projection = projectSeasonalAnnual(5_000, "summer", 15);
    const summer = projection.blocks.find((b) => b.season === "summer");
    const winter = projection.blocks.find((b) => b.season === "winter");
    expect(summer?.monthlyBill.kwh).toBe(5_000);
    expect(summer?.monthlyBill.vat).toBe(
      roundTo((5_000 * 0.18 + 15) * VAT_RATE),
    );
    expect(summer?.monthlyBill.total).toBe(
      roundTo((5_000 * 0.18 + 15) * (1 + VAT_RATE)),
    );
    expect(summer?.seasonTotal).toBe(
      roundTo((summer?.monthlyBill.total ?? 0) * 4),
    );
    expect(winter?.monthlyBill.vat).toBe(
      roundTo((winter!.monthlyBill.subtotal) * VAT_RATE),
    );
    expect(projection.annualTotal).toBe(
      roundTo(projection.blocks.reduce((sum, b) => sum + b.seasonTotal, 0)),
    );
    expect(projection.scale).toBe("average");
  });

  it("classifies household scale from summer peak", () => {
    expect(householdScale(2_000)).toBe("efficient");
    expect(householdScale(3_500)).toBe("average");
    expect(householdScale(6_000)).toBe("average");
    expect(householdScale(6_001)).toBe("high");
  });

  it("reassigns which quarter is measured when the same kWh is tagged as another season", () => {
    const kwh = 4_000;
    const asSummer = projectSeasonalAnnual(kwh, "summer", 15);
    const asSpring = projectSeasonalAnnual(kwh, "spring", 15);
    expect(asSummer.blocks.find((b) => b.season === "summer")?.source).toBe(
      "measured",
    );
    expect(asSpring.blocks.find((b) => b.season === "spring")?.source).toBe(
      "measured",
    );
    expect(asSpring.summerPeakKwh).toBeGreaterThan(asSummer.summerPeakKwh);
    expect(asSummer.annualTotal).not.toBe(asSpring.annualTotal);
  });

  it("credits annual saving when AC optimization drops summer below 6,000 kWh", () => {
    const projection = projectSeasonalAnnual(7_200, "summer", 15);
    expect(projection.scale).toBe("high");
    const result = tier2AvoidanceAnnualSaving(projection, 5_800);
    expect(result.dropsBelowTier2).toBe(true);
    expect(result.savedSar).toBeGreaterThan(0);
    expect(result.optimized.scale).not.toBe("high");
    const stillHigh = tier2AvoidanceAnnualSaving(projection, 6_500);
    expect(stillHigh.dropsBelowTier2).toBe(false);
  });
});

function roundTo(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

import type { Locale } from "./types";

const numberOptions: Intl.NumberFormatOptions = {
  numberingSystem: "latn",
};

export function formatNumber(
  value: number,
  locale: Locale,
  options: Intl.NumberFormatOptions = {},
): string {
  const tag = locale === "ar" ? "ar-SA" : "en-US";
  return new Intl.NumberFormat(tag, { ...numberOptions, ...options }).format(
    Number.isFinite(value) ? value : 0,
  );
}

export function formatSar(value: number, locale: Locale, digits = 2): string {
  return `${formatNumber(value, locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} ${locale === "ar" ? "ر.س" : "SAR"}`;
}

export function formatKwh(value: number, locale: Locale): string {
  return `${formatNumber(value, locale, { maximumFractionDigits: 1 })} ${
    locale === "ar" ? "ك.و.س" : "kWh"
  }`;
}

export function formatM3(value: number, locale: Locale): string {
  return `${formatNumber(value, locale, { maximumFractionDigits: 1 })} ${
    locale === "ar" ? "م³" : "m³"
  }`;
}

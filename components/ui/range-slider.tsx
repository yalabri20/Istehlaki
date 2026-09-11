"use client";

import { cn } from "@/lib/utils";

type RangeSliderProps = {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  accent?: "teal" | "amber" | "rose" | "sky";
  ariaLabel?: string;
};

const accentClass = {
  teal: "accent-teal-800",
  amber: "accent-amber-500",
  rose: "accent-rose-600",
  sky: "accent-sky-600",
};

export function RangeSlider({
  value,
  min,
  max,
  step = 1,
  onChange,
  accent = "teal",
  ariaLabel,
}: RangeSliderProps) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={ariaLabel}
      onChange={(event) => onChange(Number(event.target.value))}
      className={cn(
        "h-2 w-full cursor-pointer appearance-none rounded-full bg-stone-200",
        accentClass[accent],
      )}
    />
  );
}

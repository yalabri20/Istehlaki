"use client";

import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function BrandMark() {
  return (
    <span
      aria-hidden
      className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-teal-700 to-teal-950 shadow-[0_6px_16px_-6px_rgba(15,94,87,0.8)]"
    >
      <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/15" />
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 text-gold"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z" />
      </svg>
    </span>
  );
}

export function Header() {
  const { locale, setLocale, t } = useI18n();

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/60 bg-[#f2efe6]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          <div className="leading-tight">
            <p className="text-xl font-black tracking-tight text-teal-950">
              {t("brand")}
            </p>
            <p className="hidden text-[11px] font-medium text-stone-500 sm:block">
              {t("tagline")}
            </p>
          </div>
        </div>

        <div className="flex rounded-full border border-stone-200 bg-white p-1 shadow-sm">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setLocale("ar")}
            className={cn(
              "min-w-16 transition-all",
              locale === "ar" &&
                "bg-teal-800 text-white hover:bg-teal-800 hover:text-white",
            )}
          >
            {t("langAr")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setLocale("en")}
            className={cn(
              "min-w-12 transition-all",
              locale === "en" &&
                "bg-teal-800 text-white hover:bg-teal-800 hover:text-white",
            )}
          >
            {t("langEn")}
          </Button>
        </div>
      </div>
    </header>
  );
}

"use client";

import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  const { locale, setLocale, t } = useI18n();

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-[#F4F1EA]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <p className="font-bold text-xl tracking-tight text-teal-950">
          {t("brand")}
        </p>

        <div className="flex rounded-full border border-stone-200 bg-white p-1 shadow-sm">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setLocale("ar")}
            className={cn(
              "min-w-16",
              locale === "ar" && "bg-teal-800 text-white hover:bg-teal-800 hover:text-white",
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
              "min-w-12",
              locale === "en" && "bg-teal-800 text-white hover:bg-teal-800 hover:text-white",
            )}
          >
            {t("langEn")}
          </Button>
        </div>
      </div>
    </header>
  );
}

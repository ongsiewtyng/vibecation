// src/lib/useHomeCurrency.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getSymbolByCurrencyCodeSync } from "@/config/currency";

interface HomeCurrencyState {
    homeCurrencyCode: string;
    homeCurrencySymbol: string;
    setHomeCurrencyCode: (code: string) => void;
}

/**
 * Global store + hook for home currency.
 * - Persists to localStorage (key: "home-currency")
 * - Default is "GBP" but you can override via API on app load.
 */
export const useHomeCurrencyStore = create<HomeCurrencyState>()(
    persist(
        (set) => ({
            homeCurrencyCode: "GBP", // will be overridden by API/localStorage
            homeCurrencySymbol: getSymbolByCurrencyCodeSync("GBP"),
            setHomeCurrencyCode: (code: string) =>
                set({
                    homeCurrencyCode: code,
                    homeCurrencySymbol: getSymbolByCurrencyCodeSync(code),
                }),
        }),
        {
            name: "home-currency",
        }
    )
);

/**
 * Convenience hook so import is nicer: useHomeCurrency()
 */
export const useHomeCurrency = () => {
    const homeCurrencyCode = useHomeCurrencyStore((s) => s.homeCurrencyCode);
    const homeCurrencySymbol = useHomeCurrencyStore((s) => s.homeCurrencySymbol);
    const setHomeCurrencyCode = useHomeCurrencyStore((s) => s.setHomeCurrencyCode);

    return { homeCurrencyCode, homeCurrencySymbol, setHomeCurrencyCode };
};

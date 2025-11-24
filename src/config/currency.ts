// src/config/currency.ts
// SSR-safe currency helpers (works in Vite now, works in Next.js/SSR later)

export interface CurrencyData {
    loadedAt: number;
    countryCurrencyMap: Record<string, string>;
    currencySymbolMap: Record<string, string>;
}

const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

// In-memory cache (server + client)
let memoryCache: CurrencyData | null = null;

// ---------- Minimal fallback so your app never breaks ----------
const FALLBACK_COUNTRY_TO_CURRENCY: Record<string, string> = {
    // Asia
    Malaysia: "MYR",
    Singapore: "SGD",
    Indonesia: "IDR",
    Thailand: "THB",
    Vietnam: "VND",
    Japan: "JPY",
    China: "CNY",
    India: "INR",
    Philippines: "PHP",
    "South Korea": "KRW",

    // Europe
    France: "EUR",
    Germany: "EUR",
    Italy: "EUR",
    Spain: "EUR",
    Netherlands: "EUR",
    Belgium: "EUR",
    Portugal: "EUR",
    Austria: "EUR",
    Ireland: "EUR",
    Finland: "EUR",
    Greece: "EUR",

    // UK & Commonwealth
    "United Kingdom": "GBP",
    Australia: "AUD",
    "New Zealand": "NZD",
    Canada: "CAD",

    // Americas
    "United States": "USD",
    Mexico: "MXN",
    Brazil: "BRL",
    Argentina: "ARS",

    // Middle East
    "Saudi Arabia": "SAR",
    "United Arab Emirates": "AED",
    Qatar: "QAR",
    Kuwait: "KWD",

    // Fallback
    default: "USD",
};

const FALLBACK_CURRENCY_SYMBOLS: Record<string, string> = {
    MYR: "RM",
    SGD: "S$",
    IDR: "Rp",
    THB: "฿",
    VND: "₫",
    JPY: "¥",
    CNY: "¥",
    KRW: "₩",
    PHP: "₱",
    INR: "₹",

    EUR: "€",
    GBP: "£",
    AUD: "A$",
    NZD: "NZ$",
    CAD: "C$",
    USD: "$",
    MXN: "$",
    BRL: "R$",
    ARS: "$",

    SAR: "﷼",
    AED: "د.إ",
    QAR: "﷼",
    KWD: "KD",
};

function isServer() {
    return typeof window === "undefined";
}

function isFresh(data: CurrencyData | null): boolean {
    return !!(data && Date.now() - data.loadedAt < CACHE_TTL);
}

// ---------- client-only storage helpers (guarded) ----------

function loadFromLocalStorage(): CurrencyData | null {
    if (isServer()) return null;
    try {
        const raw = window.localStorage.getItem("currency-data-v1");
        if (!raw) return null;
        const parsed = JSON.parse(raw) as CurrencyData;
        if (!parsed.countryCurrencyMap || !parsed.currencySymbolMap) return null;
        if (!isFresh(parsed)) return null;
        return parsed;
    } catch {
        return null;
    }
}

function saveToLocalStorage(data: CurrencyData) {
    if (isServer()) return;
    try {
        window.localStorage.setItem("currency-data-v1", JSON.stringify(data));
    } catch {
        // ignore
    }
}

// ---------- RestCountries fetcher ----------

async function fetchRestCountries(): Promise<CurrencyData> {
    const res = await fetch(
        "https://restcountries.com/v3.1/all?fields=name,currencies"
    );

    if (!res.ok) {
        throw new Error(`RestCountries error: ${res.status}`);
    }

    const countries = await res.json();

    const countryCurrencyMap: Record<string, string> = {};
    const currencySymbolMap: Record<string, string> = {};

    for (const c of countries) {
        const country = c?.name?.common as string | undefined;
        const currencies = c?.currencies as
            | {
            [code: string]: {
                name?: string;
                symbol?: string;
            };
        }
            | undefined;

        if (!country || !currencies) continue;

        const codes = Object.keys(currencies);
        if (!codes.length) continue;

        const code = codes[0]; // primary currency
        countryCurrencyMap[country] = code;

        const symbol = currencies[code]?.symbol;
        if (symbol) {
            currencySymbolMap[code] = symbol;
        }
    }

    return {
        loadedAt: Date.now(),
        countryCurrencyMap,
        currencySymbolMap,
    };
}

// ---------- Core loader (SSR-safe) ----------

async function loadCurrencyData(): Promise<CurrencyData> {
    // 1. In-memory cache
    if (isFresh(memoryCache)) {
        return memoryCache!;
    }

    // 2. On client: try localStorage
    if (!isServer()) {
        const cached = loadFromLocalStorage();
        if (cached) {
            memoryCache = cached;
            return cached;
        }
    }

    // 3. Fetch fresh from API
    try {
        const fresh = await fetchRestCountries();
        memoryCache = fresh;
        if (!isServer()) saveToLocalStorage(fresh);
        return fresh;
    } catch (err) {
        console.error("Failed to fetch currency data, using fallback.", err);

        if (!memoryCache) {
            memoryCache = {
                loadedAt: Date.now(),
                countryCurrencyMap: { ...FALLBACK_COUNTRY_TO_CURRENCY },
                currencySymbolMap: { ...FALLBACK_CURRENCY_SYMBOLS },
            };
        }
        return memoryCache!;
    }
}

// ---------- Public: async init (server or client) ----------

/**
 * Ensure currencies are loaded (SSR-safe).
 * Vite now: called once before React renders (see main.tsx).
 * Next.js later: can be used in server components or API routes.
 */
export async function ensureCurrenciesLoaded(): Promise<void> {
    await loadCurrencyData();
}

// Convenience alias for your old mental model
export async function initCurrencies(force?: boolean): Promise<void> {
    if (force) {
        memoryCache = null;
    }
    await ensureCurrenciesLoaded();
}

// ---------- Public: async helper (for servers later) ----------

export async function getCurrencyForCountry(
    country: string | null | undefined
): Promise<{ code: string; symbol: string }> {
    await ensureCurrenciesLoaded();
    const code = getCurrencyCodeSync(country);
    const symbol = getCurrencySymbolSync(country);
    return { code, symbol };
}

// ---------- Public: sync helpers (for client, after init) ----------

export function getCurrencyCodeSync(
    country: string | null | undefined
): string {
    if (!country) return "USD";

    const normalized = country.trim();

    const fromDynamic =
        memoryCache?.countryCurrencyMap?.[normalized] ??
        memoryCache?.countryCurrencyMap?.[capitalize(normalized)];

    if (fromDynamic) return fromDynamic;

    const fromFallback =
        FALLBACK_COUNTRY_TO_CURRENCY[normalized] ??
        FALLBACK_COUNTRY_TO_CURRENCY[capitalize(normalized)];

    return fromFallback || FALLBACK_COUNTRY_TO_CURRENCY.default || "USD";
}

export function getCurrencySymbolSync(
    country: string | null | undefined
): string {
    const code = getCurrencyCodeSync(country);

    const fromDynamic = memoryCache?.currencySymbolMap?.[code];
    if (fromDynamic) return fromDynamic;

    const fromFallback = FALLBACK_CURRENCY_SYMBOLS[code];
    if (fromFallback) return fromFallback;

    return "$";
}

// ---- Backwards-compatible exports for your current code ----

// TripDetail.tsx currently imports this: getCurrencySymbol(trip.country) :contentReference[oaicite:1]{index=1}
export function getCurrencySymbol(country: string | null | undefined): string {
    return getCurrencySymbolSync(country);
}

export function getCurrencyCode(country: string | null | undefined): string {
    return getCurrencyCodeSync(country);
}

// Direct by currency code
export function getSymbolByCurrencyCodeSync(
    code: string | null | undefined
): string {
    if (!code) return "$";
    const upper = code.toUpperCase();

    const fromDynamic = memoryCache?.currencySymbolMap?.[upper];
    if (fromDynamic) return fromDynamic;

    const fromFallback = FALLBACK_CURRENCY_SYMBOLS[upper];
    if (fromFallback) return fromFallback;

    return "$";
}

// ---------- Optional: async conversion (server or client) ----------

export async function convertCurrency(
    amount: number,
    from: string,
    to: string
): Promise<number> {
    const url = `https://api.exchangerate.host/convert?from=${encodeURIComponent(
        from
    )}&to=${encodeURIComponent(to)}&amount=${encodeURIComponent(amount)}`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
        throw new Error(`convertCurrency failed: ${res.status}`);
    }

    const data = await res.json();
    if (typeof data?.result !== "number") {
        throw new Error("Invalid exchange-rate response");
    }

    return data.result;
}

// ---------- Utility ----------

function capitalize(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

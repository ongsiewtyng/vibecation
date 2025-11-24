// src/main.tsx
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ensureCurrenciesLoaded } from "@/config/currency";

(async () => {
    try {
        // Load from localStorage or RestCountries before the app renders
        await ensureCurrenciesLoaded();
    } catch (e) {
        console.error("Failed to init currencies", e);
        // Fallback maps inside currency.ts will handle it anyway
    }

    const container = document.getElementById("root");
    if (!container) throw new Error("Root container #root not found");

    createRoot(container).render(<App />);
})();

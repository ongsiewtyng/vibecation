// src/components/AppInitializer.tsx
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHomeCurrency } from "@/lib/useHomeCurrency";

export function AppInitializer() {
    const { setHomeCurrencyCode } = useHomeCurrency();

    useEffect(() => {
        const load = async () => {
            const { data, error } = await supabase
                .from("user_settings")
                .select("home_currency")
                .limit(1)
                .maybeSingle();

            if (!error && data?.home_currency) {
                setHomeCurrencyCode(data.home_currency);
            }
        };

        load();
    }, [setHomeCurrencyCode]);

    return null;
}


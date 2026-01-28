import {Home, Map, Heart, Moon, Sun, Calendar, Compass, Plane, FileSpreadsheet} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    useSidebar,
} from "@/components/ui/sidebar";
import { useHomeCurrency } from "@/lib/useHomeCurrency";
import { supabase } from "@/integrations/supabase/client"; // ⬅️ add this

const menuItems = [
    { title: "Dashboard", url: "/", icon: Home },
    { title: "Workbooks", url: "/workbooks", icon: FileSpreadsheet },
    { title: "Calendar", url: "/calendar", icon: Calendar },
    { title: "Explore", url: "/explore", icon: Compass },
    { title: "Wishlist", url: "/wishlist", icon: Heart },
    { title: "Flight Tickets", url: "/flight-tickets", icon: Plane },
];

// Whatever you want to support as home currencies
const HOME_CURRENCIES = [
    { code: "GBP", label: "GBP (£)" },
    { code: "MYR", label: "MYR (RM)" },
    { code: "USD", label: "USD ($)" },
    { code: "EUR", label: "EUR (€)" },
];

export function AppSidebar() {
    const { state } = useSidebar();
    const location = useLocation();
    const { theme, setTheme } = useTheme();
    const collapsed = state === "collapsed";

    const { homeCurrencyCode, setHomeCurrencyCode } = useHomeCurrency();

    // ⬇️ when user changes currency: update Zustand + Supabase
    const handleCurrencyChange = async (code: string) => {
        // update global state immediately so UI feels instant
        setHomeCurrencyCode(code);

        try {
            const { error } = await supabase
                .from("user_settings")
                .upsert(
                    {
                        id: 1, // single global settings row
                        home_currency: code,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "id" } // for supabase-js v2
                );

            if (error) {
                console.error("Failed to save home currency to Supabase", error);
            }
        } catch (err) {
            console.error("Unexpected error saving home currency", err);
        }
    };

    return (
        <Sidebar collapsible="icon" className={collapsed ? "w-14" : "w-64"}>
            <SidebarHeader className="border-b border-sidebar-border p-4">
                <div className="flex items-center justify-between">
                    {!collapsed && (
                        <div className="flex items-center gap-2">
                            <Map className="h-6 w-6 text-primary" />
                            <span className="font-semibold text-lg">TripPlanner</span>
                        </div>
                    )}
                    {collapsed && <Map className="h-6 w-6 text-primary mx-auto" />}
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    {!collapsed && <SidebarGroupLabel>Navigation</SidebarGroupLabel>}
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <NavLink
                                            to={item.url}
                                            end
                                            className="hover:bg-sidebar-accent"
                                            activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                                        >
                                            <item.icon
                                                className={collapsed ? "mx-auto" : "mr-2 h-4 w-4"}
                                            />
                                            {!collapsed && <span>{item.title}</span>}
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Footer: home currency + theme */}
                <div className="mt-auto p-4 border-t border-sidebar-border space-y-3">
                    {/* Home currency selector */}
                    <div className="flex items-center gap-2">
                        {!collapsed && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                Home currency
              </span>
                        )}
                        <select
                            className={`flex-1 rounded-md border border-sidebar-border bg-sidebar px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                                collapsed ? "text-center" : ""
                            }`}
                            value={homeCurrencyCode}
                            onChange={(e) => handleCurrencyChange(e.target.value)}
                        >
                            {HOME_CURRENCIES.map((c) => (
                                <option key={c.code} value={c.code}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Theme toggle */}
                    <Button
                        variant="ghost"
                        size={collapsed ? "icon" : "default"}
                        className="w-full"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    >
                        {theme === "dark" ? (
                            <Sun className={collapsed ? "h-5 w-5" : "mr-2 h-4 w-4"} />
                        ) : (
                            <Moon className={collapsed ? "h-5 w-5" : "mr-2 h-4 w-4"} />
                        )}
                        {!collapsed && <span>Toggle theme</span>}
                    </Button>
                </div>
            </SidebarContent>
        </Sidebar>
    );
}

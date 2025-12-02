import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppInitializer } from "@/components/AppInitializer"; // add this
import MainLayout from "@/components/layout/MainLayout";
import Index from "./pages/Index";
import TripDetail from "./pages/TripDetail";
import Wishlist from "./pages/Wishlist";
import Calendar from "./pages/Calendar";
import Explore from "./pages/Explore";
import FlightTickets from "./pages/FlightTickets";
import SharedTripView from "./pages/SharedTripView";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="travel-planner-theme">
            <TooltipProvider>
                <AppInitializer />   {/* <-- load home currency before UI renders */}
                <Toaster />
                <Sonner />
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<MainLayout />}>
                            <Route index element={<Index />} />
                            <Route path="/trip/:id" element={<TripDetail />} />
                            <Route path="/wishlist" element={<Wishlist />} />
                            <Route path="/calendar" element={<Calendar />} />
                            <Route path="/explore" element={<Explore />} />
                            <Route path="/flight-tickets" element={<FlightTickets />} />
                        </Route>
                        <Route path="/shared/:token" element={<SharedTripView />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </BrowserRouter>
            </TooltipProvider>
        </ThemeProvider>
    </QueryClientProvider>
);

export default App;

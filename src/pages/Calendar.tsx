import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isWithinInterval, isBefore, isAfter } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();

  const { data: trips = [] } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const { data, error } = await supabase.from("trips").select("*").order("start_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getTripStatus = (trip: any) => {
    const today = new Date();
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    
    if (isBefore(end, today)) return "past";
    if (isWithinInterval(today, { start, end })) return "current";
    return "upcoming";
  };

  const getTripsForDay = (day: Date) => {
    return trips.filter(trip => {
      const start = new Date(trip.start_date);
      const end = new Date(trip.end_date);
      return isWithinInterval(day, { start, end });
    });
  };

  const statusColors = {
    past: "bg-muted/50 text-muted-foreground",
    current: "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30",
    upcoming: "bg-primary/20 text-primary border-primary/30",
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h1 className="text-3xl font-bold">Trip Calendar</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{format(currentDate, "MMMM yyyy")}</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div key={day} className="text-center font-semibold text-sm text-muted-foreground">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {daysInMonth.map((day, idx) => {
                const dayTrips = getTripsForDay(day);
                return (
                  <div
                    key={idx}
                    className={`min-h-24 p-2 border rounded-lg ${
                      !isSameMonth(day, currentDate) ? "bg-muted/20" : ""
                    } ${isToday(day) ? "ring-2 ring-primary" : ""}`}
                  >
                    <div className="text-sm font-medium mb-1">{format(day, "d")}</div>
                    <div className="space-y-1">
                      {dayTrips.map((trip) => {
                        const status = getTripStatus(trip);
                        return (
                          <div
                            key={trip.id}
                            onClick={() => navigate(`/trip/${trip.id}`)}
                            className={`text-xs p-1 rounded border cursor-pointer hover:opacity-80 transition-opacity truncate ${statusColors[status]}`}
                            title={trip.title}
                          >
                            {trip.title}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border bg-muted/50"></div>
            <span className="text-sm">Past</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border bg-green-500/20 border-green-500/30"></div>
            <span className="text-sm">Current</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border bg-primary/20 border-primary/30"></div>
            <span className="text-sm">Upcoming</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;

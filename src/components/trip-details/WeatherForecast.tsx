import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, CloudRain, Sun, Wind, Droplets, CloudSnow } from "lucide-react";
import { format } from "date-fns";

interface WeatherForecastProps {
  destination: string;
  country: string;
  startDate: string;
  endDate: string;
}

const WeatherForecast = ({ destination, country, startDate, endDate }: WeatherForecastProps) => {
  const { data: weather, isLoading } = useQuery({
    queryKey: ["weather", destination, country, startDate],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-weather-forecast", {
        body: { destination, country, startDate, endDate },
      });
      if (error) throw error;
      return data;
    },
  });

  const getWeatherIcon = (condition: string) => {
    const lower = condition.toLowerCase();
    if (lower.includes("rain")) return <CloudRain className="h-8 w-8 text-primary" />;
    if (lower.includes("snow")) return <CloudSnow className="h-8 w-8 text-primary" />;
    if (lower.includes("cloud")) return <Cloud className="h-8 w-8 text-muted-foreground" />;
    if (lower.includes("sun") || lower.includes("clear")) return <Sun className="h-8 w-8 text-secondary" />;
    return <Cloud className="h-8 w-8 text-muted-foreground" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weather Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading weather data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!weather?.forecast) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weather Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Weather data unavailable</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Weather Forecast for {destination}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {weather.forecast.map((day: any, idx: number) => (
            <Card key={idx} className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{format(new Date(day.date), "EEE, MMM d")}</p>
                  {getWeatherIcon(day.condition)}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">{day.temp}°C</span>
                    <span className="text-sm text-muted-foreground">{day.condition}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Wind className="h-3 w-3" />
                      <span>{day.wind} km/h</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Droplets className="h-3 w-3" />
                      <span>{day.humidity}%</span>
                    </div>
                  </div>
                  {day.precipitation && (
                    <p className="text-xs text-primary">Rain: {day.precipitation}mm</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherForecast;

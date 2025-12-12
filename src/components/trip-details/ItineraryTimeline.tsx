import { format, parseISO } from "date-fns";
import { MapPin, Clock, Pencil, Trash2, Home, Sparkles, Sun, Sunset, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ItineraryItem {
  id: string;
  day_number: number;
  date: string;
  time: string | null;
  time_of_day: string | null;
  title: string;
  location: string | null;
  description: string | null;
  is_ai_suggested: boolean | null;
}

interface Accommodation {
  id: string;
  name: string;
  address: string | null;
  check_in: string;
  check_out: string;
  is_ai_suggested: boolean | null;
}

interface DayGroup {
  dayNumber: number;
  date: string;
  items: TimelineEntry[];
}

interface TimelineEntry {
  id: string;
  type: 'activity' | 'stay-checkin' | 'stay-checkout';
  time: string | null;
  timeOfDay: string | null;
  title: string;
  location: string | null;
  description: string | null;
  isAiSuggested: boolean;
  originalItem?: ItineraryItem;
  originalStay?: Accommodation;
}

interface ItineraryTimelineProps {
  items: ItineraryItem[];
  accommodations: Accommodation[];
  tripStartDate: string;
  onEditItem: (item: ItineraryItem) => void;
  onDeleteItem: (id: string) => void;
  onEditStay?: (stay: Accommodation) => void;
}

function getTimeOfDayIcon(timeOfDay: string | null, time: string | null) {
  if (timeOfDay === 'morning' || (time && parseInt(time.split(':')[0]) < 12)) {
    return <Sun className="h-3.5 w-3.5" />;
  }
  if (timeOfDay === 'afternoon' || (time && parseInt(time.split(':')[0]) >= 12 && parseInt(time.split(':')[0]) < 17)) {
    return <Sunset className="h-3.5 w-3.5" />;
  }
  if (timeOfDay === 'evening' || (time && parseInt(time.split(':')[0]) >= 17)) {
    return <Moon className="h-3.5 w-3.5" />;
  }
  return <Clock className="h-3.5 w-3.5" />;
}

function getTimeOfDayLabel(timeOfDay: string | null): string {
  if (timeOfDay === 'morning') return 'Morning';
  if (timeOfDay === 'afternoon') return 'Afternoon';
  if (timeOfDay === 'evening') return 'Evening';
  return '';
}

function sortTimelineEntries(entries: TimelineEntry[]): TimelineEntry[] {
  const timeOfDayOrder = { 'morning': 0, 'afternoon': 1, 'evening': 2 };
  
  return entries.sort((a, b) => {
    // Check-ins first, then activities, then check-outs
    if (a.type === 'stay-checkin' && b.type !== 'stay-checkin') return -1;
    if (b.type === 'stay-checkin' && a.type !== 'stay-checkin') return 1;
    if (a.type === 'stay-checkout' && b.type !== 'stay-checkout') return 1;
    if (b.type === 'stay-checkout' && a.type !== 'stay-checkout') return -1;
    
    // Sort by time if available
    if (a.time && b.time) {
      return a.time.localeCompare(b.time);
    }
    
    // Sort by time of day
    const aOrder = a.timeOfDay ? timeOfDayOrder[a.timeOfDay as keyof typeof timeOfDayOrder] ?? 3 : 3;
    const bOrder = b.timeOfDay ? timeOfDayOrder[b.timeOfDay as keyof typeof timeOfDayOrder] ?? 3 : 3;
    return aOrder - bOrder;
  });
}

export default function ItineraryTimeline({
  items,
  accommodations,
  tripStartDate,
  onEditItem,
  onDeleteItem,
  onEditStay,
}: ItineraryTimelineProps) {
  // Group items by day_number
  const dayGroups: DayGroup[] = [];
  const dayMap = new Map<number, TimelineEntry[]>();

  // Add itinerary items
  items.forEach((item) => {
    const entries = dayMap.get(item.day_number) || [];
    entries.push({
      id: item.id,
      type: 'activity',
      time: item.time,
      timeOfDay: item.time_of_day,
      title: item.title,
      location: item.location,
      description: item.description,
      isAiSuggested: item.is_ai_suggested || false,
      originalItem: item,
    });
    dayMap.set(item.day_number, entries);
  });

  // Add accommodation check-ins and check-outs
  accommodations.forEach((stay) => {
    // Find which day number corresponds to check-in date
    const checkInDate = parseISO(stay.check_in);
    const tripStart = parseISO(tripStartDate);
    const checkInDayNumber = Math.floor((checkInDate.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const checkOutDate = parseISO(stay.check_out);
    const checkOutDayNumber = Math.floor((checkOutDate.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (checkInDayNumber > 0) {
      const entries = dayMap.get(checkInDayNumber) || [];
      entries.push({
        id: `${stay.id}-checkin`,
        type: 'stay-checkin',
        time: null,
        timeOfDay: 'afternoon',
        title: `Check in: ${stay.name}`,
        location: stay.address,
        description: null,
        isAiSuggested: stay.is_ai_suggested || false,
        originalStay: stay,
      });
      dayMap.set(checkInDayNumber, entries);
    }

    if (checkOutDayNumber > 0 && checkOutDayNumber !== checkInDayNumber) {
      const entries = dayMap.get(checkOutDayNumber) || [];
      entries.push({
        id: `${stay.id}-checkout`,
        type: 'stay-checkout',
        time: null,
        timeOfDay: 'morning',
        title: `Check out: ${stay.name}`,
        location: stay.address,
        description: null,
        isAiSuggested: stay.is_ai_suggested || false,
        originalStay: stay,
      });
      dayMap.set(checkOutDayNumber, entries);
    }
  });

  // Build sorted day groups
  const sortedDayNumbers = Array.from(dayMap.keys()).sort((a, b) => a - b);
  sortedDayNumbers.forEach((dayNumber) => {
    const entries = dayMap.get(dayNumber) || [];
    const firstItem = items.find((i) => i.day_number === dayNumber);
    const date = firstItem?.date || tripStartDate;
    
    dayGroups.push({
      dayNumber,
      date,
      items: sortTimelineEntries(entries),
    });
  });

  if (dayGroups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {dayGroups.map((group) => (
        <div key={group.dayNumber} className="relative">
          {/* Day Header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                {group.dayNumber}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Day {group.dayNumber}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(group.date), "EEEE, MMMM d, yyyy")}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative ml-5 pl-6 border-l-2 border-border">
            {group.items.map((entry, index) => (
              <div
                key={entry.id}
                className={cn(
                  "relative pb-6 last:pb-0",
                  index === group.items.length - 1 && "pb-0"
                )}
              >
                {/* Timeline dot */}
                <div
                  className={cn(
                    "absolute -left-[25px] w-4 h-4 rounded-full border-2 border-background",
                    entry.type === 'activity' && "bg-primary",
                    entry.type === 'stay-checkin' && "bg-emerald-500",
                    entry.type === 'stay-checkout' && "bg-amber-500"
                  )}
                />

                {/* Card */}
                <div
                  className={cn(
                    "group relative rounded-lg border bg-card p-4 transition-all hover:shadow-md",
                    entry.type.startsWith('stay') && "border-l-4",
                    entry.type === 'stay-checkin' && "border-l-emerald-500",
                    entry.type === 'stay-checkout' && "border-l-amber-500"
                  )}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {entry.type.startsWith('stay') ? (
                          <Home className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          getTimeOfDayIcon(entry.timeOfDay, entry.time)
                        )}
                        
                        {entry.time && (
                          <Badge variant="outline" className="text-xs font-mono">
                            {entry.time}
                          </Badge>
                        )}
                        
                        {!entry.time && entry.timeOfDay && (
                          <Badge variant="secondary" className="text-xs">
                            {getTimeOfDayLabel(entry.timeOfDay)}
                          </Badge>
                        )}

                        {entry.isAiSuggested && (
                          <Badge variant="outline" className="text-xs gap-1 text-primary border-primary/30">
                            <Sparkles className="h-3 w-3" />
                            Suggested
                          </Badge>
                        )}
                      </div>

                      <h4 className="font-medium text-foreground leading-tight">
                        {entry.title}
                      </h4>

                      {entry.location && (
                        <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{entry.location}</span>
                        </p>
                      )}

                      {entry.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {entry.description}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {entry.type === 'activity' && entry.originalItem && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => onEditItem(entry.originalItem!)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => onDeleteItem(entry.originalItem!.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {entry.type.startsWith('stay') && entry.originalStay && onEditStay && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => onEditStay(entry.originalStay!)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

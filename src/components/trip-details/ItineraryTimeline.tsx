import { format, parseISO } from "date-fns";
import { MapPin, Clock, Pencil, Trash2, Home, Sparkles, Sun, Sunset, Moon, ChevronLeft, ChevronRight, Star, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";

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
  // Extended fields for AI suggestions
  star_rating?: number;
  review_score?: number;
  neighborhood?: string;
  price_range?: string;
}

interface DayGroup {
  dayNumber: number;
  date: string;
  items: TimelineEntry[];
  hotelSuggestions: Accommodation[];
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

function getTimeValue(entry: TimelineEntry): number {
  // Check-ins at 14:00, check-outs at 10:00 by default
  if (entry.type === 'stay-checkin') return 1400;
  if (entry.type === 'stay-checkout') return 1000;
  
  if (entry.time) {
    const [h, m] = entry.time.split(':').map(Number);
    return h * 100 + m;
  }
  
  // Time of day fallback
  if (entry.timeOfDay === 'morning') return 900;
  if (entry.timeOfDay === 'afternoon') return 1400;
  if (entry.timeOfDay === 'evening') return 1900;
  
  return 1200; // Default to noon
}

function sortTimelineEntries(entries: TimelineEntry[]): TimelineEntry[] {
  return entries.sort((a, b) => {
    return getTimeValue(a) - getTimeValue(b);
  });
}

// Hotel Suggestions Carousel Component
function HotelSuggestionsCarousel({ 
  hotels, 
  onEdit 
}: { 
  hotels: Accommodation[];
  onEdit?: (stay: Accommodation) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (hotels.length === 0) return null;
  
  const currentHotel = hotels[currentIndex];
  
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + hotels.length) % hotels.length);
  };
  
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % hotels.length);
  };
  
  // Generate mock data for demo (in real app, this would come from AI)
  const starRating = currentHotel.star_rating || Math.floor(Math.random() * 2) + 3; // 3-4 stars
  const reviewScore = currentHotel.review_score || (7 + Math.random() * 2).toFixed(1);
  const neighborhood = currentHotel.neighborhood || currentHotel.address?.split(',')[0] || 'City Center';
  const priceRange = currentHotel.price_range || ['$80-120', '$100-150', '$150-200'][Math.floor(Math.random() * 3)];
  
  return (
    <div className="relative rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">AI Hotel Suggestions</span>
        </div>
        {hotels.length > 1 && (
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={handlePrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground px-2">
              {currentIndex + 1} / {hotels.length}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      <div className="bg-card rounded-lg border p-4 transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium text-foreground truncate">{currentHotel.name}</h4>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {/* Star Rating */}
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-3.5 w-3.5",
                      i < starRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
              
              {/* Review Score */}
              <Badge variant="secondary" className="text-xs font-medium">
                {reviewScore}/10
              </Badge>
              
              {/* Neighborhood */}
              <Badge variant="outline" className="text-xs">
                {neighborhood}
              </Badge>
              
              {/* Price Range */}
              <span className="text-xs text-muted-foreground">{priceRange}/night</span>
            </div>
            
            {currentHotel.address && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{currentHotel.address}</span>
              </p>
            )}
          </div>
          
          {onEdit && (
            <Button
              size="sm"
              variant="outline"
              className="flex-shrink-0"
              onClick={() => onEdit(currentHotel)}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          )}
        </div>
      </div>
      
      {/* Dot indicators for pagination */}
      {hotels.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {hotels.map((_, i) => (
            <button
              key={i}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors",
                i === currentIndex ? "bg-primary" : "bg-muted-foreground/30"
              )}
              onClick={() => setCurrentIndex(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ItineraryTimeline({
  items,
  accommodations,
  tripStartDate,
  onEditItem,
  onDeleteItem,
  onEditStay,
}: ItineraryTimelineProps) {
  // Group items by date (not day_number) for proper chronological sorting
  const dayGroups: DayGroup[] = [];
  const dateMap = new Map<string, { entries: TimelineEntry[], hotelSuggestions: Accommodation[] }>();

  // Add itinerary items grouped by date
  items.forEach((item) => {
    const dateKey = item.date;
    const group = dateMap.get(dateKey) || { entries: [], hotelSuggestions: [] };
    group.entries.push({
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
    dateMap.set(dateKey, group);
  });

  // Add accommodation check-ins and check-outs by date
  accommodations.forEach((stay) => {
    const checkInDateKey = stay.check_in.split('T')[0];
    const checkOutDateKey = stay.check_out.split('T')[0];

    // If AI suggested, add to hotel suggestions instead of inline
    if (stay.is_ai_suggested) {
      const group = dateMap.get(checkInDateKey) || { entries: [], hotelSuggestions: [] };
      group.hotelSuggestions.push(stay);
      dateMap.set(checkInDateKey, group);
    } else {
      // Regular check-in entry
      const checkInGroup = dateMap.get(checkInDateKey) || { entries: [], hotelSuggestions: [] };
      checkInGroup.entries.push({
        id: `${stay.id}-checkin`,
        type: 'stay-checkin',
        time: null,
        timeOfDay: 'afternoon',
        title: `Check in: ${stay.name}`,
        location: stay.address,
        description: null,
        isAiSuggested: false,
        originalStay: stay,
      });
      dateMap.set(checkInDateKey, checkInGroup);

      // Check-out entry (only if different date)
      if (checkOutDateKey !== checkInDateKey) {
        const checkOutGroup = dateMap.get(checkOutDateKey) || { entries: [], hotelSuggestions: [] };
        checkOutGroup.entries.push({
          id: `${stay.id}-checkout`,
          type: 'stay-checkout',
          time: null,
          timeOfDay: 'morning',
          title: `Check out: ${stay.name}`,
          location: stay.address,
          description: null,
          isAiSuggested: false,
          originalStay: stay,
        });
        dateMap.set(checkOutDateKey, checkOutGroup);
      }
    }
  });

  // Build sorted day groups by date
  const sortedDates = Array.from(dateMap.keys()).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );
  
  const tripStart = parseISO(tripStartDate);
  
  sortedDates.forEach((dateKey) => {
    const group = dateMap.get(dateKey)!;
    const date = parseISO(dateKey);
    const dayNumber = Math.floor((date.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    if (dayNumber > 0) {
      dayGroups.push({
        dayNumber,
        date: dateKey,
        items: sortTimelineEntries(group.entries),
        hotelSuggestions: group.hotelSuggestions,
      });
    }
  });

  if (dayGroups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {dayGroups.map((group) => (
        <div key={group.date} className="relative">
          {/* Day Header - Subtle divider style */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 py-3 mb-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                {group.dayNumber}
              </div>
              <div>
                <h3 className="text-base font-medium text-foreground">
                  Day {group.dayNumber}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(group.date), "EEEE, MMMM d")}
                </p>
              </div>
            </div>
          </div>

          {/* Hotel Suggestions Carousel (if any AI suggestions for this day) */}
          {group.hotelSuggestions.length > 0 && (
            <HotelSuggestionsCarousel 
              hotels={group.hotelSuggestions} 
              onEdit={onEditStay}
            />
          )}

          {/* Timeline Cards */}
          <div className="space-y-3 ml-1">
            {group.items.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  "group relative rounded-lg border bg-card p-4 transition-all hover:shadow-sm hover:border-border/80",
                  entry.type.startsWith('stay') && "border-l-4",
                  entry.type === 'stay-checkin' && "border-l-emerald-500/70",
                  entry.type === 'stay-checkout' && "border-l-amber-500/70"
                )}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="text-muted-foreground">
                        {entry.type.startsWith('stay') ? (
                          <Home className="h-4 w-4" />
                        ) : (
                          getTimeOfDayIcon(entry.timeOfDay, entry.time)
                        )}
                      </span>
                      
                      {entry.time && (
                        <Badge variant="outline" className="text-xs font-mono h-5">
                          {entry.time}
                        </Badge>
                      )}
                      
                      {!entry.time && entry.timeOfDay && (
                        <Badge variant="secondary" className="text-xs h-5">
                          {getTimeOfDayLabel(entry.timeOfDay)}
                        </Badge>
                      )}

                      {entry.isAiSuggested && (
                        <Badge variant="outline" className="text-xs gap-1 text-primary border-primary/30 h-5">
                          <Sparkles className="h-3 w-3" />
                          Suggested
                        </Badge>
                      )}
                    </div>

                    <h4 className="font-medium text-foreground leading-snug">
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
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

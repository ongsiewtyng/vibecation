import {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {useQuery} from "@tanstack/react-query";
import {supabase} from "@/integrations/supabase/client";
import {SidebarTrigger} from "@/components/ui/sidebar";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Button} from "@/components/ui/button";
import {ArrowLeft, Share2} from "lucide-react";
import {useNavigate} from "react-router-dom";
import ItineraryTab from "@/components/trip-details/ItineraryTab";
import AccommodationsTab from "@/components/trip-details/AccommodationsTab";
import TransportTab from "@/components/trip-details/TransportTab";
import ExpensesTab from "@/components/trip-details/ExpensesTab";
import PackingTab from "@/components/trip-details/PackingTab";
import AttachmentsTab from "@/components/trip-details/AttachmentsTab";
import { BudgetAllocationTab } from "@/components/trip-details/BudgetAllocationTab";
import TripTimeline from "@/components/trip-details/TripTimeline";
import TripSharingDialog from "@/components/sharing/TripSharingDialog";
import WeatherForecast from "@/components/trip-details/WeatherForecast";
import {format, differenceInDays} from "date-fns";
import GoogleMapComponent from "@/components/maps/GoogleMapComponent";
import {getCurrencyCode, getCurrencySymbol, getSymbolByCurrencyCodeSync} from "@/config/currency";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";

const TripDetail = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const [showSharing, setShowSharing] = useState(false);
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
    const [mapMarkers, setMapMarkers] = useState([]);


    const {data: trip} = useQuery({
        queryKey: ["trip", id],
        queryFn: async () => {
            const {data, error} = await supabase
                .from("trips")
                .select("*")
                .eq("id", id)
                .single();

            if (error) throw error;
            return data;
        },
    });

    const {data: accommodations = []} = useQuery({
        queryKey: ["accommodations", id],
        queryFn: async () => {
            const {data, error} = await supabase
                .from("accommodations")
                .select("*")
                .eq("trip_id", id);
            if (error) throw error;
            return data;
        },
    });

    const {data: transports = []} = useQuery({
        queryKey: ["transports", id],
        queryFn: async () => {
            const {data, error} = await supabase
                .from("transports")
                .select("*")
                .eq("trip_id", id);
            if (error) throw error;
            return data;
        },
    });

    const {data: itineraryItems = []} = useQuery({
        queryKey: ["itinerary", id],
        queryFn: async () => {
            const {data, error} = await supabase
                .from("itinerary_items")
                .select("*")
                .eq("trip_id", id);
            if (error) throw error;
            return data;
        },
    });

    useEffect(() => {
        if (!trip) return;

        async function loadCoords() {
            const markers: any[] = [];

            // 1. Main destination
            if (trip.destination) {
                const {data} = await supabase.functions.invoke("geocode-location", {
                    body: {query: `${trip.destination}, ${trip.country}`}
                });

                if (data?.lat) {
                    setMapCenter({lat: data.lat, lng: data.lng});
                }
            }

            // 2. Accommodations
            for (const a of accommodations) {
                if (!a.address) continue;

                const {data} = await supabase.functions.invoke("geocode-location", {
                    body: {query: a.address}
                });

                if (data?.lat) {
                    markers.push({
                        position: {lat: data.lat, lng: data.lng},
                        title: a.name,
                    });
                }
            }

            // 3. Itinerary
            for (const i of itineraryItems) {
                if (!i.location) continue;

                const {data} = await supabase.functions.invoke("geocode-location", {
                    body: {query: i.location}
                });

                if (data?.lat) {
                    markers.push({
                        position: {lat: data.lat, lng: data.lng},
                        title: i.title,
                    });
                }
            }

            setMapMarkers(markers);
        }

        loadCoords();
    }, [trip, accommodations, itineraryItems]);

    if (!trip) {
        return <div className="p-6">Loading...</div>;
    }

    const duration = differenceInDays(
        new Date(trip.end_date),
        new Date(trip.start_date)
    );

    const tripCurrencyCode = getCurrencyCode(trip.country);
    const currencySymbol = getSymbolByCurrencyCodeSync(tripCurrencyCode);

    return (
        <div className="min-h-screen bg-background">
            <header
                className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger/>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate("/")}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4"/>
                                Back
                            </Button>
                        </div>
                        <Button onClick={() => setShowSharing(true)} variant="outline">
                            <Share2 className="mr-2 h-4 w-4"/>
                            Share Trip
                        </Button>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">{trip.title}</h1>
                        <p className="text-muted-foreground mt-1">
                            {trip.destination}, {trip.country} • {duration} days •{" "}
                            {format(new Date(trip.start_date), "MMM d")} -{" "}
                            {format(new Date(trip.end_date), "MMM d, yyyy")}
                        </p>
                    </div>
                </div>
            </header>

            <div className="container mx-auto p-6">
                {/* Map View */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Trip Map</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <GoogleMapComponent
                            center={mapCenter}
                            zoom={10}
                            markers={mapMarkers}
                            className="w-full h-96 rounded-lg"
                        />
                    </CardContent>
                </Card>

                <div className="mb-6">
                    <WeatherForecast
                        destination={trip.destination}
                        country={trip.country}
                        startDate={trip.start_date}
                        endDate={trip.end_date}
                    />
                </div>

                <Tabs defaultValue="itinerary" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 lg:w-auto">
                        <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
                        <TabsTrigger value="timeline">Timeline</TabsTrigger>
                        <TabsTrigger value="accommodations">Stays</TabsTrigger>
                        <TabsTrigger value="transport">Transport</TabsTrigger>
                        <TabsTrigger value="budget">Budget</TabsTrigger>
                        <TabsTrigger value="expenses">Expenses</TabsTrigger>
                        <TabsTrigger value="packing">Packing</TabsTrigger>
                        <TabsTrigger value="attachments">Files</TabsTrigger>
                    </TabsList>

                    <TabsContent value="itinerary">
                        <ItineraryTab tripId={id!} trip={trip}/>
                    </TabsContent>

                    <TabsContent value="timeline">
                        <TripTimeline tripId={id!}/>
                    </TabsContent>

                    <TabsContent value="accommodations">
                        <AccommodationsTab tripId={id!}/>
                    </TabsContent>

                    <TabsContent value="transport">
                        <TransportTab tripId={id!}/>
                    </TabsContent>

                    <TabsContent value="budget">
                        <BudgetAllocationTab 
                            tripId={id!} 
                            totalBudget={trip.budget}
                            currency={tripCurrencyCode}
                        />
                    </TabsContent>

                    <TabsContent value="expenses">
                        <ExpensesTab
                            tripId={trip.id}
                            budget={trip.budget}
                            tripCurrencyCode={tripCurrencyCode}
                            currencySymbol={currencySymbol}
                        />
                    </TabsContent>

                    <TabsContent value="packing">
                        <PackingTab tripId={id!}/>
                    </TabsContent>

                    <TabsContent value="attachments">
                        <AttachmentsTab tripId={id!}/>
                    </TabsContent>
                </Tabs>
            </div>

            <TripSharingDialog
                open={showSharing}
                onClose={() => setShowSharing(false)}
                tripId={id!}
            />
        </div>
    );
};

export default TripDetail;

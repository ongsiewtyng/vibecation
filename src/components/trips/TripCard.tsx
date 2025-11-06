import { useNavigate } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import { MapPin, Calendar, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TripCardProps {
  trip: any;
  onEdit: (trip: any) => void;
  onRefetch: () => void;
}

const TripCard = ({ trip, onEdit, onRefetch }: TripCardProps) => {
  const navigate = useNavigate();
  const duration = differenceInDays(
    new Date(trip.end_date),
    new Date(trip.start_date)
  );

  const handleDelete = async () => {
    const { error } = await supabase.from("trips").delete().eq("id", trip.id);

    if (error) {
      toast.error("Failed to delete trip");
      return;
    }

    toast.success("Trip deleted");
    onRefetch();
  };

  return (
    <Card className="group hover:shadow-medium transition-all duration-300 cursor-pointer">
      <CardHeader
        className="pb-3"
        onClick={() => navigate(`/trip/${trip.id}`)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
              {trip.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>
                {trip.destination}, {trip.country}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent onClick={() => navigate(`/trip/${trip.id}`)} className="pb-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {format(new Date(trip.start_date), "MMM d")} -{" "}
            {format(new Date(trip.end_date), "MMM d, yyyy")}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {duration} {duration === 1 ? "day" : "days"}
        </p>
      </CardContent>

      <CardFooter className="flex gap-2 pt-3 border-t">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(trip);
          }}
        >
          <Edit className="h-3.5 w-3.5 mr-1" />
          Edit
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="outline" size="sm">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete trip?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{trip.title}" and all associated
                data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
};

export default TripCard;

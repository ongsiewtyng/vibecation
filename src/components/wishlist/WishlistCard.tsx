import { Star, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface WishlistCardProps {
  item: any;
  onEdit: (item: any) => void;
  onRefetch: () => void;
}

const WishlistCard = ({ item, onEdit, onRefetch }: WishlistCardProps) => {
  const handleDelete = async () => {
    const { error } = await supabase.from("wishlist").delete().eq("id", item.id);

    if (error) {
      toast.error("Failed to delete item");
      return;
    }

    toast.success("Item deleted");
    onRefetch();
  };

  return (
    <Card className="hover:shadow-medium transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">{item.place}</h3>
            <p className="text-sm text-muted-foreground">{item.country}</p>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: item.priority || 3 }).map((_, i) => (
              <Star
                key={i}
                className="h-4 w-4 fill-secondary text-secondary"
              />
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {item.tags.map((tag: string, i: number) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        {item.notes && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.notes}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 pt-3 border-t">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onEdit(item)}
        >
          <Edit className="h-3.5 w-3.5 mr-1" />
          Edit
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete destination?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{item.place}".
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

export default WishlistCard;

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WishlistFormDialogProps {
  open: boolean;
  onClose: () => void;
  item?: any;
  onSuccess: () => void;
}

const WishlistFormDialog = ({ open, onClose, item, onSuccess }: WishlistFormDialogProps) => {
  const [formData, setFormData] = useState({
    place: "",
    country: "",
    priority: 3,
    tags: "",
    notes: "",
  });

  useEffect(() => {
    if (item) {
      setFormData({
        place: item.place || "",
        country: item.country || "",
        priority: item.priority || 3,
        tags: item.tags ? item.tags.join(", ") : "",
        notes: item.notes || "",
      });
    } else {
      setFormData({
        place: "",
        country: "",
        priority: 3,
        tags: "",
        notes: "",
      });
    }
  }, [item, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      place: formData.place,
      country: formData.country,
      priority: formData.priority,
      tags: formData.tags
        ? formData.tags.split(",").map((t) => t.trim()).filter((t) => t)
        : [],
      notes: formData.notes || null,
    };

    if (item) {
      const { error } = await supabase
        .from("wishlist")
        .update(data)
        .eq("id", item.id);

      if (error) {
        toast.error("Failed to update destination");
        return;
      }
      toast.success("Destination updated");
    } else {
      const { error } = await supabase.from("wishlist").insert([data]);

      if (error) {
        toast.error("Failed to add destination");
        return;
      }
      toast.success("Destination added");
    }

    onSuccess();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {item ? "Edit Destination" : "Add Destination"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="place">Place *</Label>
              <Input
                id="place"
                value={formData.place}
                onChange={(e) =>
                  setFormData({ ...formData, place: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={String(formData.priority)}
              onValueChange={(value) =>
                setFormData({ ...formData, priority: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">⭐ Low</SelectItem>
                <SelectItem value="2">⭐⭐ Medium-Low</SelectItem>
                <SelectItem value="3">⭐⭐⭐ Medium</SelectItem>
                <SelectItem value="4">⭐⭐⭐⭐ High</SelectItem>
                <SelectItem value="5">⭐⭐⭐⭐⭐ Must Visit!</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
              placeholder="beach, adventure, culture"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={4}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{item ? "Update" : "Add"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WishlistFormDialog;

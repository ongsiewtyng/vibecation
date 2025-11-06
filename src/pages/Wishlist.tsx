import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import WishlistCard from "@/components/wishlist/WishlistCard";
import WishlistFormDialog from "@/components/wishlist/WishlistFormDialog";

const Wishlist = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const { data: items = [], refetch } = useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishlist")
        .select("*")
        .order("priority", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold">Travel Wishlist</h1>
              <p className="text-sm text-muted-foreground">
                Dream destinations to visit
              </p>
            </div>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Destination
          </Button>
        </div>
      </header>

      <div className="container mx-auto p-6">
        {items.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <WishlistCard
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onRefetch={refetch}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No destinations yet</h3>
            <p className="text-muted-foreground mb-6">
              Start building your dream travel list
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Destination
            </Button>
          </div>
        )}
      </div>

      <WishlistFormDialog
        open={showForm}
        onClose={handleClose}
        item={editingItem}
        onSuccess={refetch}
      />
    </div>
  );
};

export default Wishlist;

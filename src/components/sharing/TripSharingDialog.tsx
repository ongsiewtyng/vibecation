import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Copy, Link2, Mail, Trash2, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface TripSharingDialogProps {
  open: boolean;
  onClose: () => void;
  tripId: string;
}

const TripSharingDialog = ({ open, onClose, tripId }: TripSharingDialogProps) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("viewer");
  const [loading, setLoading] = useState(false);

  const { data: shares = [], refetch: refetchShares } = useQuery({
    queryKey: ["trip-shares", tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_shares")
        .select("*")
        .eq("trip_id", tripId);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: publicLink, refetch: refetchPublicLink } = useQuery({
    queryKey: ["public-link", tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_trip_links")
        .select("*")
        .eq("trip_id", tripId)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const handleShareWithUser = async () => {
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("trip_shares").insert([
      {
        trip_id: tripId,
        shared_with_email: email,
        role,
      },
    ]);

    if (error) {
      toast.error("Failed to share trip");
    } else {
      toast.success("Trip shared successfully");
      setEmail("");
      refetchShares();
    }
    setLoading(false);
  };

  const handleCreatePublicLink = async () => {
    setLoading(true);
    const shareToken = crypto.randomUUID();
    const { error } = await supabase.from("public_trip_links").insert([
      {
        trip_id: tripId,
        share_token: shareToken,
        is_active: true,
      },
    ]);

    if (error) {
      toast.error("Failed to create public link");
    } else {
      toast.success("Public link created");
      refetchPublicLink();
    }
    setLoading(false);
  };

  const handleCopyPublicLink = () => {
    if (publicLink) {
      const url = `${window.location.origin}/shared/${publicLink.share_token}`;
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };

  const handleRevokePublicLink = async () => {
    if (!publicLink) return;
    
    setLoading(true);
    const { error } = await supabase
      .from("public_trip_links")
      .update({ is_active: false })
      .eq("id", publicLink.id);

    if (error) {
      toast.error("Failed to revoke link");
    } else {
      toast.success("Public link revoked");
      refetchPublicLink();
    }
    setLoading(false);
  };

  const handleRemoveShare = async (shareId: string) => {
    const { error } = await supabase
      .from("trip_shares")
      .delete()
      .eq("id", shareId);

    if (error) {
      toast.error("Failed to remove access");
    } else {
      toast.success("Access removed");
      refetchShares();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Trip</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Public Link Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <h3 className="font-semibold">Public Link</h3>
            </div>
            {publicLink ? (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Input
                      value={`${window.location.origin}/shared/${publicLink.share_token}`}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyPublicLink}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={handleRevokePublicLink}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Anyone with this link can view your trip
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Button
                variant="outline"
                onClick={handleCreatePublicLink}
                disabled={loading}
                className="w-full"
              >
                <Link2 className="mr-2 h-4 w-4" />
                Create Public Link
              </Button>
            )}
          </div>

          <Separator />

          {/* Share with specific users */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <h3 className="font-semibold">Share with Specific Users</h3>
            </div>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Permission</Label>
                <Select value={role} onValueChange={(v) => setRole(v as "viewer" | "editor")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer (Read-only)</SelectItem>
                    <SelectItem value="editor">Editor (Can modify)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleShareWithUser} disabled={loading}>
                Share Trip
              </Button>
            </div>
          </div>

          {/* List of shared users */}
          {shares.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold">People with access</h3>
                <div className="space-y-2">
                  {shares.map((share) => (
                    <Card key={share.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{share.shared_with_email}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {share.role}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveShare(share.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TripSharingDialog;

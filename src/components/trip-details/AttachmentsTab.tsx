import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AttachmentUploadDialog from "./AttachmentUploadDialog";
import { useToast } from "@/hooks/use-toast";

const AttachmentsTab = ({ tripId }: { tripId: string }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ["attachments", tripId],
    queryFn: async () => {
      const { data, error } = await supabase.from("attachments").select("*").eq("trip_id", tripId);
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: any) => {
      const filePath = item.file_url.split('/attachments/')[1];
      await supabase.storage.from('attachments').remove([filePath]);
      const { error } = await supabase.from("attachments").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments", tripId] });
      toast({ title: "File deleted" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Attachments</h2>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />Upload File
        </Button>
      </div>
      {items.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No files uploaded</CardContent></Card>
      ) : (
        items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-medium">{item.file_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.file_size ? `${(item.file_size / 1024).toFixed(1)} KB` : 'Unknown size'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => window.open(item.file_url, '_blank')}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(item)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
      <AttachmentUploadDialog open={dialogOpen} onOpenChange={setDialogOpen} tripId={tripId} />
    </div>
  );
};

export default AttachmentsTab;

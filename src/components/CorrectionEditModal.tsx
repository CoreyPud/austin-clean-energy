import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Save, Trash2, RotateCcw } from "lucide-react";

interface CorrectionEditModalProps {
  projectId: string;
  onClose: () => void;
  onSave: () => void;
}

interface OriginalData {
  installed_kw: number | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  completed_date: string | null;
  applied_date: string | null;
  issued_date: string | null;
  description: string | null;
}

interface CorrectionData {
  corrected_kw: number | null;
  corrected_address: string | null;
  corrected_latitude: number | null;
  corrected_longitude: number | null;
  corrected_completed_date: string | null;
  corrected_applied_date: string | null;
  corrected_issued_date: string | null;
  corrected_description: string | null;
  is_duplicate: boolean;
  notes: string | null;
}

export function CorrectionEditModal({ projectId, onClose, onSave }: CorrectionEditModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [original, setOriginal] = useState<OriginalData | null>(null);
  const [correction, setCorrection] = useState<CorrectionData>({
    corrected_kw: null,
    corrected_address: null,
    corrected_latitude: null,
    corrected_longitude: null,
    corrected_completed_date: null,
    corrected_applied_date: null,
    corrected_issued_date: null,
    corrected_description: null,
    is_duplicate: false,
    notes: null,
  });
  const [hasExistingCorrection, setHasExistingCorrection] = useState(false);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    const token = sessionStorage.getItem('admin_token');
    if (!token) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-corrections', {
        body: { action: 'get', project_id: projectId },
        headers: { 'x-admin-token': token }
      });

      if (error) throw error;

      setOriginal(data?.original || null);
      
      if (data?.correction) {
        setHasExistingCorrection(true);
        setCorrection({
          corrected_kw: data.correction.corrected_kw,
          corrected_address: data.correction.corrected_address,
          corrected_latitude: data.correction.corrected_latitude,
          corrected_longitude: data.correction.corrected_longitude,
          corrected_completed_date: data.correction.corrected_completed_date,
          corrected_applied_date: data.correction.corrected_applied_date,
          corrected_issued_date: data.correction.corrected_issued_date,
          corrected_description: data.correction.corrected_description,
          is_duplicate: data.correction.is_duplicate || false,
          notes: data.correction.notes,
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Failed to load installation data");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const token = sessionStorage.getItem('admin_token');
    if (!token) return;

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-corrections', {
        body: {
          action: 'save',
          project_id: projectId,
          corrections: {
            installed_kw: correction.corrected_kw,
            address: correction.corrected_address,
            latitude: correction.corrected_latitude,
            longitude: correction.corrected_longitude,
            completed_date: correction.corrected_completed_date,
            applied_date: correction.corrected_applied_date,
            issued_date: correction.corrected_issued_date,
            description: correction.corrected_description,
            is_duplicate: correction.is_duplicate,
          },
          notes: correction.notes,
        },
        headers: { 'x-admin-token': token }
      });

      if (error) throw error;

      toast.success("Correction saved successfully");
      onSave();
    } catch (error) {
      console.error('Error saving correction:', error);
      toast.error("Failed to save correction");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const token = sessionStorage.getItem('admin_token');
    if (!token) return;

    if (!confirm("Remove this correction and restore original values?")) return;

    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('manage-corrections', {
        body: { action: 'delete', project_id: projectId },
        headers: { 'x-admin-token': token }
      });

      if (error) throw error;

      toast.success("Correction removed, original values restored");
      onSave();
    } catch (error) {
      console.error('Error deleting correction:', error);
      toast.error("Failed to remove correction");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '';
    return date.split('T')[0];
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Installation
            {hasExistingCorrection && (
              <Badge variant="outline" className="ml-2">Has Corrections</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Project ID: <code className="bg-muted px-1 rounded">{projectId}</code>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Duplicate Flag */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <div>
                  <Label>Mark as Duplicate</Label>
                  <p className="text-sm text-muted-foreground">
                    Hide this record from public views
                  </p>
                </div>
              </div>
              <Switch
                checked={correction.is_duplicate}
                onCheckedChange={(checked) => setCorrection(prev => ({ ...prev, is_duplicate: checked }))}
              />
            </div>

            {/* kW Field */}
            <div className="space-y-2">
              <Label>Installed kW</Label>
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter corrected kW"
                    value={correction.corrected_kw ?? ''}
                    onChange={(e) => setCorrection(prev => ({
                      ...prev,
                      corrected_kw: e.target.value ? parseFloat(e.target.value) : null
                    }))}
                  />
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Original: {original?.installed_kw ?? 'N/A'}
                </span>
              </div>
            </div>

            {/* Address Field */}
            <div className="space-y-2">
              <Label>Address</Label>
              <div className="space-y-1">
                <Input
                  placeholder="Enter corrected address"
                  value={correction.corrected_address ?? ''}
                  onChange={(e) => setCorrection(prev => ({
                    ...prev,
                    corrected_address: e.target.value || null
                  }))}
                />
                <p className="text-sm text-muted-foreground">
                  Original: {original?.address ?? 'N/A'}
                </p>
              </div>
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="Latitude"
                  value={correction.corrected_latitude ?? ''}
                  onChange={(e) => setCorrection(prev => ({
                    ...prev,
                    corrected_latitude: e.target.value ? parseFloat(e.target.value) : null
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Original: {original?.latitude ?? 'N/A'}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="Longitude"
                  value={correction.corrected_longitude ?? ''}
                  onChange={(e) => setCorrection(prev => ({
                    ...prev,
                    corrected_longitude: e.target.value ? parseFloat(e.target.value) : null
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Original: {original?.longitude ?? 'N/A'}
                </p>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Applied Date</Label>
                <Input
                  type="date"
                  value={correction.corrected_applied_date ? formatDate(correction.corrected_applied_date) : ''}
                  onChange={(e) => setCorrection(prev => ({
                    ...prev,
                    corrected_applied_date: e.target.value || null
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Orig: {formatDate(original?.applied_date) || 'N/A'}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Issued Date</Label>
                <Input
                  type="date"
                  value={correction.corrected_issued_date ? formatDate(correction.corrected_issued_date) : ''}
                  onChange={(e) => setCorrection(prev => ({
                    ...prev,
                    corrected_issued_date: e.target.value || null
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Orig: {formatDate(original?.issued_date) || 'N/A'}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Completed Date</Label>
                <Input
                  type="date"
                  value={correction.corrected_completed_date ? formatDate(correction.corrected_completed_date) : ''}
                  onChange={(e) => setCorrection(prev => ({
                    ...prev,
                    corrected_completed_date: e.target.value || null
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Orig: {formatDate(original?.completed_date) || 'N/A'}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Enter corrected description"
                value={correction.corrected_description ?? ''}
                onChange={(e) => setCorrection(prev => ({
                  ...prev,
                  corrected_description: e.target.value || null
                }))}
                rows={2}
              />
              <p className="text-sm text-muted-foreground line-clamp-2">
                Original: {original?.description ?? 'N/A'}
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Admin Notes</Label>
              <Textarea
                placeholder="Add notes about this correction..."
                value={correction.notes ?? ''}
                onChange={(e) => setCorrection(prev => ({
                  ...prev,
                  notes: e.target.value || null
                }))}
                rows={2}
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2 sm:gap-0">
          {hasExistingCorrection && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving || loading}
              className="mr-auto"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore Original
            </Button>
          )}
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Correction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Save, ChevronDown, ChevronUp } from "lucide-react";
import type { PropertyPoint } from "@/components/PropertyMap";

interface PropertyEditModalProps {
  property: PropertyPoint;
  onClose: () => void;
  onSave: (updated: PropertyPoint) => void;
}

type PermitFields = {
  permit_number: string;
  installed_kw: string;
  status_current: string;
  issued_date: string;
  completed_date: string;
  contractor_company: string;
  total_job_valuation: string;
  link: string;
};

function permitToFields(p: any): PermitFields {
  return {
    permit_number:       p.permit_number ?? "",
    installed_kw:        p.installed_kw != null ? String(p.installed_kw) : "",
    status_current:      p.status_current ?? "",
    issued_date:         p.issued_date ? p.issued_date.slice(0, 10) : "",
    completed_date:      p.completed_date ? p.completed_date.slice(0, 10) : "",
    contractor_company:  p.contractor_company ?? "",
    total_job_valuation: p.total_job_valuation != null ? String(p.total_job_valuation) : "",
    link:                p.link ?? "",
  };
}

export function PropertyEditModal({ property, onClose, onSave }: PropertyEditModalProps) {
  const [saving, setSaving] = useState(false);

  const [fields, setFields] = useState({
    situs_address:              property.address ?? "",
    situs_zip:                  property.zip ?? "",
    county:                     property.county ?? "",
    property_type:              property.property_type ?? "other",
    has_solar:                  property.has_solar ?? false,
    py_owner_name:              property.owner ?? "",
    year_built:                 property.year_built != null ? String(property.year_built) : "",
    market_value:               property.market_value != null ? String(property.market_value) : "",
    estimated_roof_sqft:        property.roof_sqft != null ? String(property.roof_sqft) : "",
    land_type_desc:             property.land_type_desc ?? "",
    dist_nearest_gas_plant_mi:  property.dist_gas != null ? String(property.dist_gas) : "",
    dist_proposed_peaker_mi:    property.dist_peaker != null ? String(property.dist_peaker) : "",
  });

  const set = (key: keyof typeof fields, value: string | boolean) =>
    setFields(prev => ({ ...prev, [key]: value }));

  // Per-permit edit state keyed by permit id
  const [permitFields, setPermitFields] = useState<Record<string | number, PermitFields>>(() => {
    const init: Record<string | number, PermitFields> = {};
    for (const p of property.solar_permits ?? []) {
      if (p.id != null) init[p.id] = permitToFields(p);
    }
    return init;
  });

  const [openPermits, setOpenPermits] = useState<Set<string | number>>(new Set());

  const togglePermit = (id: string | number) =>
    setOpenPermits(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const setPermit = (id: string | number, key: keyof PermitFields, value: string) =>
    setPermitFields(prev => ({ ...prev, [id]: { ...prev[id], [key]: value } }));

  const handleSave = async () => {
    const token = sessionStorage.getItem('admin_token');
    if (!token) {
      toast.error("Not logged in as admin");
      return;
    }

    setSaving(true);
    try {
      // Save property fields
      const propertyPayload: Record<string, unknown> = {
        situs_address:             fields.situs_address || null,
        situs_zip:                 fields.situs_zip || null,
        county:                    fields.county || null,
        property_type:             fields.property_type || null,
        has_solar:                 fields.has_solar,
        py_owner_name:             fields.py_owner_name || null,
        year_built:                fields.year_built ? parseInt(fields.year_built, 10) : null,
        market_value:              fields.market_value ? parseFloat(fields.market_value) : null,
        estimated_roof_sqft:       fields.estimated_roof_sqft ? parseFloat(fields.estimated_roof_sqft) : null,
        land_type_desc:            fields.land_type_desc || null,
        dist_nearest_gas_plant_mi: fields.dist_nearest_gas_plant_mi ? parseFloat(fields.dist_nearest_gas_plant_mi) : null,
        dist_proposed_peaker_mi:   fields.dist_proposed_peaker_mi ? parseFloat(fields.dist_proposed_peaker_mi) : null,
      };

      const { data: propData, error: propError } = await supabase.functions.invoke('update-tcad-property', {
        body: { pid: property.pid, fields: propertyPayload },
        headers: { 'x-admin-token': token },
      });
      if (propError) throw propError;

      // Save any expanded (edited) permits
      const permitIds = Object.keys(permitFields).filter(id => openPermits.has(id) || openPermits.has(Number(id)));
      for (const id of permitIds) {
        const pf = permitFields[id];
        const permitPayload: Record<string, unknown> = {
          permit_number:       pf.permit_number || null,
          installed_kw:        pf.installed_kw ? parseFloat(pf.installed_kw) : null,
          status_current:      pf.status_current || null,
          issued_date:         pf.issued_date || null,
          completed_date:      pf.completed_date || null,
          contractor_company:  pf.contractor_company || null,
          total_job_valuation: pf.total_job_valuation ? parseFloat(pf.total_job_valuation) : null,
          link:                pf.link || null,
        };
        const { error: permitError } = await supabase.functions.invoke('update-tcad-property', {
          body: { permit_id: id, fields: permitPayload },
          headers: { 'x-admin-token': token },
        });
        if (permitError) throw permitError;
      }

      // Merge updated permit values back into solar_permits
      const updatedPermits = (property.solar_permits ?? []).map(p => {
        const pf = p.id != null ? permitFields[p.id] : null;
        if (!pf) return p;
        return {
          ...p,
          permit_number:       pf.permit_number || null,
          installed_kw:        pf.installed_kw ? parseFloat(pf.installed_kw) : null,
          status_current:      pf.status_current || null,
          issued_date:         pf.issued_date || null,
          completed_date:      pf.completed_date || null,
          contractor_company:  pf.contractor_company || null,
          total_job_valuation: pf.total_job_valuation ? parseFloat(pf.total_job_valuation) : null,
          link:                pf.link || null,
        };
      });

      const updated: PropertyPoint = {
        ...property,
        address:        propData.updated.situs_address,
        zip:            propData.updated.situs_zip,
        county:         propData.updated.county,
        property_type:  propData.updated.property_type,
        has_solar:      propData.updated.has_solar,
        owner:          propData.updated.py_owner_name,
        year_built:     propData.updated.year_built,
        market_value:   propData.updated.market_value,
        roof_sqft:      propData.updated.estimated_roof_sqft,
        land_type_desc: propData.updated.land_type_desc,
        dist_gas:       propData.updated.dist_nearest_gas_plant_mi,
        dist_peaker:    propData.updated.dist_proposed_peaker_mi,
        solar_permits:  updatedPermits,
      };

      toast.success("Saved");
      onSave(updated);
    } catch (err) {
      console.error('Error saving:', err);
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const permits: any[] = property.solar_permits ?? [];

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Property</DialogTitle>
          <DialogDescription>
            PID: <code className="bg-muted px-1 rounded">{property.pid}</code>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Address */}
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input value={fields.situs_address} onChange={e => set('situs_address', e.target.value)} />
          </div>

          {/* ZIP / County */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>ZIP</Label>
              <Input value={fields.situs_zip} onChange={e => set('situs_zip', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>County</Label>
              <Input value={fields.county} onChange={e => set('county', e.target.value)} />
            </div>
          </div>

          {/* Property type / Has solar */}
          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="space-y-1.5">
              <Label>Property type</Label>
              <Select value={fields.property_type} onValueChange={v => set('property_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_family">Single Family</SelectItem>
                  <SelectItem value="multifamily">Multifamily</SelectItem>
                  <SelectItem value="condo">Condo</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between border rounded-md px-4 py-2 h-10">
              <Label className="cursor-pointer" htmlFor="has-solar-toggle">Has solar</Label>
              <Switch
                id="has-solar-toggle"
                checked={fields.has_solar}
                onCheckedChange={v => set('has_solar', v)}
              />
            </div>
          </div>

          {/* Owner */}
          <div className="space-y-1.5">
            <Label>Owner</Label>
            <Input value={fields.py_owner_name} onChange={e => set('py_owner_name', e.target.value)} />
          </div>

          {/* Year built / Market value / Roof sqft */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Year built</Label>
              <Input type="number" value={fields.year_built} onChange={e => set('year_built', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Market value ($)</Label>
              <Input type="number" value={fields.market_value} onChange={e => set('market_value', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Roof sqft</Label>
              <Input type="number" value={fields.estimated_roof_sqft} onChange={e => set('estimated_roof_sqft', e.target.value)} />
            </div>
          </div>

          {/* Land use */}
          <div className="space-y-1.5">
            <Label>Land use</Label>
            <Input value={fields.land_type_desc} onChange={e => set('land_type_desc', e.target.value)} />
          </div>

          {/* Plant proximity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Gas plant dist (mi)</Label>
              <Input type="number" step="any" value={fields.dist_nearest_gas_plant_mi} onChange={e => set('dist_nearest_gas_plant_mi', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Proposed peaker dist (mi)</Label>
              <Input type="number" step="any" value={fields.dist_proposed_peaker_mi} onChange={e => set('dist_proposed_peaker_mi', e.target.value)} />
            </div>
          </div>

          {/* Solar permits */}
          {permits.length > 0 && (
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium text-foreground">Solar permits</p>
              {permits.map((permit, i) => {
                const id = permit.id ?? i;
                const isOpen = openPermits.has(id);
                const pf = permitFields[id] ?? permitToFields(permit);
                const label = permit.permit_number
                  ? `Permit #${permit.permit_number}`
                  : permit.installed_kw != null
                    ? `${permit.installed_kw} kW`
                    : `Permit ${i + 1}`;

                return (
                  <div key={id} className="border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-left hover:bg-muted/50 transition-colors"
                      onClick={() => togglePermit(id)}
                    >
                      <span>{label}</span>
                      {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 pt-2 space-y-4 bg-muted/20">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label>Permit #</Label>
                            <Input value={pf.permit_number} onChange={e => setPermit(id, 'permit_number', e.target.value)} />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Installed kW</Label>
                            <Input type="number" step="any" value={pf.installed_kw} onChange={e => setPermit(id, 'installed_kw', e.target.value)} />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Status</Label>
                          <Input value={pf.status_current} onChange={e => setPermit(id, 'status_current', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label>Issued date</Label>
                            <Input type="date" value={pf.issued_date} onChange={e => setPermit(id, 'issued_date', e.target.value)} />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Completed date</Label>
                            <Input type="date" value={pf.completed_date} onChange={e => setPermit(id, 'completed_date', e.target.value)} />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Contractor</Label>
                          <Input value={pf.contractor_company} onChange={e => setPermit(id, 'contractor_company', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Total valuation ($)</Label>
                          <Input type="number" value={pf.total_job_valuation} onChange={e => setPermit(id, 'total_job_valuation', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Link</Label>
                          <Input value={pf.link} onChange={e => setPermit(id, 'link', e.target.value)} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

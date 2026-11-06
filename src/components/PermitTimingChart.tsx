import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TimingYear } from '../../supabase/functions/_shared/permit-timing';

interface Props {
  kind: 'Solar' | 'Battery-Only';
  data: TimingYear[];
  loading: boolean;
  error: boolean;
}

export default function PermitTimingChart({ kind, data, loading, error }: Props) {
  const [metric, setMetric] = useState<'averageDays' | 'medianDays'>('averageDays');
  const measure = metric === 'averageDays' ? 'Average' : 'Median';
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-2xl">{measure} {kind} Permit to Completion Time</CardTitle>
            <CardDescription>
              {measure} days from application to completion, by application calendar year (2014–present).
              {' '}{kind === 'Solar' ? 'Solar permits, including solar with batteries; battery-only permits excluded.' : 'Battery/storage permits with no solar or PV mentioned in their descriptions.'}
            </CardDescription>
          </div>
          <Tabs aria-label={`${kind} timing measure`} value={metric} onValueChange={(v) => { if (v === 'averageDays' || v === 'medianDays') setMetric(v); }}>
            <TabsList>
              <TabsTrigger value="averageDays">Average</TabsTrigger>
              <TabsTrigger value="medianDays">Median</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-[300px] w-full" /> : error ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">Permit timing data could not be loaded. Please try again later.</div>
        ) : data.length ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} accessibilityLayer>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value: number) => [`${value} days`, `${measure} time`]} labelFormatter={(year, payload) => `${year} · ${payload[0]?.payload?.count?.toLocaleString() ?? 0} completed projects`} />
              <Line type="linear" dataKey={metric} stroke={kind === 'Solar' ? 'hsl(var(--secondary))' : 'hsl(var(--primary))'} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">No completed {kind.toLowerCase()} permits with valid timing data available.</div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Source: corrected City of Austin permit records. Projects are deduplicated; only records with application and completion dates and a positive duration are included. Classification uses permit descriptions, not verified equipment inventories. This measures elapsed time, not solely City review time; unfinished permits are excluded.
        </p>
      </CardContent>
    </Card>
  );
}
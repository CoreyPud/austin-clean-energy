import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, LabelList, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TimingMonth, TimingYear } from '../../supabase/functions/_shared/permit-timing';
import { permitBarWidth } from '@/lib/permit-timing-chart';

interface CountBarProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  payload?: TimingYear;
  maximumCount: number;
}

function CountBar({ x = 0, y = 0, width = 0, height = 0, fill, payload, maximumCount }: CountBarProps) {
  const count = payload?.count ?? 0;
  const scaledWidth = permitBarWidth(count, maximumCount, width);
  return <rect x={x + (width - scaledWidth) / 2} y={y} width={scaledWidth} height={height} fill={fill}>
    <title>{payload?.year}: {count.toLocaleString()} completed permits</title>
  </rect>;
}

const monthLabel = (value: unknown) => {
  const text = String(value ?? '');
  const match = /^(\d{4})-(\d{2})$/.exec(text);
  if (!match) return /^\d{4}$/.test(text) ? text : 'Date unavailable';
  const month = Number(match[2]);
  if (month < 1 || month > 12) return 'Date unavailable';
  return new Date(Date.UTC(Number(match[1]), month - 1, 1)).toLocaleDateString('en-US', {
    month: 'short', year: 'numeric', timeZone: 'UTC',
  });
};

interface Props {
  kind: 'Solar' | 'Battery-Only';
  data: TimingMonth[];
  annualData: TimingYear[];
  loading: boolean;
  error: boolean;
}

export default function PermitTimingChart({ kind, data, annualData, loading, error }: Props) {
  const [metric, setMetric] = useState<'averageDays' | 'medianDays'>('averageDays');
  const [period, setPeriod] = useState<'month' | 'year'>('month');
  const measure = metric === 'averageDays' ? 'Average' : 'Median';
  const rows = period === 'month' ? data : annualData;
  const color = kind === 'Solar' ? 'hsl(var(--secondary))' : 'hsl(var(--primary))';
  const maximumCount = Math.max(0, ...annualData.map(row => row.count));
  const axes = <>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey={period === 'month' ? 'month' : 'year'} tickFormatter={monthLabel} minTickGap={35} />
    <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} domain={[0, 'auto']} />
    <Tooltip formatter={(value: number) => [`${value} days`, `${measure} time`]} labelFormatter={(label, payload) => `${monthLabel(payload[0]?.payload?.month ?? payload[0]?.payload?.year ?? label)} · ${payload[0]?.payload?.count?.toLocaleString() ?? 0} completed permits`} />
  </>;
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-2xl">{measure} {kind} Permit to Completion Time</CardTitle>
            <CardDescription>
              {measure} days from application to completion, by application calendar {period === 'month' ? 'month' : 'year'} (2014–present).
              {' '}{kind === 'Solar' ? 'Solar permits, including solar with batteries; battery-only permits excluded.' : 'Battery/storage permits with no solar or PV mentioned in their descriptions.'}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
          <Tabs aria-label={`${kind} chart period`} value={period} onValueChange={(v) => { if (v === 'month' || v === 'year') setPeriod(v); }}>
            <TabsList>
              <TabsTrigger value="month">Monthly lines</TabsTrigger>
              <TabsTrigger value="year">Annual bars</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs aria-label={`${kind} timing measure`} value={metric} onValueChange={(v) => { if (v === 'averageDays' || v === 'medianDays') setMetric(v); }}>
            <TabsList>
              <TabsTrigger value="averageDays">Average</TabsTrigger>
              <TabsTrigger value="medianDays">Median</TabsTrigger>
            </TabsList>
          </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-[300px] w-full" /> : error ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">Permit timing data could not be loaded. Please try again later.</div>
        ) : rows.length ? (
          <div className="w-full overflow-x-auto" role="region" aria-label={`${kind} ${period === 'month' ? 'monthly' : 'annual'} permit timing chart`} tabIndex={0}>
            <ResponsiveContainer width="100%" minWidth={Math.max(period === 'month' ? 700 : 600, rows.length * (period === 'month' ? 48 : 60))} height={320}>
              {period === 'month' ? (
                <LineChart data={rows} margin={{ top: 30, right: 25, bottom: 5, left: 10 }} accessibilityLayer>
                  {axes}
                  <Line type="linear" dataKey={metric} stroke={color} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }}>
                    <LabelList dataKey={metric} position="top" offset={10} fill="hsl(var(--foreground))" fontSize={12} />
                  </Line>
                </LineChart>
              ) : (
                <BarChart data={rows} margin={{ top: 30, right: 25, bottom: 5, left: 10 }} barCategoryGap="15%" accessibilityLayer>
                  {axes}
                  <Bar dataKey={metric} fill={color} shape={<CountBar maximumCount={maximumCount} />}>
                    <LabelList dataKey={metric} position="top" offset={10} fill="hsl(var(--foreground))" fontSize={12} />
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">No completed {kind.toLowerCase()} permits with valid timing data available.</div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          {period === 'year' && 'Bar width is proportional to qualifying completed permit count within this chart; height and labels show days. '}
          Source: corrected City of Austin permit records. Projects are deduplicated; only records with application and completion dates and a positive duration are included. {period === 'month' ? 'Months' : 'Years'} without qualifying completed projects are omitted, not counted as zero days. Classification uses permit descriptions, not verified equipment inventories. This measures elapsed time, not solely City review time; unfinished permits are excluded.
        </p>
        <Button variant="link" asChild className="mt-2 px-0"><Link to="/solar-permits">Deep Dive <ArrowRight /></Link></Button>
      </CardContent>
    </Card>
  );
}
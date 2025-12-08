import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { ArrowLeft, Calendar, Zap, Battery } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface FiscalYearData {
  fiscalYear: number;
  label: string;
  count: number;
  batteryCount: number;
  totalKW: number;
}

const FiscalYearStats = () => {
  const [data, setData] = useState<FiscalYearData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: responseData, error } = await supabase.functions.invoke("fiscal-year-stats");
        if (error) throw error;
        setData(responseData?.data || []);
      } catch (err) {
        console.error("Error fetching fiscal year stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const chartData = data.map((item) => ({
    name: item.label,
    solarOnly: item.count - item.batteryCount,
    withBattery: item.batteryCount,
    totalKW: Math.round(item.totalKW),
  }));

  const chartConfig = {
    solarOnly: {
      label: "Solar Only",
      color: "hsl(var(--primary))",
    },
    withBattery: {
      label: "With Battery",
      color: "hsl(var(--chart-2))",
    },
    totalKW: {
      label: "Total kW",
      color: "hsl(var(--chart-3))",
    },
  };

  // Calculate summary stats
  const totalInstallations = data.reduce((sum, item) => sum + item.count, 0);
  const totalKW = data.reduce((sum, item) => sum + item.totalKW, 0);
  const totalWithBattery = data.reduce((sum, item) => sum + item.batteryCount, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/city-overview">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to City Overview
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Solar Installations by Fiscal Year
          </h1>
          <p className="text-muted-foreground">
            Austin's fiscal year runs October 1 – September 30. This view groups solar permit data by City of Austin fiscal years.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Total Installations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">{totalInstallations.toLocaleString()}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Total Capacity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">{Math.round(totalKW).toLocaleString()} kW</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Battery className="h-4 w-4" />
                With Battery Storage
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">{totalWithBattery.toLocaleString()}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Installations Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Installations by Fiscal Year</CardTitle>
            <CardDescription>
              Number of solar installations completed each fiscal year (Oct 1 – Sept 30)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[400px] w-full" />
            ) : (
              <ChartContainer config={chartConfig} className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      className="text-muted-foreground"
                    />
                    <YAxis className="text-muted-foreground" />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar
                      dataKey="solarOnly"
                      stackId="installations"
                      fill="hsl(var(--primary))"
                      name="Solar Only"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="withBattery"
                      stackId="installations"
                      fill="hsl(var(--chart-2))"
                      name="With Battery"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Capacity Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Installed Capacity by Fiscal Year</CardTitle>
            <CardDescription>
              Total kilowatts of solar capacity installed each fiscal year
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[400px] w-full" />
            ) : (
              <ChartContainer config={chartConfig} className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      className="text-muted-foreground"
                    />
                    <YAxis className="text-muted-foreground" tickFormatter={(value) => `${value.toLocaleString()}`} />
                    <Tooltip
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => [`${value.toLocaleString()} kW`, "Capacity"]}
                    />
                    <Bar
                      dataKey="totalKW"
                      fill="hsl(var(--chart-3))"
                      name="Total kW"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
            <p className="text-xs text-muted-foreground mt-4">
              Note: kW capacity values are based on permit records and may not represent total installed capacity in all cases.
            </p>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Fiscal Year Summary Table</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Fiscal Year</th>
                      <th className="text-right py-3 px-4 font-medium">Installations</th>
                      <th className="text-right py-3 px-4 font-medium">With Battery</th>
                      <th className="text-right py-3 px-4 font-medium">Total kW</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item) => (
                      <tr key={item.fiscalYear} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">{item.label}</td>
                        <td className="text-right py-3 px-4">{item.count.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">{item.batteryCount.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">{Math.round(item.totalKW).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FiscalYearStats;

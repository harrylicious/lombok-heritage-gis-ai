import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { EnhancedDashboardService, TimeSeriesDataPoint } from '@/services/enhanced-dashboard.service';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface TimeSeriesChartProps {
  className?: string;
}

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ className }) => {
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [timeRange, setTimeRange] = useState<6 | 12>(12);

  useEffect(() => {
    const loadTimeSeriesData = async () => {
      try {
        setIsLoading(true);
        const data = await EnhancedDashboardService.getSiteGrowthData(timeRange);
        setTimeSeriesData(data);
      } catch (error) {
        console.error('Error loading time series data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTimeSeriesData();
  }, [timeRange]);

  const formatMonthLabel = (dateStr: string) => {
    const [year, month] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
  };

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      payload: TimeSeriesDataPoint;
    }>;
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`Bulan: ${formatMonthLabel(label)}`}</p>
          <p className="text-primary">{`Ditambahkan: ${data.count} situs`}</p>
          <p className="text-muted-foreground">{`Total: ${data.cumulative} situs`}</p>
        </div>
      );
    }
    return null;
  };

  const totalSites = timeSeriesData.length > 0 ? timeSeriesData[timeSeriesData.length - 1].cumulative : 0;
  const averageMonthly = timeSeriesData.length > 0 ? Math.round(timeSeriesData.reduce((sum, d) => sum + d.count, 0) / timeSeriesData.length) : 0;
  const latestMonth = timeSeriesData.length > 0 ? timeSeriesData[timeSeriesData.length - 1] : null;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Pertumbuhan Data Situs
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Tren penambahan situs warisan budaya dari waktu ke waktu
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={timeRange === 6 ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(6)}
            >
              6 Bulan
            </Button>
            <Button
              variant={timeRange === 12 ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(12)}
            >
              12 Bulan
            </Button>
            <Button
              variant={chartType === 'line' ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType('line')}
            >
              <TrendingUp className="w-4 h-4" />
            </Button>
            <Button
              variant={chartType === 'bar' ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType('bar')}
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Total Situs</span>
            </div>
            <div className="text-2xl font-bold mt-1">{totalSites}</div>
            <p className="text-xs text-muted-foreground">Situs terdaftar</p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Rata-rata Bulanan</span>
            </div>
            <div className="text-2xl font-bold mt-1">{averageMonthly}</div>
            <p className="text-xs text-muted-foreground">Situs per bulan</p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Bulan Terakhir</span>
            </div>
            <div className="text-2xl font-bold mt-1">{latestMonth?.count || 0}</div>
            <p className="text-xs text-muted-foreground">Situs ditambahkan</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80 w-full">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Memuat data...</p>
              </div>
            </div>
          ) : timeSeriesData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={timeSeriesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatMonthLabel}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="cumulative"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2, r: 3 }}
                  />
                </LineChart>
              ) : (
                <BarChart data={timeSeriesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatMonthLabel}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    name="Ditambahkan"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Tidak ada data tersedia</p>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span className="text-xs text-muted-foreground">Total Kumulatif</span>
          </div>
          {chartType === 'line' && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-destructive border-dashed border-t-2"></div>
              <span className="text-xs text-muted-foreground">Penambahan Bulanan</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeSeriesChart;
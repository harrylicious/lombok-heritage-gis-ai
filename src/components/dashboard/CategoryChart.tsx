import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { BarChart3 } from "lucide-react";

interface CategoryData {
  name: string;
  count: number;
  color: string;
}

interface CategoryChartProps {
  data: CategoryData[];
  isLoading?: boolean;
}

const CategoryChart: React.FC<CategoryChartProps> = ({ data, isLoading = false }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Distribusi Kategori
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Tidak ada data kategori
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart config
  const chartConfig = data.reduce((config, item, index) => {
    config[item.name] = {
      label: item.name,
      color: item.color,
    };
    return config;
  }, {} as ChartConfig);

  // Sort data by count descending
  const sortedData = [...data].sort((a, b) => b.count - a.count);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Distribusi Kategori Warisan Budaya
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64">
          <PieChart>
            <Pie
              data={sortedData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="count"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <ChartTooltip
              content={<ChartTooltipContent />}
            />
          </PieChart>
        </ChartContainer>

        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {sortedData.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground">{item.name}</span>
              <span className="font-medium ml-auto">{item.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryChart;
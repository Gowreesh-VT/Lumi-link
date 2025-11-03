import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { generateAnalyticsData, exportToCSV } from '@/lib/mockData';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useToast } from '@/hooks/use-toast';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState<'hour' | 'day' | 'week'>('day');
  const [data, setData] = useState(generateAnalyticsData('day'));
  const { toast } = useToast();

  const handleTimeRangeChange = (value: 'hour' | 'day' | 'week') => {
    setTimeRange(value);
    setData(generateAnalyticsData(value));
  };

  const handleExportCSV = () => {
    const exportData = data.map((d) => ({
      timestamp: new Date(d.timestamp).toISOString(),
      throughput: d.throughput.toFixed(2),
      packetLoss: d.packetLoss.toFixed(2),
      lightIntensity: d.lightIntensity.toFixed(2),
    }));

    exportToCSV(exportData, `lifi-analytics-${timeRange}-${Date.now()}.csv`);
    toast({
      title: 'Export Successful',
      description: 'Analytics data has been exported to CSV',
    });
  };

  const handleExportPDF = () => {
    // Mock PDF export
    toast({
      title: 'PDF Export',
      description: 'PDF report generation would be implemented here',
    });
  };

  const formatXAxis = (timestamp: Date) => {
    switch (timeRange) {
      case 'hour':
        return new Date(timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
      case 'day':
        return new Date(timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
        });
      case 'week':
        return new Date(timestamp).toLocaleDateString('en-US', {
          weekday: 'short',
        });
      default:
        return '';
    }
  };

  const avgThroughput = data.reduce((sum, d) => sum + d.throughput, 0) / data.length;
  const avgPacketLoss = data.reduce((sum, d) => sum + d.packetLoss, 0) / data.length;
  const avgLightIntensity =
    data.reduce((sum, d) => sum + d.lightIntensity, 0) / data.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Detailed performance metrics and trends
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">Last Hour</SelectItem>
              <SelectItem value="day">Last 24 Hours</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            CSV
          </Button>

          <Button
            onClick={handleExportPDF}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-card shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Avg. Throughput
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgThroughput.toFixed(2)} Mbps
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across selected time range
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Avg. Packet Loss
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgPacketLoss.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lower is better
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Avg. Light Intensity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgLightIntensity.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Signal strength indicator
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card shadow-card">
        <CardHeader>
          <CardTitle>Transmission Speed Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatXAxis}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelFormatter={(label) => new Date(label).toLocaleString()}
                formatter={(value: number) => [
                  `${value.toFixed(2)} Mbps`,
                  'Throughput',
                ]}
              />
              <Line
                type="monotone"
                dataKey="throughput"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card shadow-card">
          <CardHeader>
            <CardTitle>Packet Loss Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatXAxis}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelFormatter={(label) => new Date(label).toLocaleString()}
                  formatter={(value: number) => [
                    `${value.toFixed(2)}%`,
                    'Packet Loss',
                  ]}
                />
                <Bar
                  dataKey="packetLoss"
                  fill="hsl(var(--warning))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-card">
          <CardHeader>
            <CardTitle>Light Intensity Variation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatXAxis}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelFormatter={(label) => new Date(label).toLocaleString()}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Intensity']}
                />
                <Line
                  type="monotone"
                  dataKey="lightIntensity"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default Analytics;

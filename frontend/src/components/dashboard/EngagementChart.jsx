import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import Icon from '@/components/Icon';

const EngagementChart = ({ engagementData, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tournament Engagement</CardTitle>
          <CardDescription>
            Pick'ems participants per tournament.
          </CardDescription>
        </CardHeader>
        <CardContent className='flex h-64 items-center justify-center'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
        </CardContent>
      </Card>
    );
  }

  if (!engagementData || engagementData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tournament Engagement</CardTitle>
          <CardDescription>
            Pick'ems participants per tournament.
          </CardDescription>
        </CardHeader>
        <CardContent className='flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-outline-variant bg-surface'>
          <Icon
            name='query_stats'
            className='text-5xl text-on-surface-variant'
          />
          <p className='mt-2 text-on-surface-variant'>
            No engagement data yet.
          </p>
          <p className='text-sm text-on-surface-variant/70'>
            Enable Pick'ems on a tournament to see stats.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tournament Engagement</CardTitle>
        <CardDescription>Pick'ems participants per tournament.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width='100%' height={300}>
          <BarChart
            data={engagementData}
            margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis
              dataKey='name'
              tickFormatter={(value) =>
                value.length > 15 ? `${value.substring(0, 15)}...` : value
              }
            />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey='participants' fill='hsl(var(--primary))' />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default EngagementChart;

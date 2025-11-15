import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const processArchetypeData = (archetypes, game) => {
  if (!archetypes) return [];
  return archetypes
    .filter((a) => a.game === game)
    .map((a) => ({ name: a.archetype, count: a.count }));
};

const ArchetypePieChart = ({ analytics, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Player Archetype Distribution</CardTitle>
          <CardDescription>
            K-Means model results from player stats.
          </CardDescription>
        </CardHeader>
        <CardContent className='flex h-64 items-center justify-center'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
        </CardContent>
      </Card>
    );
  }

  if (
    !analytics ||
    !analytics.archetypes ||
    analytics.archetypes.length === 0
  ) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Player Archetype Distribution</CardTitle>
        </CardHeader>
        <CardContent className='flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-outline-variant bg-surface'>
          <Icon name='analytics' className='text-5xl text-on-surface-variant' />
          <p className='mt-2 text-on-surface-variant'>
            No archetype data found.
          </p>
          <p className='text-sm text-on-surface-variant/70'>
            Train models in the System panel.
          </p>
        </CardContent>
      </Card>
    );
  }

  const basketballData = processArchetypeData(
    analytics.archetypes,
    'basketball'
  );
  const valorantData = processArchetypeData(analytics.archetypes, 'valorant');
  const mlbbData = processArchetypeData(analytics.archetypes, 'mlbb');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Archetype Distribution</CardTitle>
        <CardDescription>
          K-Means model results from player stats.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {basketballData.length > 0 && (
          <div>
            <h3 className='mb-2 text-sm font-medium text-muted-foreground'>
              Basketball
            </h3>
            <ResponsiveContainer width='100%' height={250}>
              <BarChart data={basketballData} layout='vertical'>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis type='number' allowDecimals={false} />
                <YAxis dataKey='name' type='category' width={80} />
                <Tooltip />
                <Bar dataKey='count' fill='#FF9100' />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {valorantData.length > 0 && (
          <div>
            <h3 className='mb-2 text-sm font-medium text-muted-foreground'>
              Valorant
            </h3>
            <ResponsiveContainer width='100%' height={250}>
              <PieChart>
                <Pie
                  data={valorantData}
                  cx='50%'
                  cy='50%'
                  labelLine={false}
                  outerRadius={80}
                  fill='#8884d8'
                  dataKey='count'
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                >
                  {valorantData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {mlbbData.length > 0 && (
          <div>
            <h3 className='mb-2 text-sm font-medium text-muted-foreground'>
              Mobile Legends (MLBB)
            </h3>
            <ResponsiveContainer width='100%' height={250}>
              <PieChart>
                <Pie
                  data={mlbbData}
                  cx='50%'
                  cy='50%'
                  labelLine={false}
                  outerRadius={80}
                  fill='#8884d8'
                  dataKey='count'
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                >
                  {mlbbData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ArchetypePieChart;

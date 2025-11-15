import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const data = await api.getGlobalAnalytics();
        setAnalytics(data);
      } catch (error) {
        toast.error('Failed to load analytics data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className='flex h-full w-full items-center justify-center p-8'>
        <Loader2 className='h-12 w-12 animate-spin text-primary' />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className='p-8'>
        <h1 className='text-3xl font-bold text-foreground'>Analytics</h1>
        <p className='mt-4 text-center text-muted-foreground'>
          No analytics data found. Try training the models first.
        </p>
      </div>
    );
  }

  const { archetypes, winPredictor } = analytics;

  const processArchetypeData = (game) => {
    return archetypes
      .filter((a) => a.game === game)
      .map((a) => ({ name: a.archetype, count: a.count }));
  };

  const basketballData = processArchetypeData('basketball');
  const valorantData = processArchetypeData('valorant');
  const mlbbData = processArchetypeData('mlbb');

  return (
    <div className='p-8'>
      <h1 className='text-3xl font-bold text-foreground'>Global Analytics</h1>
      <p className='mt-2 text-muted-foreground'>
        Overview of data science model results.
      </p>

      <div className='mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle>Player Archetype Distribution (K-Means)</CardTitle>
          </CardHeader>
          <CardContent>
            {basketballData.length > 0 && (
              <>
                <h3 className='mb-4 text-lg font-semibold'>Basketball</h3>
                <ResponsiveContainer width='100%' height={300}>
                  <BarChart data={basketballData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='name' />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey='count' fill='#FF9100' />
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
            {valorantData.length > 0 && (
              <>
                <h3 className='mb-4 mt-6 text-lg font-semibold'>Valorant</h3>
                <ResponsiveContainer width='100%' height={300}>
                  <PieChart>
                    <Pie
                      data={valorantData}
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      outerRadius={100}
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
              </>
            )}
            {mlbbData.length > 0 && (
              <>
                <h3 className='mb-4 mt-6 text-lg font-semibold'>
                  Mobile Legends (MLBB)
                </h3>
                <ResponsiveContainer width='100%' height={300}>
                  <PieChart>
                    <Pie
                      data={mlbbData}
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      outerRadius={100}
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
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Win Predictor (Logistic Regression)</CardTitle>
          </CardHeader>
          <CardContent>
            {winPredictor ? (
              <div>
                <p className='text-sm text-muted-foreground'>
                  Model coefficients loaded from database:
                </p>
                <pre className='mt-4 rounded-lg bg-muted p-4 font-mono text-sm text-muted-foreground'>
                  {JSON.stringify(winPredictor.coefficients, null, 2)}
                </pre>
                <p className='mt-2 text-xs text-muted-foreground'>
                  Last trained:{' '}
                  {new Date(winPredictor.updated_at).toLocaleString()}
                </p>
              </div>
            ) : (
              <p className='text-muted-foreground'>
                The Win Predictor model has not been trained yet. Go to "System"
                to train it.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;

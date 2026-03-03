import { motion } from 'framer-motion';
import { BarChart3, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { Button } from '@/components/ui/button';

const deptProductivity = [
  { dept: 'Engineering', score: 88 },
  { dept: 'Product', score: 82 },
  { dept: 'Design', score: 79 },
  { dept: 'Marketing', score: 85 },
  { dept: 'Sales', score: 91 },
];

const diversityData = [
  { name: 'Male', value: 52 },
  { name: 'Female', value: 40 },
  { name: 'Non-Binary', value: 5 },
  { name: 'Not Disclosed', value: 3 },
];
const DIVERSITY_COLORS = ['hsl(263, 84%, 58%)', 'hsl(43, 96%, 50%)', 'hsl(160, 84%, 39%)', 'hsl(215, 19%, 23%)'];

const hiringForecast = [
  { month: 'Jul', actual: 22, forecast: 25 },
  { month: 'Aug', actual: null, forecast: 28 },
  { month: 'Sep', actual: null, forecast: 32 },
  { month: 'Oct', actual: null, forecast: 30 },
  { month: 'Nov', actual: null, forecast: 35 },
  { month: 'Dec', actual: null, forecast: 38 },
];

const attritionTrend = [
  { month: 'Jan', rate: 4.2 }, { month: 'Feb', rate: 3.8 }, { month: 'Mar', rate: 5.1 },
  { month: 'Apr', rate: 4.5 }, { month: 'May', rate: 3.2 }, { month: 'Jun', rate: 2.8 },
];

const tooltipStyle = { background: 'hsl(217 33% 17%)', border: '1px solid hsl(215 19% 23%)', borderRadius: '8px', color: 'hsl(210 40% 96%)' };

export default function WorkforceAnalytics() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> Workforce Analytics
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Organization-wide intelligence overview</p>
        </div>
        <Button variant="outline" className="border-border gap-2">
          <Download className="h-4 w-4" /> Download Report
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Department Productivity</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={deptProductivity}>
              <XAxis dataKey="dept" stroke="hsl(215 16% 65%)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(215 16% 65%)" fontSize={11} tickLine={false} axisLine={false} domain={[60, 100]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="score" fill="hsl(263 84% 58%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Diversity Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={diversityData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {diversityData.map((_, i) => <Cell key={i} fill={DIVERSITY_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Hiring Forecast</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={hiringForecast}>
              <XAxis dataKey="month" stroke="hsl(215 16% 65%)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(215 16% 65%)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="actual" stroke="hsl(263 84% 58%)" strokeWidth={2} dot={{ fill: 'hsl(263 84% 58%)' }} />
              <Line type="monotone" dataKey="forecast" stroke="hsl(43 96% 50%)" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: 'hsl(43 96% 50%)' }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Attrition Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={attritionTrend}>
              <defs>
                <linearGradient id="attrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0 84% 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(0 84% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="hsl(215 16% 65%)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(215 16% 65%)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="rate" stroke="hsl(0 84% 60%)" fill="url(#attrGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}

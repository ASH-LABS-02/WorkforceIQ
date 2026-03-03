import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Calendar, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const reports = [
  { id: '1', name: 'Q1 2025 Hiring Summary', date: '2025-03-31', dept: 'All', type: 'Hiring' },
  { id: '2', name: 'Engineering Attrition Report', date: '2025-02-28', dept: 'Engineering', type: 'Attrition' },
  { id: '3', name: 'Diversity & Inclusion Analysis', date: '2025-03-15', dept: 'All', type: 'Diversity' },
  { id: '4', name: 'Performance Review Summary', date: '2025-01-31', dept: 'Product', type: 'Performance' },
  { id: '5', name: 'Workforce Planning Forecast', date: '2025-03-01', dept: 'All', type: 'Analytics' },
];

export default function Reports() {
  const [dateFilter, setDateFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  const filtered = reports.filter(r => {
    if (deptFilter !== 'all' && r.dept !== deptFilter) return false;
    if (dateFilter && r.date < dateFilter) return false;
    return true;
  });

  const handleExport = (format: 'pdf' | 'csv') => {
    toast.success(`Exporting as ${format.toUpperCase()}...`);
    // In production: calls GET /api/reports/{id}/export?format=pdf
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" /> Reports
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Generate and download workforce intelligence reports</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="bg-card border-border w-44"
          />
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-44 bg-card border-border">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="Engineering">Engineering</SelectItem>
              <SelectItem value="Product">Product</SelectItem>
              <SelectItem value="Design">Design</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Sales">Sales</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {filtered.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-panel p-5 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-primary/15">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.dept} · {r.date} · {r.type}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-border gap-1.5" onClick={() => handleExport('pdf')}>
                <Download className="h-3.5 w-3.5" /> PDF
              </Button>
              <Button variant="outline" size="sm" className="border-border gap-1.5" onClick={() => handleExport('csv')}>
                <Download className="h-3.5 w-3.5" /> CSV
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

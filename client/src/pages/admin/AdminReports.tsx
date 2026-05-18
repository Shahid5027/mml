import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FileDown, Calendar, Search, RefreshCw, X, FileText, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

interface ReportItem {
  userId: string;
  name: string;
  email: string;
  department: string;
  shiftStartTime: string;
  daysPresent: number;
  daysLate: number;
  daysAbsent: number;
  totalHours: number;
  averageHours: number;
  attendancePercentage: number;
}

export const AdminReports = () => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // 1. Fetch organizational report from server
  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/admin/attendance/report?month=${currentMonth}`);
      setReports(response.data);
    } catch (err) {
      console.error('Failed to load monthly report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [currentMonth]);

  // 2. Filter records locally
  const filteredReports = React.useMemo(() => {
    return reports.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || 
                            r.email.toLowerCase().includes(search.toLowerCase());
      const matchesDept = !deptFilter || r.department === deptFilter;
      return matchesSearch && matchesDept;
    });
  }, [reports, search, deptFilter]);

  // 3. Aggregate stats for top dashboard cards
  const aggregates = React.useMemo(() => {
    if (filteredReports.length === 0) {
      return { avgHours: 0, totalLate: 0, avgRate: 0 };
    }
    const sumHours = filteredReports.reduce((acc, curr) => acc + curr.averageHours, 0);
    const sumLate = filteredReports.reduce((acc, curr) => acc + curr.daysLate, 0);
    const sumRate = filteredReports.reduce((acc, curr) => acc + curr.attendancePercentage, 0);
    return {
      avgHours: parseFloat((sumHours / filteredReports.length).toFixed(1)),
      totalLate: sumLate,
      avgRate: Math.round(sumRate / filteredReports.length)
    };
  }, [filteredReports]);

  // 4. Format Chart Data for Recharts Bar Chart
  const chartData = React.useMemo(() => {
    return filteredReports.slice(0, 8).map(r => ({
      name: r.name.split(' ')[0], // Show employee first name
      'Avg Hours': r.averageHours,
      'Late Days': r.daysLate
    }));
  }, [filteredReports]);

  // 5. Client-Side CSV Generator & Downloader
  const handleExportCSV = () => {
    if (filteredReports.length === 0) return;

    const headers = [
      'Employee Name', 
      'Corporate Email', 
      'Department', 
      'Shift Start Time', 
      'Days Present', 
      'Days Late', 
      'Days Absent', 
      'Total Hours Logged', 
      'Average Shift Hours', 
      'Attendance Percentage'
    ];

    const rows = filteredReports.map(r => [
      `"${r.name}"`,
      r.email,
      `"${r.department}"`,
      r.shiftStartTime,
      r.daysPresent,
      r.daysLate,
      r.daysAbsent,
      r.totalHours,
      r.averageHours,
      `${r.attendancePercentage}%`
    ]);

    const csvContent = '\ufeff' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `GeoShield_Corporate_Report_${currentMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
        <div className="text-left">
          <h2 className="text-xl font-bold tracking-tight text-foreground font-sans sm:text-2xl">
            Corporate Ledger & Export Station
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Compile company-wide monthly logs, analyze working hours, review exceptions, and download reports.
          </p>
        </div>
        
        {/* CSV Exporter trigger */}
        <Button 
          onClick={handleExportCSV}
          disabled={filteredReports.length === 0}
          variant="primary" 
          size="sm" 
          leftIcon={<FileDown className="h-4 w-4" />}
        >
          Export to CSV
        </Button>
      </div>

      {loading ? (
        <div className="h-[400px] flex items-center justify-center">
          <p className="text-xs text-muted-foreground animate-pulse">Running database log aggregations...</p>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in text-left">
          
          {/* Quick Metrics Cards */}
          <div className="grid gap-6 sm:grid-cols-3">
            <Card className="p-1">
              <CardContent className="pt-4 flex items-center space-x-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Mean Daily Shift Duration</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">{aggregates.avgHours} hrs</p>
                </div>
              </CardContent>
            </Card>

            <Card className="p-1">
              <CardContent className="pt-4 flex items-center space-x-4">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Late check-ins</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">{aggregates.totalLate} occurrences</p>
                </div>
              </CardContent>
            </Card>

            <Card className="p-1">
              <CardContent className="pt-4 flex items-center space-x-4">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Average Attendance Rate</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">{aggregates.avgRate}% completed</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart Card (satisfying p10 Recharts charts requirements) */}
          <Card className="p-1">
            <CardHeader>
              <CardTitle>Roster Performance Velocity</CardTitle>
              <CardDescription>Average working hours and late occurrences mapped across top staff profiles</CardDescription>
            </CardHeader>
            <CardContent className="h-[200px] w-full pr-4 pb-2">
              {filteredReports.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-xs text-muted-foreground italic">No chart data compileable.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" fontSize={10} stroke="hsl(var(--muted-foreground))" tickLine={false} />
                    <YAxis fontSize={10} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        borderColor: 'hsl(var(--border))', 
                        color: 'hsl(var(--foreground))',
                        fontSize: '11px',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="Avg Hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Late Days" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Filter Options & compiled report table Grid */}
          <div className="grid gap-6 md:grid-cols-4">
            
            {/* Left Filter Options Card */}
            <Card className="md:col-span-1 p-1">
              <CardHeader>
                <CardTitle>Log Compilation</CardTitle>
                <CardDescription>Target records by month and filters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Target month picker */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-foreground uppercase">Audit Month</label>
                  <select 
                    value={currentMonth}
                    onChange={(e) => setCurrentMonth(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                  >
                    <option value="2026-05">May 2026</option>
                    <option value="2026-04">April 2026</option>
                    <option value="2026-03">March 2026</option>
                    <option value="2026-02">February 2026</option>
                  </select>
                </div>

                {/* search filter */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-foreground uppercase">Employee Search</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Name or email..." 
                      className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                    />
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </div>

                {/* Department select filter */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-foreground uppercase">Department</label>
                  <select 
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                  >
                    <option value="">All Departments</option>
                    <option value="Information Security">Information Security</option>
                    <option value="Operations">Operations</option>
                    <option value="HR Tech">HR Tech</option>
                    <option value="Engineering">Engineering</option>
                  </select>
                </div>

              </CardContent>
            </Card>

            {/* Right compiled report tables */}
            <Card className="md:col-span-3 p-1">
              <CardHeader>
                <CardTitle>Compiled Log Ledger</CardTitle>
                <CardDescription>Multi-employee reports including clock averages and overall completion ratios</CardDescription>
              </CardHeader>
              <CardContent className="p-0 border-t border-border">
                {filteredReports.length === 0 ? (
                  <div className="h-[280px] flex flex-col items-center justify-center space-y-2">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                    <p className="text-xs font-bold text-foreground">No reports compiled</p>
                    <p className="text-[10px] text-muted-foreground">Adjust filters or select another target audit month.</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Stacked Card View */}
                    <div className="block md:hidden divide-y divide-border/60">
                      {filteredReports.map((r) => (
                        <div key={r.userId} className="p-4 space-y-2 text-left hover:bg-accent/10 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-foreground text-xs">{r.name}</p>
                              <p className="text-[10px] text-muted-foreground">{r.email}</p>
                            </div>
                            <Badge variant={r.attendancePercentage >= 80 ? 'success' : r.attendancePercentage >= 50 ? 'warning' : 'danger'} className="text-[8px] py-0 px-1">
                              {r.attendancePercentage}%
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1">
                            <span>{r.department}</span>
                            <span>
                              <span className="text-green-500 font-semibold">{r.daysPresent}P</span> /{' '}
                              <span className="text-amber-500 font-semibold">{r.daysLate}L</span> /{' '}
                              <span>{r.daysAbsent}A</span>
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[9px] text-muted-foreground">
                            <span>Total Hours</span>
                            <span className="font-mono font-bold text-foreground">
                              {r.totalHours}h (Avg: {r.averageHours}h)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-border bg-background/50 text-muted-foreground uppercase tracking-wider text-[9px] font-bold">
                            <th className="px-5 py-3.5">Employee</th>
                            <th className="px-5 py-3.5">Department</th>
                            <th className="px-5 py-3.5">Present / Late / Absent</th>
                            <th className="px-5 py-3.5">Total / Avg Hours</th>
                            <th className="px-5 py-3.5">Rate</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {filteredReports.map((r) => (
                            <tr key={r.userId} className="hover:bg-accent/20 transition-colors">
                              <td className="px-5 py-4">
                                <p className="font-semibold text-foreground">{r.name}</p>
                                <p className="text-[10px] text-muted-foreground">{r.email}</p>
                              </td>
                              <td className="px-5 py-4 text-muted-foreground font-medium">{r.department}</td>
                              <td className="px-5 py-4 text-muted-foreground">
                                <span className="text-green-500 font-semibold">{r.daysPresent}P</span>
                                <span className="text-muted-foreground font-medium"> / </span>
                                <span className="text-amber-500 font-semibold">{r.daysLate}L</span>
                                <span className="text-muted-foreground font-medium"> / </span>
                                <span className="text-muted-foreground font-semibold">{r.daysAbsent}A</span>
                              </td>
                              <td className="px-5 py-4 font-mono">
                                <p className="font-bold text-foreground">{r.totalHours}h</p>
                                <p className="text-[9px] text-muted-foreground">Avg: {r.averageHours}h</p>
                              </td>
                              <td className="px-5 py-4">
                                <Badge variant={r.attendancePercentage >= 80 ? 'success' : r.attendancePercentage >= 50 ? 'warning' : 'danger'} className="text-[9px] py-0">
                                  {r.attendancePercentage}%
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

          </div>

        </div>
      )}

    </div>
  );
};

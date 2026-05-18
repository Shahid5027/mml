import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Users, Clock, AlertTriangle, ShieldCheck, Search, Filter, RefreshCw, X, ShieldAlert, BookOpen } from 'lucide-react';

interface RosterItem {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    shiftStartTime: string;
  };
  punch: {
    id: string;
    checkInTime: string;
    checkOutTime: string | null;
    status: string;
    workingHours: number | null;
  } | null;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'INVALID';
}

export const AdminDashboard = () => {
  const [roster, setRoster] = useState<RosterItem[]>([]);
  const [aggregates, setAggregates] = useState({
    totalStaff: 0,
    present: 0,
    late: 0,
    absent: 0,
    invalid: 0
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Invalidation Modal states
  const [selectedPunch, setSelectedPunch] = useState<{ attendanceId: string; userName: string } | null>(null);
  const [invalidateReason, setInvalidateReason] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // 1. Fetch live daily roster logs
  const fetchRoster = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/attendance/today');
      setRoster(response.data.roster);
      setAggregates(response.data.aggregates);
    } catch (err) {
      console.error('Failed to load daily roster metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, []);

  // 2. Submit correction punch invalidation
  const handleInvalidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPunch || !invalidateReason) return;

    setModalLoading(true);
    setModalError(null);
    setModalSuccess(null);

    try {
      await axios.put('/api/admin/attendance/invalidate', {
        attendanceId: selectedPunch.attendanceId,
        reason: invalidateReason
      });

      setModalSuccess('Attendance record successfully invalidated and logged in audit files.');
      setInvalidateReason('');
      
      // Reload roster and close modal after brief delay
      fetchRoster();
      setTimeout(() => {
        setSelectedPunch(null);
        setModalSuccess(null);
      }, 1500);
    } catch (err: any) {
      console.error('Invalidation post failed:', err);
      const msg = err.response?.data?.message || 'Transaction rejected. Verify database constraints.';
      setModalError(msg);
    } finally {
      setModalLoading(false);
    }
  };

  // 3. Department statistics compiler for Recharts Bar Chart
  const departmentChartData = React.useMemo(() => {
    const depts = ['Information Security', 'Operations', 'HR Tech', 'Engineering'];
    return depts.map(dept => {
      const deptStaff = roster.filter(r => r.user.department === dept);
      const activeStaff = deptStaff.filter(r => r.status === 'PRESENT' || r.status === 'LATE');
      return {
        name: dept.split(' ')[0], // First word of dept
        Staff: deptStaff.length,
        Present: activeStaff.length
      };
    });
  }, [roster]);

  // 4. Client side filtering on roster array
  const filteredRoster = React.useMemo(() => {
    return roster.filter(item => {
      const matchesSearch = item.user.name.toLowerCase().includes(search.toLowerCase()) || 
                            item.user.email.toLowerCase().includes(search.toLowerCase());
      const matchesDept = !deptFilter || item.user.department === deptFilter;
      const matchesStatus = !statusFilter || item.status === statusFilter;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [roster, search, deptFilter, statusFilter]);

  // Calculate dynamic present %
  const presentRate = aggregates.totalStaff > 0 
    ? Math.round((aggregates.present / aggregates.totalStaff) * 100) 
    : 100;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
        <div className="text-left">
          <h2 className="text-xl font-bold tracking-tight text-foreground font-sans sm:text-2xl">
            Admin Overview Console
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor organizational check-ins, investigate geofence exceptions, and audit correction logs.
          </p>
        </div>
        
        <Button 
          onClick={fetchRoster} 
          variant="secondary" 
          size="sm" 
          className="border border-border bg-card"
          leftIcon={<RefreshCw className="h-4 w-4" />}
        >
          Reload Dashboard
        </Button>
      </div>

      {loading ? (
        <div className="h-[400px] flex items-center justify-center">
          <p className="text-xs text-muted-foreground animate-pulse">Assembling administrative operations dashboard...</p>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in text-left">
          
          {/* Key Metrics Widgets grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            
            {/* Total active present */}
            <Card glass={true} hoverable={true} className="p-1">
              <CardContent className="pt-4 flex items-center space-x-4">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Present Roster</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">
                    {aggregates.present} <span className="text-xs text-muted-foreground">/ {aggregates.totalStaff}</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Late clock-ins */}
            <Card glass={true} hoverable={true} className="p-1">
              <CardContent className="pt-4 flex items-center space-x-4">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Late check-ins</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">{aggregates.late} staff</p>
                </div>
              </CardContent>
            </Card>

            {/* Absent headcount */}
            <Card glass={true} hoverable={true} className="p-1">
              <CardContent className="pt-4 flex items-center space-x-4">
                <div className="h-10 w-10 rounded-lg bg-border/40 text-muted-foreground flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Absent Headcount</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">{aggregates.absent} staff</p>
                </div>
              </CardContent>
            </Card>

            {/* Corporate On-Duty trust percentage */}
            <Card glass={true} hoverable={true} className="p-1">
              <CardContent className="pt-4 flex items-center space-x-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">On-Duty Ratio</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">{presentRate}% active</p>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Department stats & live filter grid */}
          <div className="grid gap-6 md:grid-cols-5">
            
            {/* Left Department attendance velocity chart */}
            <Card glass={true} className="md:col-span-2 overflow-hidden flex flex-col p-1 border border-border/40">
              <CardHeader>
                <CardTitle>Attendance by Department</CardTitle>
                <CardDescription>Visual comparison displaying total staff vs active present staff</CardDescription>
              </CardHeader>
              <CardContent className="h-[260px] w-full pr-4 pb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentChartData}>
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
                    <Bar dataKey="Staff" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Present" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Right Live filter and roster lookup card */}
            <Card glass={true} className="md:col-span-3 flex flex-col p-1 border border-border/40">
              <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle>Daily Shift Roster</CardTitle>
                  <CardDescription>Live attendance directory mapping employee punches and status</CardDescription>
                </div>
                
                {/* Search console inside card header */}
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <input 
                      type="text" 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search name..."
                      className="rounded-lg border border-border bg-background pl-8 pr-3 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all w-40 sm:w-48"
                    />
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  </div>

                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                  >
                    <option value="">All Status</option>
                    <option value="PRESENT">PRESENT</option>
                    <option value="LATE">LATE</option>
                    <option value="INVALID">INVALID</option>
                    <option value="ABSENT">ABSENT</option>
                  </select>
                </div>
              </CardHeader>
              
              <CardContent className="p-0 border-t border-border overflow-y-auto max-h-[260px]">
                {filteredRoster.length === 0 ? (
                  <div className="h-[200px] flex items-center justify-center">
                    <p className="text-xs text-muted-foreground italic">No roster matches found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-background/50 text-muted-foreground uppercase tracking-wider text-[9px] font-bold">
                          <th className="px-5 py-3">Employee</th>
                          <th className="px-5 py-3">Dept</th>
                          <th className="px-5 py-3">Punch In/Out</th>
                          <th className="px-5 py-3">Status</th>
                          <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {filteredRoster.map((item) => (
                          <tr key={item.user.id} className="hover:bg-accent/20 transition-colors">
                            <td className="px-5 py-3">
                              <p className="font-semibold text-foreground">{item.user.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate max-w-[130px]">{item.user.email}</p>
                            </td>
                            <td className="px-5 py-3 text-muted-foreground font-medium">{item.user.department}</td>
                            <td className="px-5 py-3 text-muted-foreground font-mono">
                              {item.punch ? (
                                <p>
                                  {new Date(item.punch.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  {item.punch.checkOutTime && ` - ${new Date(item.punch.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                </p>
                              ) : '--'}
                            </td>
                            <td className="px-5 py-3">
                              <Badge variant={
                                item.status === 'LATE' ? 'warning' : 
                                item.status === 'INVALID' ? 'danger' : 
                                item.status === 'ABSENT' ? 'secondary' : 'success'
                              } className="text-[8px] py-0 px-1.5">
                                {item.status}
                              </Badge>
                            </td>
                            <td className="px-5 py-3 text-right">
                              {item.punch && item.status !== 'INVALID' && (
                                <Button 
                                  onClick={() => setSelectedPunch({ 
                                    attendanceId: item.punch!.id, 
                                    userName: item.user.name 
                                  })}
                                  variant="danger" 
                                  size="xs"
                                  className="text-[9px] py-0.5 px-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                                >
                                  Invalidate
                                </Button>
                              )}
                            </td>
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
      )}

      {/* Audit Invalidation Modal Pop-up */}
      {selectedPunch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in text-left">
          <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-premium-hover p-1">
            <CardHeader className="flex flex-row items-center justify-between border-b-0 pb-1">
              <div>
                <CardTitle className="text-sm font-bold flex items-center space-x-1.5 text-rose-400">
                  <ShieldAlert className="h-4.5 w-4.5" />
                  <span>Audit Correction Warning</span>
                </CardTitle>
                <CardDescription>Flag {selectedPunch.userName}'s attendance record as invalid</CardDescription>
              </div>
              <button 
                onClick={() => setSelectedPunch(null)}
                className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>

            <form onSubmit={handleInvalidateSubmit}>
              <CardContent className="space-y-4 pt-2">
                
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This transaction represents an official correction override. The database record status will change to <strong>INVALID</strong>. This override will create a permanent, non-deletable trace inside the <strong>AttendanceLog</strong> audit table.
                </p>

                {modalError && (
                  <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-xs font-semibold flex items-center space-x-2">
                    <X className="h-4 w-4 flex-shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}
                {modalSuccess && (
                  <div className="p-3 bg-success/10 border border-success/20 text-success rounded-lg text-xs font-semibold flex items-center space-x-2">
                    <ShieldCheck className="h-4 w-4 flex-shrink-0" />
                    <span>{modalSuccess}</span>
                  </div>
                )}

                {/* Correction Reason */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-foreground uppercase">Reason for Invalidation Override</label>
                  <textarea 
                    value={invalidateReason}
                    onChange={(e) => setInvalidateReason(e.target.value)}
                    placeholder="Provide explicit audit justification (e.g. Employee clocked from home outside range)..." 
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all min-h-[80px]"
                    required
                  />
                </div>

              </CardContent>
              <div className="px-6 py-4 border-t border-border flex items-center justify-end space-x-2 bg-background/30 rounded-b-xl">
                <Button 
                  type="button"
                  onClick={() => setSelectedPunch(null)}
                  variant="secondary"
                  size="sm"
                  className="border border-border bg-transparent"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  isLoading={modalLoading}
                  variant="danger"
                  size="sm"
                >
                  Commit Invalidation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

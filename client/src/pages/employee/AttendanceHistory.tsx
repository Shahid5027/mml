import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Calendar as CalendarIcon, List, Eye, Sparkles, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  date: string;
  checkInTime: string;
  checkInLat: number;
  checkInLng: number;
  checkOutTime: string | null;
  checkOutLat: number | null;
  checkOutLng: number | null;
  workingHours: number | null;
  isLate: boolean;
  status: 'PRESENT' | 'LATE' | 'INVALID';
}

export const AttendanceHistory = () => {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayDetail, setSelectedDayDetail] = useState<AttendanceRecord | null>(null);

  // 1. Fetch monthly history from backend API
  const fetchHistory = async () => {
    setLoading(true);
    setSelectedDayDetail(null);
    try {
      const response = await axios.get(`/api/attendance/history?month=${currentMonth}`);
      setHistory(response.data);
    } catch (err) {
      console.error('Failed to retrieve history ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [currentMonth]);

  // 2. Aggregate statistics dynamically from fetched monthly logs
  const stats = React.useMemo(() => {
    if (history.length === 0) {
      return {
        attendanceRate: 0,
        avgCheckIn: 'N/A',
        lateCount: 0
      };
    }

    const validDays = history.filter(r => r.status !== 'INVALID');
    const lateDays = history.filter(r => r.status === 'LATE');
    const attendanceRate = Math.round((validDays.length / 22) * 100); // 22 standard working days in a month

    // Average check-in time calculation
    let totalMinutes = 0;
    history.forEach(r => {
      const d = new Date(r.checkInTime);
      totalMinutes += d.getHours() * 60 + d.getMinutes();
    });
    
    const avgMinutes = Math.round(totalMinutes / history.length);
    const avgHrs = Math.floor(avgMinutes / 60);
    const avgMins = avgMinutes % 60;
    const formatHrs = avgHrs % 12 || 12;
    const ampm = avgHrs >= 12 ? 'PM' : 'AM';
    const avgCheckIn = `${String(formatHrs).padStart(2, '0')}:${String(avgMins).padStart(2, '0')} ${ampm}`;

    return {
      attendanceRate: Math.min(attendanceRate, 100),
      avgCheckIn,
      lateCount: lateDays.length
    };
  }, [history]);

  // 3. Calendar Grid math helpers
  const calendarDays = React.useMemo(() => {
    const [year, month] = currentMonth.split('-').map(Number);
    const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0 = Sunday, 1 = Monday etc.
    const totalDays = new Date(year, month, 0).getDate(); // Total days in this month

    const days: { dayNumber: number | null; dateStr: string | null; record: AttendanceRecord | null }[] = [];

    // Fill preceding empty buffer cells
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: null, dateStr: null, record: null });
    }

    // Fill actual month day cells
    for (let day = 1; day <= totalDays; day++) {
      const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const record = history.find(r => r.date.startsWith(dayStr)) || null;
      days.push({
        dayNumber: day,
        dateStr: dayStr,
        record
      });
    }

    return days;
  }, [currentMonth, history]);

  // Calendar Header Year/Month Label formatter
  const formattedMonthLabel = React.useMemo(() => {
    const [year, month] = currentMonth.split('-').map(Number);
    return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [currentMonth]);

  const handleMonthStep = (step: number) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const nextDate = new Date(year, month - 1 + step, 1);
    setCurrentMonth(`${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
        <div className="text-left">
          <h2 className="text-xl font-bold tracking-tight text-foreground font-sans sm:text-2xl">
            My Attendance Ledger
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review detailed monthly attendance records, verified geolocation coordinates, and working hours.
          </p>
        </div>
        
        {/* View Mode Toggle triggers */}
        <div className="flex items-center space-x-2 border border-border p-1 bg-card rounded-lg shadow-sm">
          <Button 
            onClick={() => setViewMode('calendar')} 
            variant={viewMode === 'calendar' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="text-xs py-1 px-2.5 h-8 border-0"
            leftIcon={<CalendarIcon className="h-3.5 w-3.5" />}
          >
            Calendar
          </Button>
          <Button 
            onClick={() => setViewMode('list')} 
            variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="text-xs py-1 px-2.5 h-8 border-0"
            leftIcon={<List className="h-3.5 w-3.5" />}
          >
            List Ledger
          </Button>
        </div>
      </div>

      {/* Primary Panels */}
      <div className="grid gap-6 md:grid-cols-4 text-left">
        
        {/* Left Filter & Statistics Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Ledger Overview</CardTitle>
            <CardDescription>Filter and analyze selected month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Month Select Picker */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-foreground uppercase">Select Target Month</label>
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
            
            {/* Dynamic aggregated month stats */}
            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-medium">Attendance Rate</span>
                <span className="text-foreground font-bold">{stats.attendanceRate}%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-medium">Average Punch Time</span>
                <span className="text-foreground font-bold">{stats.avgCheckIn}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-medium">Total Late Flagged</span>
                <Badge variant={stats.lateCount > 0 ? 'warning' : 'success'} className="text-[10px] px-1.5">
                  {stats.lateCount} {stats.lateCount === 1 ? 'Day' : 'Days'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Dynamic Log Container */}
        <div className="space-y-6 md:col-span-3">
          
          <Card className="p-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  {viewMode === 'calendar' ? 'Calendar Stamp Grid' : 'Attendance Ledgers'}
                </CardTitle>
                <CardDescription>
                  {viewMode === 'calendar' 
                    ? 'Visual grid showing punch events'
                    : 'Structured lookup table showing daily timestamps and working hours'}
                </CardDescription>
              </div>
              
              {/* Calendar Quick Month Steppers */}
              <div className="flex items-center space-x-2 border border-border px-2 py-1 bg-background rounded-lg text-xs font-semibold">
                <button onClick={() => handleMonthStep(-1)} className="hover:text-primary transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-1 min-w-[90px] text-center font-bold">{formattedMonthLabel}</span>
                <button onClick={() => handleMonthStep(1)} className="hover:text-primary transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            
            <CardContent className="p-0 border-t border-border">
              {loading ? (
                <div className="h-[320px] flex items-center justify-center">
                  <p className="text-xs text-muted-foreground animate-pulse">Consulting ledger database...</p>
                </div>
              ) : viewMode === 'calendar' ? (
                
                /* 1. CALENDAR GRID VIEW */
                <div className="p-4 space-y-4">
                  {/* Day Names Row */}
                  <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <span>Sun</span>
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                  </div>

                  {/* Calendar Grid Cells */}
                  <div className="grid grid-cols-7 gap-2.5">
                    {calendarDays.map((cell, idx) => {
                      const hasRecord = !!cell.record;
                      const status = cell.record?.status;

                      return (
                        <div 
                          key={idx}
                          onClick={() => hasRecord && setSelectedDayDetail(cell.record)}
                          className={`min-h-[56px] rounded-lg border p-1 text-left flex flex-col justify-between transition-all ${
                            !cell.dayNumber 
                              ? 'bg-transparent border-transparent' 
                              : hasRecord
                                ? 'bg-card border-border hover:border-primary cursor-pointer hover:shadow-sm'
                                : 'bg-background border-border/40 text-muted-foreground'
                          }`}
                        >
                          {cell.dayNumber && (
                            <span className="text-[10px] font-semibold">{cell.dayNumber}</span>
                          )}
                          
                          {cell.record && (
                            <div className="w-full flex flex-col items-start gap-0.5 mt-2">
                              {/* status Dot Badge */}
                              <div className="flex items-center space-x-1">
                                <span className={`h-1.5 w-1.5 rounded-full ${
                                  status === 'LATE' ? 'bg-amber-500' : status === 'INVALID' ? 'bg-rose-500' : 'bg-green-500'
                                }`} />
                                <span className="text-[8px] text-muted-foreground font-mono font-bold">
                                  {cell.record.workingHours ? `${cell.record.workingHours}h` : 'Active'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              ) : (
                
                /* 2. LIST DATA TABLE VIEW */
                history.length === 0 ? (
                  <div className="h-[280px] flex flex-col items-center justify-center space-y-2">
                    <Eye className="h-6 w-6 text-muted-foreground" />
                    <p className="text-xs font-bold text-foreground">No records logged</p>
                    <p className="text-[10px] text-muted-foreground">Select another target month or check in above.</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Stacked Card View */}
                    <div className="block md:hidden divide-y divide-border/60">
                      {history.map((rec) => (
                        <div 
                          key={rec.id} 
                          onClick={() => setSelectedDayDetail(rec)}
                          className="p-4 space-y-2.5 text-left cursor-pointer hover:bg-accent/20 transition-all"
                        >
                          <div className="flex justify-between items-start">
                            <p className="font-semibold text-foreground text-xs">
                              {new Date(rec.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>
                            <Badge variant={rec.status === 'LATE' ? 'warning' : rec.status === 'INVALID' ? 'danger' : 'success'} className="text-[8px] py-0 px-1">
                              {rec.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
                            <div>
                              <p className="text-[8px] uppercase font-bold tracking-wider">Clock In</p>
                              <p className="text-foreground font-medium mt-0.5">
                                {new Date(rec.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <div>
                              <p className="text-[8px] uppercase font-bold tracking-wider">Clock Out</p>
                              <p className="text-foreground font-medium mt-0.5">
                                {rec.checkOutTime 
                                  ? new Date(rec.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : <span className="text-amber-500 font-semibold italic text-[9px]">Active</span>
                                }
                              </p>
                            </div>
                            <div>
                              <p className="text-[8px] uppercase font-bold tracking-wider">Hours</p>
                              <p className="text-foreground font-mono font-bold mt-0.5">
                                {rec.workingHours !== null ? `${rec.workingHours}h` : '--'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-border bg-background/50 text-muted-foreground uppercase tracking-wider text-[10px] font-bold">
                            <th className="px-6 py-3.5">Calendar Date</th>
                            <th className="px-6 py-3.5">Clock In</th>
                            <th className="px-6 py-3.5">Clock Out</th>
                            <th className="px-6 py-3.5">Working Hours</th>
                            <th className="px-6 py-3.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {history.map((rec) => (
                            <tr key={rec.id} className="hover:bg-accent/30 transition-colors">
                              <td className="px-6 py-4 font-semibold text-foreground">
                                {new Date(rec.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className="px-6 py-4 text-muted-foreground">
                                {new Date(rec.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-6 py-4 text-muted-foreground">
                                {rec.checkOutTime 
                                  ? new Date(rec.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : <span className="text-[10px] italic text-amber-500 font-semibold">Active Shift</span>
                                }
                              </td>
                              <td className="px-6 py-4 font-mono font-bold text-foreground">
                                {rec.workingHours !== null ? `${rec.workingHours} hrs` : '--'}
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant={rec.status === 'LATE' ? 'warning' : rec.status === 'INVALID' ? 'danger' : 'success'} className="text-[9px] py-0">
                                  {rec.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )
              )}
            </CardContent>
          </Card>

          {/* Clicked Day Popover Detail panel */}
          {selectedDayDetail && (
            <Card className="border border-primary/20 bg-primary/5 animate-fade-in p-1 text-left">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center space-x-1">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>Verified Stamp Details: {new Date(selectedDayDetail.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span>Check-In: <strong>{new Date(selectedDayDetail.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                  </div>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span>Coordinates: <strong>{selectedDayDetail.checkInLat.toFixed(4)}, {selectedDayDetail.checkInLng.toFixed(4)}</strong></span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span>Check-Out: <strong>{selectedDayDetail.checkOutTime ? new Date(selectedDayDetail.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}</strong></span>
                  </div>
                  {selectedDayDetail.checkOutLat && (
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <span>Coordinates: <strong>{selectedDayDetail.checkOutLat.toFixed(4)}, {selectedDayDetail.checkOutLng?.toFixed(4)}</strong></span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

        </div>

      </div>

    </div>
  );
};

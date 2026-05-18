import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ShieldCheck, ShieldAlert, Shield, Users, Clock, MapPin, RefreshCw, AlertTriangle, Fingerprint } from 'lucide-react';

interface InsightItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  department: string;
  confidenceScore: number;
  unusualLocation: boolean;
  unusualTiming: boolean;
  failedAttemptsCount: number;
  analysisDetails: string;
}

interface LogItem {
  id: string;
  userId: string;
  eventType: string;
  timestamp: string;
  lat: number;
  lng: number;
  distanceFromOffice: number;
  accepted: boolean;
  reason: string | null;
  user: {
    name: string;
    email: string;
    department: string;
  };
}

export const AttendanceInsights = () => {
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch insights and raw security logs
  const fetchInsights = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/attendance/insights');
      setInsights(response.data.insights);
      setLogs(response.data.recentLogs);
    } catch (err) {
      console.error('Failed to retrieve security insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  // 2. Client-side aggregates
  const aggregates = React.useMemo(() => {
    const total = insights.length;
    const suspicious = insights.filter(i => i.confidenceScore <= 50).length;
    const unusual = insights.filter(i => i.confidenceScore > 50 && i.confidenceScore <= 80).length;
    const normal = insights.filter(i => i.confidenceScore > 80).length;
    return { total, suspicious, unusual, normal };
  }, [insights]);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
        <div className="text-left">
          <h2 className="text-xl font-bold tracking-tight text-foreground font-sans sm:text-2xl">
            Location Security & Trust Analytics
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit geofence perimeter trust levels, capture coordinate spoofing, and investigate device clock anomalies.
          </p>
        </div>
        
        <Button 
          onClick={fetchInsights} 
          variant="secondary" 
          size="sm" 
          className="border border-border bg-card"
          leftIcon={<RefreshCw className="h-4 w-4" />}
        >
          Scan Roster
        </Button>
      </div>

      {loading ? (
        <div className="h-[400px] flex items-center justify-center">
          <p className="text-xs text-muted-foreground animate-pulse font-sans">Scanning corporate geofence audit registries...</p>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in text-left">
          
          {/* Top Security Indicators (matching 98%, 74%, 43% example metrics) */}
          <div className="grid gap-6 sm:grid-cols-3">
            
            {/* 98% Normal Roster */}
            <Card className="p-1 border-l-4 border-l-emerald-500">
              <CardContent className="pt-4 flex items-center space-x-4">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Normal Trust Roster (98%)</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">{aggregates.normal} staff profiles</p>
                  <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">Geofence coordinate matches benchmark centers.</p>
                </div>
              </CardContent>
            </Card>

            {/* 74% Unusual Location */}
            <Card className="p-1 border-l-4 border-l-amber-500">
              <CardContent className="pt-4 flex items-center space-x-4">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Unusual Locations (74%)</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">{aggregates.unusual} exceptions</p>
                  <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">Device checked in close to geofence boundaries.</p>
                </div>
              </CardContent>
            </Card>

            {/* 43% Suspicious Pattern */}
            <Card className="p-1 border-l-4 border-l-rose-500">
              <CardContent className="pt-4 flex items-center space-x-4">
                <div className="h-10 w-10 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Suspicious Patterns (43%)</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">{aggregates.suspicious} threats</p>
                  <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">Multiple consecutive out-of-perimeter rejections.</p>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Anomalies Table & Live Audit Logs Feed */}
          <div className="grid gap-6 md:grid-cols-5">
            
            {/* Left side Anomalies Table */}
            <Card className="md:col-span-3 flex flex-col p-1">
              <CardHeader>
                <CardTitle>Perimeter Trust Directory</CardTitle>
                <CardDescription>Comprehensive lookup analyzing location drifts and chronometer violations</CardDescription>
              </CardHeader>
              
              <CardContent className="p-0 border-t border-border overflow-y-auto max-h-[360px]">
                {insights.length === 0 ? (
                  <div className="h-[200px] flex items-center justify-center">
                    <p className="text-xs text-muted-foreground italic">No security anomalies registered.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-background/50 text-muted-foreground uppercase tracking-wider text-[9px] font-bold">
                          <th className="px-5 py-3">Employee</th>
                          <th className="px-5 py-3">Drift / Clock Flags</th>
                          <th className="px-5 py-3">Security Diagnostics</th>
                          <th className="px-5 py-3 text-right">Confidence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {insights.map((item) => (
                          <tr key={item.id} className="hover:bg-accent/20 transition-colors">
                            <td className="px-5 py-3.5">
                              <p className="font-semibold text-foreground">{item.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate max-w-[130px]">{item.email}</p>
                            </td>
                            <td className="px-5 py-3.5 space-y-1">
                              <div className="flex items-center space-x-1.5 text-[9px]">
                                <span className={`h-2 w-2 rounded-full ${item.unusualLocation ? 'bg-amber-500' : 'bg-muted-foreground/30'}`} />
                                <span className={item.unusualLocation ? 'text-amber-500 font-bold' : 'text-muted-foreground'}>Location Drift</span>
                              </div>
                              <div className="flex items-center space-x-1.5 text-[9px]">
                                <span className={`h-2 w-2 rounded-full ${item.unusualTiming ? 'bg-purple-500' : 'bg-muted-foreground/30'}`} />
                                <span className={item.unusualTiming ? 'text-purple-400 font-bold' : 'text-muted-foreground'}>Clock Anomaly</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-muted-foreground leading-snug max-w-[200px] text-[10px] font-medium">
                              {item.analysisDetails}
                            </td>
                            <td className="px-5 py-3.5 text-right font-mono font-bold">
                              <span className={
                                item.confidenceScore <= 50 ? 'text-rose-400' : 
                                item.confidenceScore <= 80 ? 'text-amber-400' : 'text-emerald-400'
                              }>
                                {item.confidenceScore}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right side real-time Activity Feed / Logs */}
            <Card className="md:col-span-2 flex flex-col p-1">
              <CardHeader>
                <CardTitle>Real-Time Audit Stream</CardTitle>
                <CardDescription>Live streaming sequence of geofence logs, check-ins, and rejections</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto max-h-[360px] p-0 border-t border-border bg-background/10">
                {logs.length === 0 ? (
                  <div className="h-full flex items-center justify-center p-6 text-center">
                    <p className="text-xs text-muted-foreground italic">No security logs recorded.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {logs.map((log) => (
                      <div key={log.id} className="p-3.5 space-y-1.5 hover:bg-accent/20 transition-colors">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-foreground">{log.user.name}</span>
                          <span className="text-muted-foreground font-normal">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-[9px]">
                          <Badge variant={log.accepted ? 'success' : 'danger'} className="text-[8px] py-0 px-1">
                            {log.eventType === 'CHECK_IN' ? 'IN' : 'OUT'}
                          </Badge>
                          <span className="text-muted-foreground font-mono">
                            Dist: {log.distanceFromOffice.toFixed(1)}m
                          </span>
                        </div>
                        {log.reason && (
                          <p className="text-[9px] leading-relaxed text-muted-foreground/80 font-medium pl-1 border-l border-border mt-0.5 italic">
                            {log.reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

        </div>
      )}

    </div>
  );
};

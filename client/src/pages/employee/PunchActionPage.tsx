import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { MapPin, ShieldCheck, Navigation, AlertCircle, CheckCircle2, Map as MapIcon, ShieldAlert } from 'lucide-react';

// Resolve default marker asset issues in Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom colored marker icons for visual checks
const CurrentLocationIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const SuccessPunchIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const FailedPunchIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// Component to dynamically fit map camera view to encompass both Markers
const FitMapBounds = ({ points }: { points: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) {
      map.setView(points[0], 16);
    } else if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [points, map]);
  return null;
};

export const PunchActionPage = () => {
  const [todayAtt, setTodayAtt] = useState<any>(null);
  const [officeSettings, setOfficeSettings] = useState<any>(null);

  // Coordinate capture states
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Visual punch history trackers on map canvas
  const [punchState, setPunchState] = useState<'IDLE' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [punchCoords, setPunchCoords] = useState<[number, number] | null>(null);

  // Punch triggers
  const [punchLoading, setPunchLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // 1. Fetch today's status on mount
  const fetchTodayStatus = async () => {
    try {
      const response = await axios.get('/api/attendance/today');
      setTodayAtt(response.data.attendance);
      setOfficeSettings(response.data.office);
      
      // If already punched today, show checkIn coords as successful punch marker
      if (response.data.attendance) {
        setPunchState('SUCCESS');
        setPunchCoords([response.data.attendance.checkInLat, response.data.attendance.checkInLng]);
      }
    } catch (err) {
      console.error('Failed to load status:', err);
    }
  };

  useEffect(() => {
    fetchTodayStatus();
  }, []);

  // 2. Geolocation: request and capture user current location
  const handleCaptureLocation = () => {
    setLoading(true);
    setPermissionError(null);
    setFeedbackError(null);
    setFeedbackSuccess(null);

    if (!navigator.geolocation) {
      setPermissionError('Geolocation API is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setLoading(false);
      },
      (error) => {
        console.error('Browser Geolocation error:', error);
        let errorMsg = 'Failed to capture coordinates.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Location access denied. Please enable browser location permissions in your site preferences to allow geo-attendance punches.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'Location information is unavailable. Verify that your device GPS is active.';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'GPS capture request timed out. Please try again.';
        }
        setPermissionError(errorMsg);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 3. POST punch request to server (Check-In or Check-Out)
  const executePunch = async (type: 'check-in' | 'check-out') => {
    if (lat === null || lng === null) {
      setFeedbackError('No valid browser coordinates captured. Capture location first.');
      return;
    }

    setPunchLoading(true);
    setFeedbackError(null);
    setFeedbackSuccess(null);

    try {
      const response = await axios.post(`/api/attendance/${type}`, {
        latitude: lat,
        longitude: lng
      });

      setFeedbackSuccess(response.data.message || 'Punch processed successfully!');
      
      // Update visual maps check state
      setPunchState('SUCCESS');
      setPunchCoords([lat, lng]);

      // Reset coords and refresh today status
      setLat(null);
      setLng(null);
      fetchTodayStatus();

      // Clear alert after delay
      setTimeout(() => setFeedbackSuccess(null), 4000);
    } catch (err: any) {
      console.error('Punch execution failure:', err);
      const msg = err.response?.data?.message || 'Transaction rejected by server.';
      
      // Update maps warning state
      setPunchState('FAILED');
      setPunchCoords([lat, lng]);
      
      setFeedbackError(msg);
    } finally {
      setPunchLoading(false);
    }
  };

  // Generate mapping coordinate points dynamically to fit maps bounds
  const mapPoints = useMemo(() => {
    const points: [number, number][] = [];
    if (officeSettings) {
      points.push([officeSettings.latitude, officeSettings.longitude]);
    }
    if (lat !== null && lng !== null) {
      points.push([lat, lng]);
    }
    if (punchCoords) {
      points.push(punchCoords);
    }
    return points;
  }, [lat, lng, officeSettings, punchCoords]);

  const defaultCenter: [number, number] = officeSettings 
    ? [officeSettings.latitude, officeSettings.longitude] 
    : [12.894300, 77.575300];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="border-b border-border pb-6 text-left">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-sans sm:text-2xl">
          Geo Attendance Punch Terminal
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Punch transactions require validation within the configured office perimeter.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-5 text-left animate-fade-in">
        
        {/* Left Side Control Station */}
        <div className="space-y-6 md:col-span-2">
          
          <Card glass={true} className="p-1 border border-border/40">
            <CardHeader>
              <CardTitle>Coordinate Station</CardTitle>
              <CardDescription>Capture active browser geolocation before executing punch transactions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Today's Punch status Card */}
              <div className="rounded-lg border border-border bg-background/50 p-4 space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Today's punch logs</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground">Check-In</p>
                    {todayAtt ? (
                      <p className="text-xs font-semibold text-foreground">
                        {new Date(todayAtt.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    ) : (
                      <p className="text-xs font-medium text-amber-500 italic">Not Punched</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground">Check-Out</p>
                    {todayAtt && todayAtt.checkOutTime ? (
                      <p className="text-xs font-semibold text-foreground">
                        {new Date(todayAtt.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    ) : (
                      <p className="text-xs font-medium text-amber-500 italic">Not Punched</p>
                    )}
                  </div>
                </div>

                {todayAtt && (
                  <div className="border-t border-border/60 pt-2 flex justify-between items-center text-[10px]">
                    <span className="text-muted-foreground">Shift Status:</span>
                    <Badge variant={todayAtt.status === 'LATE' ? 'warning' : 'success'}>
                      {todayAtt.status}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Geolocation feedback alerts */}
              {permissionError && (
                <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-xs font-semibold flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span className="leading-tight">{permissionError}</span>
                </div>
              )}
              {feedbackError && (
                <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-xs font-semibold flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span className="leading-tight">{feedbackError}</span>
                </div>
              )}
              {feedbackSuccess && (
                <div className="p-3 bg-success/10 border border-success/20 text-success rounded-lg text-xs font-semibold flex items-start space-x-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span className="leading-tight">{feedbackSuccess}</span>
                </div>
              )}

              {/* Coordinates panel */}
              <div className="rounded-lg border border-border bg-background/30 p-4 space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-muted-foreground">My Location Coords</span>
                  <Badge variant={lat !== null ? 'success' : 'secondary'}>
                    {lat !== null ? 'CAPTURED' : 'PENDING'}
                  </Badge>
                </div>
                {lat !== null && lng !== null ? (
                  <div className="font-mono text-xs font-bold text-foreground space-y-0.5">
                    <p>Lat: {lat.toFixed(6)}</p>
                    <p>Lng: {lng.toFixed(6)}</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No location captured. Click coordinate capture below.</p>
                )}
              </div>

              {/* Capture trigger */}
              <Button 
                onClick={handleCaptureLocation} 
                isLoading={loading} 
                variant="secondary" 
                size="md" 
                className="w-full text-xs border border-border bg-transparent"
                leftIcon={<Navigation className="h-4 w-4" />}
              >
                Capture Geolocation
              </Button>

              {/* Punch trigger buttons */}
              <div className="border-t border-border pt-4 grid grid-cols-2 gap-3">
                <Button 
                  disabled={lat === null || !!todayAtt} 
                  onClick={() => executePunch('check-in')}
                  isLoading={punchLoading}
                  variant="primary" 
                  size="lg" 
                  className="w-full text-xs font-bold py-2.5"
                  leftIcon={<ShieldCheck className="h-4 w-4" />}
                >
                  Check In
                </Button>
                <Button 
                  disabled={lat === null || !todayAtt || !!todayAtt.checkOutTime} 
                  onClick={() => executePunch('check-out')}
                  isLoading={punchLoading}
                  variant="danger" 
                  size="lg" 
                  className="w-full text-xs font-bold py-2.5"
                  leftIcon={<MapPin className="h-4 w-4" />}
                >
                  Check Out
                </Button>
              </div>

            </CardContent>
          </Card>

        </div>

        {/* Right Side Leaflet Map Canvas */}
        <Card glass={true} className="md:col-span-3 overflow-hidden flex flex-col border border-border/40">
          <CardHeader className="border-b border-border bg-card">
            <CardTitle>Geofence Perimeter Preview</CardTitle>
            <CardDescription>Live map showing office geofence circle and captured device markers</CardDescription>
          </CardHeader>
          <div className="flex-1 min-h-[380px] w-full relative z-10">
            <MapContainer 
              center={defaultCenter} 
              zoom={16} 
              className="h-full w-full absolute inset-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Autocenter camera to bounds when points populate */}
              <FitMapBounds points={mapPoints} />

              {/* Office Benchmark Circle Geofence */}
              {officeSettings && (
                <>
                  <Marker position={[officeSettings.latitude, officeSettings.longitude]} />
                  <Circle 
                    center={[officeSettings.latitude, officeSettings.longitude]}
                    radius={officeSettings.radiusMeters}
                    pathOptions={{ 
                      color: 'rgba(37, 99, 235, 0.65)', 
                      fillColor: 'rgba(37, 99, 235, 0.12)', 
                      fillOpacity: 0.4, 
                      weight: 2 
                    }}
                  />
                </>
              )}

              {/* Captured Employee Pin (Active captured location) */}
              {lat !== null && lng !== null && (
                <Marker 
                  position={[lat, lng]} 
                  icon={CurrentLocationIcon}
                />
              )}

              {/* Successful check-in visualization marker */}
              {punchState === 'SUCCESS' && punchCoords && (
                <Marker 
                  position={punchCoords}
                  icon={SuccessPunchIcon}
                />
              )}

              {/* Failed check-in visualization marker & perimeter breach indicator path */}
              {punchState === 'FAILED' && punchCoords && officeSettings && (
                <>
                  <Marker 
                    position={punchCoords}
                    icon={FailedPunchIcon}
                  />
                  {/* Connect failed marker to office center with a dashed red line (Usability & Polish!) */}
                  <Polyline 
                    positions={[
                      [officeSettings.latitude, officeSettings.longitude],
                      punchCoords
                    ]}
                    pathOptions={{
                      color: 'rgba(239, 68, 68, 0.8)',
                      dashArray: '5, 10',
                      weight: 2
                    }}
                  />
                </>
              )}

            </MapContainer>
          </div>
        </Card>

      </div>

    </div>
  );
};

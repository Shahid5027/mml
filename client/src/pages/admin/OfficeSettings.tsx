import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { MapPin, Sliders, Map as MapIcon, RefreshCw, Clock, Check, AlertCircle } from 'lucide-react';

// Resolve broken default Leaflet marker assets in bundler builds
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Sub-component to center Leaflet camera when inputs change
const ChangeMapView = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

export const OfficeSettings = () => {
  const [lat, setLat] = useState<number>(12.894300);
  const [lng, setLng] = useState<number>(77.575300);
  const [radius, setRadius] = useState<number>(100);
  const [lateMinutes, setLateMinutes] = useState<number>(15);

  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const markerRef = useRef<L.Marker | null>(null);

  // 1. Fetch active settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get('/api/settings');
        const { latitude, longitude, radiusMeters, lateThresholdMinutes } = response.data;
        setLat(latitude);
        setLng(longitude);
        setRadius(radiusMeters);
        setLateMinutes(lateThresholdMinutes);
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Center coordinate list for camera and circles
  const mapCenter: [number, number] = useMemo(() => [lat, lng], [lat, lng]);

  // 2. Draggable marker dragend handler
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newLatLng = marker.getLatLng();
          setLat(parseFloat(newLatLng.lat.toFixed(6)));
          setLng(parseFloat(newLatLng.lng.toFixed(6)));
        }
      },
    }),
    []
  );

  // 3. Geolocation API: "Use Current Location" handler
  const handleUseCurrentLocation = () => {
    setGpsLoading(true);
    setFeedbackError(null);
    setFeedbackSuccess(null);

    if (!navigator.geolocation) {
      setFeedbackError('Geolocation API is not supported by your browser.');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentLat = parseFloat(position.coords.latitude.toFixed(6));
        const currentLng = parseFloat(position.coords.longitude.toFixed(6));
        setLat(currentLat);
        setLng(currentLng);
        setGpsLoading(false);
        setFeedbackSuccess('Browser coordinates retrieved successfully!');
      },
      (error) => {
        console.error('GPS tracking failed:', error);
        setFeedbackError(`Permission rejected: ${error.message}`);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // 4. PUT settings handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);
    setFeedbackSuccess(null);
    setSaveLoading(true);

    try {
      const response = await axios.put('/api/settings', {
        latitude: lat,
        longitude: lng,
        radiusMeters: radius,
        lateThresholdMinutes: lateMinutes
      });

      setFeedbackSuccess(response.data.message || 'Geofence settings updated successfully!');
      setTimeout(() => setFeedbackSuccess(null), 2500);
    } catch (err: any) {
      console.error('Save settings failure:', err);
      const msg = err.response?.data?.message || 'Failed to update geofence parameters.';
      setFeedbackError(msg);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="border-b border-border pb-6 text-left">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-sans sm:text-2xl">
          Office Geofencing & Map Settings
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Establish coordinate perimeters and late threshold exceptions for automatic check-in processing.
        </p>
      </div>

      {loading ? (
        <div className="h-[400px] flex items-center justify-center">
          <p className="text-xs text-muted-foreground animate-pulse">Synchronizing map configurations...</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-5 text-left animate-fade-in">
          
          {/* Configuration Form Card */}
          <div className="space-y-6 md:col-span-2">
            <Card className="p-1">
              <CardHeader>
                <CardTitle>Perimeter Benchmarks</CardTitle>
                <CardDescription>Drag the office marker on the canvas or type values below</CardDescription>
              </CardHeader>
              
              <form onSubmit={handleSaveSettings}>
                <CardContent className="space-y-4">
                  
                  {/* Status alert banners */}
                  {feedbackError && (
                    <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-xs font-semibold flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{feedbackError}</span>
                    </div>
                  )}
                  {feedbackSuccess && (
                    <div className="p-3 bg-success/10 border border-success/20 text-success rounded-lg text-xs font-semibold flex items-center space-x-2">
                      <Check className="h-4 w-4 flex-shrink-0" />
                      <span>{feedbackSuccess}</span>
                    </div>
                  )}

                  {/* Latitude input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-foreground uppercase">Office Latitude</label>
                    <input 
                      type="number" 
                      step="any"
                      value={lat} 
                      onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 12.894300" 
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                      required
                    />
                  </div>

                  {/* Longitude input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-foreground uppercase">Office Longitude</label>
                    <input 
                      type="number" 
                      step="any"
                      value={lng} 
                      onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 77.575300" 
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                      required
                    />
                  </div>

                  {/* Radius meters slider */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase text-foreground">
                      <span>Perimeter Proximity Range</span>
                      <Badge variant="primary" className="text-[10px] font-mono">{radius} Meters</Badge>
                    </div>
                    <input 
                      type="range" 
                      min="20" 
                      max="1000" 
                      step="10"
                      value={radius} 
                      onChange={(e) => setRadius(parseInt(e.target.value))}
                      className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-[9px] text-muted-foreground font-medium">
                      <span>20m (Tight)</span>
                      <span>500m</span>
                      <span>1000m (Broad)</span>
                    </div>
                  </div>

                  {/* Late minutes threshold */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-[10px] font-bold text-foreground uppercase">Late Arrival Buffer (Minutes)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={lateMinutes} 
                        onChange={(e) => setLateMinutes(parseInt(e.target.value) || 0)}
                        placeholder="Minutes from shift start" 
                        className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                        required
                      />
                      <Clock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Employees clocking in after shift start + buffer will automatically trigger a LATE status flag.
                    </p>
                  </div>

                  {/* Browser location fetch trigger */}
                  <Button 
                    type="button"
                    onClick={handleUseCurrentLocation}
                    isLoading={gpsLoading}
                    variant="secondary" 
                    size="sm" 
                    className="w-full text-xs border border-border bg-transparent mt-2"
                    leftIcon={<MapPin className="h-4 w-4" />}
                  >
                    Use Current Location
                  </Button>

                </CardContent>
                <CardFooter className="border-t border-border bg-background/30 rounded-b-xl">
                  <Button 
                    type="submit" 
                    isLoading={saveLoading} 
                    variant="primary" 
                    size="md" 
                    className="w-full text-xs font-bold"
                  >
                    Save Mapping Settings
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          {/* Leaflet Mapping Sandbox Container */}
          <Card className="md:col-span-3 overflow-hidden flex flex-col">
            <CardHeader className="border-b border-border bg-card">
              <CardTitle>Geofence Mapping Canvas</CardTitle>
              <CardDescription>Drag the blue pin marker to set corporate office boundaries</CardDescription>
            </CardHeader>
            <div className="flex-1 min-h-[380px] w-full relative z-10">
              <MapContainer 
                center={mapCenter} 
                zoom={16} 
                className="h-full w-full absolute inset-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Dynamically update map position view on input changes */}
                <ChangeMapView center={mapCenter} />

                {/* Draggable Benchmark Marker */}
                <Marker 
                  position={mapCenter}
                  draggable={true}
                  eventHandlers={eventHandlers}
                  ref={markerRef}
                />

                {/* Acceptable punch radius boundary circle */}
                <Circle 
                  center={mapCenter}
                  radius={radius}
                  pathOptions={{ 
                    color: 'rgba(37, 99, 235, 0.65)', 
                    fillColor: 'rgba(37, 99, 235, 0.12)', 
                    fillOpacity: 0.4, 
                    weight: 2 
                  }}
                />
              </MapContainer>
            </div>
          </Card>

        </div>
      )}

    </div>
  );
};

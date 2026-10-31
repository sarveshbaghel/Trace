import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, Platform, PermissionsAndroid } from 'react-native';
import { WebView } from 'react-native-webview';
import Geolocation from 'react-native-geolocation-service';
import { TraceApi } from '../api/TraceApi';
import { theme } from '../theme';

interface MapScreenProps {
  navigation: any;
}

export const MapScreen: React.FC<MapScreenProps> = ({ navigation }) => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    fetchComplaints();
    requestAndFetchLocation();
  }, []);

  const requestAndFetchLocation = async () => {
    let hasPermission = true;
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);
        hasPermission =
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
            PermissionsAndroid.RESULTS.GRANTED ||
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
            PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        hasPermission = false;
      }
    }

    if (hasPermission) {
      Geolocation.getCurrentPosition(
        position => {
          setUserLat(position.coords.latitude);
          setUserLng(position.coords.longitude);
        },
        error => console.warn('Location error:', error),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    }
  };

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const data = await TraceApi.getMapComplaints();
      setComplaints(data);
    } catch (error) {
      console.warn('Failed to fetch map complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryEmoji = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'pothole': return '🕳️';
      case 'garbage': return '🗑️';
      case 'broken streetlight': return '💡';
      case 'water leakage': return '💧';
      default: return '📍';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'SUBMITTED': return '#F59E0B';
      case 'IN_PROGRESS': return '#3B82F6';
      case 'RESOLVED': return '#10B981';
      default: return '#6B7280';
    }
  };

  // Center on user location, fallback to Gwalior
  const centerLat = userLat ?? 26.2183;
  const centerLng = userLng ?? 78.1828;
  const zoom = userLat ? 14 : 12;

  const markersJson = JSON.stringify(
    complaints
      .filter(c => typeof c.latitude === 'number' && typeof c.longitude === 'number')
      .map(c => ({
        lat: c.latitude,
        lng: c.longitude,
        category: c.category,
        emoji: getCategoryEmoji(c.category),
        status: c.status,
        statusColor: getStatusColor(c.status),
        address: c.address || '',
      }))
  );

  const leafletHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; }
    html, body, #map { width: 100%; height: 100%; }
    .custom-marker {
      background: white;
      border: 2px solid #4F46E5;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    .user-marker {
      background: #4F46E5;
      border: 3px solid white;
      border-radius: 50%;
      width: 16px;
      height: 16px;
      box-shadow: 0 0 0 4px rgba(79,70,229,0.3), 0 2px 6px rgba(0,0,0,0.3);
    }
    .popup-category { font-weight: 700; font-size: 14px; margin-bottom: 4px; }
    .popup-status { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 10px; display: inline-block; color: white; margin-bottom: 4px; }
    .popup-address { font-size: 12px; color: #6B7280; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([${centerLat}, ${centerLng}], ${zoom});

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Attribution in corner
    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('© OpenStreetMap')
      .addTo(map);

    // Zoom control top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // User location marker
    ${userLat ? `
    var userIcon = L.divIcon({
      className: '',
      html: '<div class="user-marker"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    L.marker([${userLat}, ${userLng}], { icon: userIcon, zIndexOffset: 1000 })
      .addTo(map)
      .bindPopup('<b>📍 Your Location</b>');
    ` : ''}

    // Complaint markers
    var markers = ${markersJson};
    markers.forEach(function(m) {
      var icon = L.divIcon({
        className: '',
        html: '<div class="custom-marker">' + m.emoji + '</div>',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      L.marker([m.lat, m.lng], { icon: icon })
        .addTo(map)
        .bindPopup(
          '<div class="popup-category">' + m.emoji + ' ' + m.category + '</div>' +
          '<div class="popup-status" style="background:' + m.statusColor + '">' + m.status + '</div>' +
          (m.address ? '<div class="popup-address">📍 ' + m.address + '</div>' : '')
        );
    });
  </script>
</body>
</html>`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Live Map</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.countBadge}>{complaints.length} reports</Text>
      </View>
      
      <View style={styles.container}>
        {loading && complaints.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading reports...</Text>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: leafletHtml }}
            style={styles.map}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scrollEnabled={false}
            bounces={false}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          />
        )}
      </View>

      {/* Legend overlay */}
      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <Text style={styles.legendDot}>🕳️</Text>
          <Text style={styles.legendLabel}>Pothole</Text>
        </View>
        <View style={styles.legendRow}>
          <Text style={styles.legendDot}>🗑️</Text>
          <Text style={styles.legendLabel}>Garbage</Text>
        </View>
        <View style={styles.legendRow}>
          <Text style={styles.legendDot}>💡</Text>
          <Text style={styles.legendLabel}>Streetlight</Text>
        </View>
        <View style={styles.legendRow}>
          <Text style={styles.legendDot}>💧</Text>
          <Text style={styles.legendLabel}>Water</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    marginRight: theme.spacing.md,
    padding: theme.spacing.sm,
  },
  backButtonText: {
    fontSize: 24,
    color: theme.colors.text,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  countBadge: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  legend: {
    position: 'absolute',
    bottom: 16,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    gap: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  legendDot: {
    fontSize: 14,
  },
  legendLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
});

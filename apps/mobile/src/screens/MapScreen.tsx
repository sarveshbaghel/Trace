import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, Platform, PermissionsAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import MapView, { Marker, Callout, UrlTile } from 'react-native-maps';
import { TraceApi } from '../api/TraceApi';
import { theme } from '../theme';
import { OLA_MAPS_API_KEY } from '../config/env';

interface MapScreenProps {
  navigation: any;
}

export const MapScreen: React.FC<MapScreenProps> = ({ navigation }) => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [currentRegion, setCurrentRegion] = useState({
    latitude: 26.2183,
    longitude: 78.1828,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

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
          setCurrentRegion({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          });
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

  if (mapError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Live Map</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>🗺️</Text>
          <Text style={styles.errorText}>Map Unavailable</Text>
          <Text style={styles.errorSubText}>Please ensure the Google Maps SDK is enabled and the API key is correct.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Live Map</Text>
      </View>
      
      <View style={styles.container}>
        {loading && complaints.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading reports...</Text>
          </View>
        ) : (
          <MapView
            style={styles.map}
            region={currentRegion}
            showsUserLocation={true}
            showsMyLocationButton={true}
            mapType="none" // Use "none" so default Google/Apple map tiles don't load underneath Ola Maps
            onError={() => setMapError(true)}
          >
            {/* Ola Maps Raster Tiles */}
            <UrlTile
              urlTemplate={`https://api.olamaps.io/tiles/vector/v1/styles/default-light/rendered/{z}/{x}/{y}.png?api_key=${OLA_MAPS_API_KEY}`}
              maximumZ={19}
              flipY={false}
            />
            {complaints.map((complaint) => {
              // Ensure valid coordinates
              if (typeof complaint.latitude !== 'number' || typeof complaint.longitude !== 'number') return null;
              
              return (
                <Marker
                  key={complaint.id}
                  coordinate={{
                    latitude: complaint.latitude,
                    longitude: complaint.longitude,
                  }}
                >
                  <View style={styles.markerContainer}>
                    <Text style={styles.markerEmoji}>{getCategoryEmoji(complaint.category)}</Text>
                  </View>
                  <Callout>
                    <View style={styles.calloutContainer}>
                      <Text style={styles.calloutCategory}>{complaint.category}</Text>
                      <Text style={styles.calloutStatus}>{complaint.status}</Text>
                      {complaint.address && (
                        <Text style={styles.calloutAddress} numberOfLines={2}>
                          {complaint.address}
                        </Text>
                      )}
                    </View>
                  </Callout>
                </Marker>
              );
            })}
          </MapView>
        )}
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
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
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
  markerContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 5,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerEmoji: {
    fontSize: 18,
  },
  calloutContainer: {
    width: 200,
    padding: 10,
  },
  calloutCategory: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  calloutStatus: {
    color: theme.colors.primary,
    fontWeight: '500',
    marginBottom: 5,
    textTransform: 'capitalize',
  },
  calloutAddress: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  errorSubText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

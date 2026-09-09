import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { TraceApi } from '../api/TraceApi';
import { theme } from '../theme';

interface MapScreenProps {
  navigation: any;
}

export const MapScreen: React.FC<MapScreenProps> = ({ navigation }) => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

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

  // Center on Gwalior by default
  const initialRegion = {
    latitude: 26.2183,
    longitude: 78.1828,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
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
            initialRegion={initialRegion}
            onError={() => setMapError(true)}
          >
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

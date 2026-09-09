import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Platform,
  PermissionsAndroid,
  Modal,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Geolocation from 'react-native-geolocation-service';
import { theme } from '../theme';

// Safe MapView import — prevents crash if native module isn't linked
let MapViewComponent: any = null;
let MarkerComponent: any = null;
try {
  const maps = require('react-native-maps');
  MapViewComponent = maps.default;
  MarkerComponent = maps.Marker;
} catch (e) {
  console.warn('react-native-maps is not available:', e);
}

// Error boundary to catch native MapView crashes (e.g. missing API key)
class MapErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    console.warn('MapView crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback as React.ReactElement;
    }
    return this.props.children;
  }
}

interface ReportScreenProps {
  navigation: any;
}

export const ReportScreen: React.FC<ReportScreenProps> = ({ navigation }) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [issueType, setIssueType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [successResponse, setSuccessResponse] = useState<string | null>(null);
  const [dropdownExpanded, setDropdownExpanded] = useState(false);
  const [locationMode, setLocationMode] = useState<'live' | 'map' | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [tempLat, setTempLat] = useState(26.2183);
  const [tempLng, setTempLng] = useState(78.1828);

  const reportDate = new Date();
  const dateString = reportDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeString = reportDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const reverseGeocode = useCallback(
    async (lat: number, lng: number): Promise<string> => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
          { headers: { 'User-Agent': 'TraceApp/1.0' } },
        );
        const data = await response.json();
        return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      } catch {
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }
    },
    [],
  );

  const handleCamera = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message:
            'Trace needs access to your camera to take photos of issues.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        alert('Camera permission denied');
        return;
      }
    }

    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
    });

    if (result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri || null);
    }
  };

  const handleGallery = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    });

    if (result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri || null);
    }
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);
        return (
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
            PermissionsAndroid.RESULTS.GRANTED ||
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
            PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleLiveLocation = async () => {
    setLocationMode('live');
    setLocationLoading(true);
    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
      Geolocation.getCurrentPosition(
        async position => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLatitude(lat);
          setLongitude(lng);
          const addr = await reverseGeocode(lat, lng);
          setAddress(addr);
          setLocationLoading(false);
        },
        error => {
          console.log(error.code, error.message);
          setLocationLoading(false);
          alert(
            'Failed to detect location. Ensure location is enabled in device settings.',
          );
        },
        { enableHighAccuracy: false, timeout: 20000, maximumAge: 1000 },
      );
    } else {
      setLocationLoading(false);
      alert('Location permission denied');
    }
  };

  const handleSelectFromMap = () => {
    setLocationMode('map');
    // Seed the map with current location if available, otherwise use default
    if (latitude && longitude) {
      setTempLat(latitude);
      setTempLng(longitude);
    }
    setShowMapModal(true);
  };

  const handleConfirmMapLocation = async () => {
    setLatitude(tempLat);
    setLongitude(tempLng);
    setShowMapModal(false);
    setLocationLoading(true);
    const addr = await reverseGeocode(tempLat, tempLng);
    setAddress(addr);
    setLocationLoading(false);
  };

  const handleSubmit = () => {
    setLoading(true);
    // Mocking API call
    setTimeout(() => {
      setLoading(false);
      setSuccessResponse(
        'Report successfully logged and routed to the public works department.',
      );
    }, 1500);
  };

  const issueTypes = [
    'Pothole',
    'Garbage',
    'Broken streetlight',
    'Water leakage',
    'Other',
  ];

  // ─── Success State ───────────────────────────────────────────────
  if (successResponse) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>✅</Text>
          <Text style={styles.successTitle}>Report Submitted!</Text>
          <Text style={styles.successSubtitle}>
            Thank you for helping improve your community.
          </Text>

          <View style={styles.successCard}>
            <Text style={styles.successCardText}>{successResponse}</Text>
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.submitButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Map Fallback (when Maps SDK is unavailable) ─────────────────
  const mapFallback = (
    <View style={styles.mapFallback}>
      <Text style={styles.mapFallbackIcon}>🗺️</Text>
      <Text style={styles.mapFallbackTitle}>Map Unavailable</Text>
      <Text style={styles.mapFallbackText}>
        Please configure your Google Maps API key in AndroidManifest.xml to use
        this feature.
      </Text>
    </View>
  );

  // ─── Main Form ──────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">
        {/* Header */}
        <Text style={styles.title}>Report an Issue</Text>

        {/* Date / Time */}
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>
            {dateString} • {timeString}
          </Text>
          <Text style={styles.dateIcon}>📅</Text>
        </View>

        {/* Issue Type */}
        <Text style={styles.label}>Issue Type</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setDropdownExpanded(!dropdownExpanded)}
          activeOpacity={0.7}>
          <Text
            style={[
              styles.dropdownButtonText,
              !issueType && { color: theme.colors.textSecondary },
            ]}>
            {issueType || 'Select issue type'}
          </Text>
          <Text style={styles.dropdownArrow}>
            {dropdownExpanded ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>

        {dropdownExpanded && (
          <View style={styles.dropdown}>
            {issueTypes.map((type, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dropdownItem,
                  index === issueTypes.length - 1 && { borderBottomWidth: 0 },
                ]}
                onPress={() => {
                  setIssueType(type);
                  setDropdownExpanded(false);
                }}>
                <Text
                  style={[
                    styles.dropdownItemText,
                    issueType === type && {
                      color: theme.colors.primary,
                      fontWeight: '600',
                    },
                  ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.textArea}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the issue..."
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          textAlignVertical="top"
          maxLength={500}
        />
        <Text style={styles.charCount}>{description.length}/500</Text>

        {/* Photo Upload */}
        <Text style={styles.label}>Upload Photo</Text>
        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        )}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.outlineButton} onPress={handleCamera}>
            <Text style={styles.outlineButtonIcon}>📷</Text>
            <Text style={styles.outlineButtonLabel}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.outlineButton}
            onPress={handleGallery}>
            <Text style={styles.outlineButtonIcon}>🖼️</Text>
            <Text style={styles.outlineButtonLabel}>Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Location */}
        <Text style={styles.label}>Location</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.locationButton,
              locationMode === 'live' && styles.locationButtonActive,
            ]}
            onPress={handleLiveLocation}>
            <Text style={styles.locationButtonIcon}>📍</Text>
            <Text
              style={[
                styles.locationButtonText,
                locationMode === 'live' && styles.locationButtonTextActive,
              ]}>
              Live Location
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.locationButton,
              locationMode === 'map' && styles.locationButtonActive,
            ]}
            onPress={handleSelectFromMap}>
            <Text style={styles.locationButtonIcon}>🗺️</Text>
            <Text
              style={[
                styles.locationButtonText,
                locationMode === 'map' && styles.locationButtonTextActive,
              ]}>
              Select from Map
            </Text>
          </TouchableOpacity>
        </View>

        {/* Location Loading Indicator */}
        {locationLoading && (
          <View style={styles.locationLoadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.locationLoadingText}>
              Detecting location...
            </Text>
          </View>
        )}

        {/* Location Selected Card */}
        {latitude && longitude && address && !locationLoading && (
          <View style={styles.locationCard}>
            <Text style={styles.locationCardTitle}>Location Selected</Text>
            <View style={styles.locationCardRow}>
              <View style={styles.locationPinCircle}>
                <Text style={styles.locationPinIcon}>📍</Text>
              </View>
              <Text style={styles.locationAddress}>{address}</Text>
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!issueType || !description || !latitude || loading) &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!issueType || !description || !latitude || loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>➤ Submit Report</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ─── Map Picker Modal ─────────────────────────────────────── */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        onRequestClose={() => setShowMapModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowMapModal(false)}
              style={styles.modalHeaderBtn}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Location</Text>
            <TouchableOpacity
              onPress={handleConfirmMapLocation}
              style={styles.modalHeaderBtn}>
              <Text style={styles.modalConfirm}>Confirm</Text>
            </TouchableOpacity>
          </View>

          {/* Map */}
          <View style={styles.modalMapContainer}>
            {MapViewComponent ? (
              <MapErrorBoundary fallback={mapFallback}>
                <MapViewComponent
                  style={styles.modalMap}
                  initialRegion={{
                    latitude: tempLat,
                    longitude: tempLng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  onRegionChangeComplete={(region: any) => {
                    setTempLat(region.latitude);
                    setTempLng(region.longitude);
                  }}>
                  {MarkerComponent && (
                    <MarkerComponent
                      coordinate={{ latitude: tempLat, longitude: tempLng }}
                      draggable
                      onDragEnd={(e: any) => {
                        setTempLat(e.nativeEvent.coordinate.latitude);
                        setTempLng(e.nativeEvent.coordinate.longitude);
                      }}
                    />
                  )}
                </MapViewComponent>
              </MapErrorBoundary>
            ) : (
              mapFallback
            )}
          </View>

          {/* Hint */}
          <View style={styles.modalHintContainer}>
            <Text style={styles.modalHintText}>
              Drag the marker or pan the map to fine-tune the location
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    padding: 20,
    paddingTop: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },

  /* Date */
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '500',
  },
  dateIcon: {
    fontSize: 18,
  },

  /* Labels */
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    marginTop: 4,
  },

  /* Dropdown */
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  dropdownButtonText: {
    fontSize: 15,
    color: theme.colors.text,
  },
  dropdownArrow: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  dropdown: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    marginTop: -12,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dropdownItemText: {
    fontSize: 15,
    color: theme.colors.text,
  },

  /* Text Area */
  textArea: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    padding: 14,
    height: 100,
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: 4,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },

  /* Photo */
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  outlineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingVertical: 12,
  },
  outlineButtonIcon: {
    fontSize: 16,
  },
  outlineButtonLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },

  /* Location Buttons */
  locationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingVertical: 14,
  },
  locationButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '08',
  },
  locationButtonIcon: {
    fontSize: 16,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  locationButtonTextActive: {
    fontWeight: '700',
  },

  /* Location Loading */
  locationLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  locationLoadingText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },

  /* Location Card */
  locationCard: {
    backgroundColor: '#EEF6FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  locationCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  locationCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  locationPinCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationPinIcon: {
    fontSize: 14,
  },
  locationAddress: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text,
    lineHeight: 20,
  },

  /* Submit */
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },

  /* Success Screen */
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  successTitle: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  successSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  successCard: {
    backgroundColor: '#EEF6FF',
    padding: theme.spacing.lg,
    borderRadius: 12,
    width: '100%',
    marginBottom: theme.spacing.xl,
  },
  successCardText: {
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },

  /* Map Modal */
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalHeaderBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  modalCancel: {
    fontSize: 15,
    color: theme.colors.error,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text,
  },
  modalConfirm: {
    fontSize: 15,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  modalMapContainer: {
    flex: 1,
  },
  modalMap: {
    flex: 1,
  },
  modalHintContainer: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: 'center',
  },
  modalHintText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  /* Map Fallback */
  mapFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F1F5F9',
  },
  mapFallbackIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  mapFallbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  mapFallbackText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

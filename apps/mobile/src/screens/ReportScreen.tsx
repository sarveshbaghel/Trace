import React, { useState, useCallback, useRef } from 'react';
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
  Alert,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Geolocation from 'react-native-geolocation-service';
import { WebView } from 'react-native-webview';
import { theme } from '../theme';
import { useAuthStore } from '../store/authStore';
import { TraceApi } from '../api/TraceApi';

const SafeWebView = WebView as any;

interface ReportScreenProps {
  navigation: any;
}

export const ReportScreen: React.FC<ReportScreenProps> = ({ navigation }) => {
  const token = useAuthStore(state => state.token);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [issueType, setIssueType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [dropdownExpanded, setDropdownExpanded] = useState(false);
  const [locationMode, setLocationMode] = useState<'live' | 'map' | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [tempLat, setTempLat] = useState(26.2183);
  const [tempLng, setTempLng] = useState(78.1828);
  const mapPickerWebViewRef = useRef<any>(null);


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
          { headers: { 'User-Agent': 'TraceApp/1.0 (contact@trace.app)' } },
        );
        const data = await response.json();
        if (data && data.address) {
          const a = data.address;
          const road = a.road || a.pedestrian || a.suburb || a.neighbourhood || '';
          const locality = a.city || a.town || a.village || a.county || '';
          const state = a.state || '';
          const postcode = a.postcode || '';
          const parts = [road, locality, state, postcode].filter(Boolean);
          if (parts.length > 0) {
            return parts.join(', ');
          }
        }
        return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      } catch {
        return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      }
    },
    [],
  );

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

  /**
   * Robust GPS location retrieval:
   * 1. Attempts High Accuracy (GPS hardware) first.
   * 2. If it times out (e.g. indoors or slow satellite lock), gracefully
   *    falls back to Network/Fused location provider so user never gets stuck.
   */
  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise(async (resolve, reject) => {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        return reject(new Error('Location permission denied'));
      }

      Geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        _highAccErr => {
          // Fallback to balanced/network provider
          Geolocation.getCurrentPosition(
            position => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            },
            lowAccErr => {
              reject(lowAccErr);
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 },
          );
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 },
      );
    });
  };

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
        Alert.alert('Camera permission denied');
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

  const handleLiveLocation = async () => {
    setLocationMode('live');
    setLocationLoading(true);
    try {
      const loc = await getCurrentLocation();
      setLatitude(loc.latitude);
      setLongitude(loc.longitude);
      setTempLat(loc.latitude);
      setTempLng(loc.longitude);
      const addr = await reverseGeocode(loc.latitude, loc.longitude);
      setAddress(addr);
    } catch (error: any) {
      console.warn('Location detection error:', error);
      Alert.alert(
        'Location Detection Failed',
        'Could not detect your current location. Please ensure Location/GPS is turned on in your device settings.',
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSelectFromMap = async () => {
    setLocationMode('map');
    // If coordinates are already set, center picker on them
    if (latitude && longitude) {
      setTempLat(latitude);
      setTempLng(longitude);
      setShowMapModal(true);
    } else {
      // First try to detect user's current GPS location so map opens directly on them
      setLocationLoading(true);
      try {
        const loc = await getCurrentLocation();
        setTempLat(loc.latitude);
        setTempLng(loc.longitude);
      } catch (e) {
        // Fallback default coordinates if GPS off/denied
        setTempLat(26.2183);
        setTempLng(78.1828);
      } finally {
        setLocationLoading(false);
        setShowMapModal(true);
      }
    }
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

  const handleRecenterMapToGps = async () => {
    try {
      const loc = await getCurrentLocation();
      setTempLat(loc.latitude);
      setTempLng(loc.longitude);
      mapPickerWebViewRef.current?.postMessage(
        JSON.stringify({
          type: 'SET_CENTER',
          lat: loc.latitude,
          lng: loc.longitude,
        }),
      );
    } catch (e: any) {
      Alert.alert('GPS Location', e?.message || 'Could not fetch current GPS location.');
    }
  };

  // Generate Leaflet OpenStreetMap HTML for Interactive Location Picker
  const generatePickerHtml = (initLat: number, initLng: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #f8fafc; }
    .custom-pin {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 34px;
      cursor: grab;
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));
      animation: pinBounce 0.8s ease infinite alternate;
    }
    @keyframes pinBounce {
      0% { transform: translateY(0); }
      100% { transform: translateY(-6px); }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var currentLat = ${initLat};
    var currentLng = ${initLng};

    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([currentLat, currentLng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    var pinIcon = L.divIcon({
      className: '',
      html: '<div class="custom-pin">📍</div>',
      iconSize: [44, 44],
      iconAnchor: [22, 40],
    });

    var marker = L.marker([currentLat, currentLng], {
      icon: pinIcon,
      draggable: true,
      autoPan: true
    }).addTo(map);

    function emitLocation(lat, lng) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'LOCATION_CHANGED',
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6))
        }));
      }
    }

    marker.on('dragend', function(e) {
      var pos = marker.getLatLng();
      emitLocation(pos.lat, pos.lng);
    });

    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      emitLocation(e.latlng.lat, e.latlng.lng);
    });

    function handleRNMessage(event) {
      try {
        var data = JSON.parse(event.data);
        if (data.type === 'SET_CENTER') {
          map.setView([data.lat, data.lng], 16);
          marker.setLatLng([data.lat, data.lng]);
          emitLocation(data.lat, data.lng);
        }
      } catch (err) {}
    }

    window.addEventListener('message', handleRNMessage);
    document.addEventListener('message', handleRNMessage);
  </script>
</body>
</html>`;

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('category', issueType || 'Other');
      
      formData.append('description', description.trim());
      formData.append('latitude', String(latitude));
      formData.append('longitude', String(longitude));
      if (address) {
        formData.append('address', address);
      }
      
      if (imageUri) {
        formData.append('image', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'photo.jpg',
        } as any);
      }

      if (!token) throw new Error('You must be logged in to report an issue');
      
      const response = await TraceApi.createReport(token, formData);

      setLoading(false);
      // Navigate to summary screen passing the newly created report with clicked imageUri
      const reportForSummary = {
        ...response,
        category: issueType || 'Other',
        description: description.trim(),
        address: address,
        latitude: latitude,
        longitude: longitude,
        image_url: imageUri || response?.image_url,
        created_at: new Date().toISOString(),
      };
      navigation.replace('ReportSummary', { report: reportForSummary });
    } catch (e: any) {
      setLoading(false);
      Alert.alert(e.message || 'Error submitting report');
    }
  };

  const issueTypes = [
    'Pothole',
    'Garbage',
    'Broken streetlight',
    'Water leakage',
    'Other',
  ];

  // ─── Main Form ──────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">
        {/* Header */}
        <Text style={styles.title}>Report an Issue</Text>
        <Text style={styles.subtitle}>Log a civic issue with evidence and location</Text>

        {/* ─── 1. Evidence Photo ─────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>1</Text>
            </View>
            <Text style={styles.sectionTitle}>Evidence Photo</Text>
          </View>

          {imageUri && (
            <View style={styles.imagePreviewWrapper}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => setImageUri(null)}>
                <Text style={styles.removeImageText}>✕ Remove</Text>
              </TouchableOpacity>
            </View>
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
        </View>

        {/* ─── 2. Date and Time ─────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>2</Text>
            </View>
            <Text style={styles.sectionTitle}>Date & Time</Text>
          </View>
          <View style={styles.dateContainer}>
            <View style={{ flex: 1 }}>
              <Text style={styles.dateText}>
                {dateString} • {timeString}
              </Text>
              <Text style={styles.dateSubtext}>
                Official verified timestamp recorded with report
              </Text>
            </View>
            <Text style={styles.dateIcon}>📅</Text>
          </View>
        </View>

        {/* ─── 3. Location ─────────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>3</Text>
            </View>
            <Text style={styles.sectionTitle}>Location</Text>
          </View>
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
                Select on Map
              </Text>
            </TouchableOpacity>
          </View>

          {/* Location Loading Indicator */}
          {locationLoading && (
            <View style={styles.locationLoadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.locationLoadingText}>
                Detecting location coordinates...
              </Text>
            </View>
          )}

          {/* Location Selected Card */}
          {latitude && longitude && address && !locationLoading && (
            <View style={styles.locationCard}>
              <Text style={styles.locationCardTitle}>Pinned Address</Text>
              <View style={styles.locationCardRow}>
                <View style={styles.locationPinCircle}>
                  <Text style={styles.locationPinIcon}>📍</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.locationAddress}>{address}</Text>
                  <Text style={styles.locationCoords}>
                    {latitude.toFixed(5)}, {longitude.toFixed(5)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* ─── 4. Issue Details ─────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>4</Text>
            </View>
            <Text style={styles.sectionTitle}>Issue Details</Text>
          </View>

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
              {issueType || 'Select issue category...'}
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
                        fontWeight: '700',
                      },
                    ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={[styles.label, { marginTop: 14 }]}>Description</Text>
          <TextInput
            style={styles.textArea}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the issue in detail (e.g. location cues, hazard level)..."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>

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

      {/* ─── Leaflet OpenStreetMap Interactive Map Picker Modal ─── */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        hardwareAccelerated={true}
        onRequestClose={() => setShowMapModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowMapModal(false)}
              style={styles.modalHeaderBtn}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Pin Incident Location</Text>
            <TouchableOpacity
              onPress={handleConfirmMapLocation}
              style={styles.modalHeaderBtn}>
              <Text style={styles.modalConfirm}>Confirm</Text>
            </TouchableOpacity>
          </View>

          {/* Interactive Leaflet Map */}
          <View style={styles.modalMapContainer}>
            <SafeWebView
              ref={mapPickerWebViewRef}
              originWhitelist={['*']}
              source={{ html: generatePickerHtml(tempLat, tempLng) }}
              style={styles.modalMap}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              scrollEnabled={false}
              bounces={false}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              onMessage={(event: any) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.type === 'LOCATION_CHANGED') {
                    setTempLat(data.lat);
                    setTempLng(data.lng);
                  }
                } catch (e) {}
              }}
            />

            {/* Recenter to Current GPS Button */}
            <TouchableOpacity
              style={styles.modalGpsButton}
              onPress={handleRecenterMapToGps}
              activeOpacity={0.8}>
              <Text style={styles.modalGpsIcon}>🎯</Text>
              <Text style={styles.modalGpsText}>My GPS</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Coordinate & Hint Bar */}
          <View style={styles.modalHintContainer}>
            <View style={styles.modalCoordRow}>
              <Text style={styles.modalCoordLabel}>Selected Coordinates:</Text>
              <Text style={styles.modalCoordValue}>
                {tempLat.toFixed(5)}, {tempLng.toFixed(5)}
              </Text>
            </View>
            <Text style={styles.modalHintText}>
              Tap anywhere on map or drag 📍 to set exact incident spot
            </Text>
            <TouchableOpacity
              style={styles.modalConfirmBottomBtn}
              onPress={handleConfirmMapLocation}>
              <Text style={styles.modalConfirmBottomBtnText}>
                ✓ Use This Location
              </Text>
            </TouchableOpacity>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 20,
  },

  /* Step Section Cards */
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
  },

  /* Date */
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateText: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '600',
  },
  dateSubtext: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 3,
  },
  dateIcon: {
    fontSize: 22,
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
  imagePreviewWrapper: {
    position: 'relative',
    marginBottom: 14,
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
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
  locationCoords: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 3,
  },

  /* Tags */
  tagsSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tagChipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  tagChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
    position: 'relative',
  },
  modalMap: {
    flex: 1,
  },
  modalGpsButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 10,
  },
  modalGpsIcon: {
    fontSize: 18,
  },
  modalGpsText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  modalHintContainer: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  modalCoordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalCoordLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  modalCoordValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  modalHintText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalConfirmBottomBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBottomBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

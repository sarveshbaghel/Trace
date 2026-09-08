import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ActivityIndicator, SafeAreaView, ScrollView, Platform } from 'react-native';
import { theme } from '../theme';

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

  const handleCamera = () => {
    // Mocking camera capture
    setImageUri('https://via.placeholder.com/400x300.png?text=Mock+Image');
  };

  const handleGallery = () => {
    // Mocking gallery pick
    setImageUri('https://via.placeholder.com/400x300.png?text=Mock+Gallery+Image');
  };

  const handleLocation = () => {
    // Mocking location fetch
    setLatitude(40.7128);
    setLongitude(-74.0060);
  };

  const handleSubmit = () => {
    setLoading(true);
    // Mocking API call
    setTimeout(() => {
      setLoading(false);
      setSuccessResponse("Report successfully logged and routed to the public works department.");
    }, 1500);
  };

  const issueTypes = ['Pothole', 'Garbage', 'Broken streetlight', 'Water leakage', 'Other'];

  if (successResponse) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>✅</Text>
          <Text style={styles.successTitle}>Report Submitted!</Text>
          <Text style={styles.successSubtitle}>Thank you for helping improve your community.</Text>
          
          <View style={styles.successCard}>
            <Text style={styles.successCardText}>{successResponse}</Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
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
        <Text style={styles.title}>Report an Issue</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Image Upload */}
        <Text style={styles.label}>Upload Photo</Text>
        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        )}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.outlineButton} onPress={handleCamera}>
            <Text style={styles.outlineButtonText}>📷 Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineButton} onPress={handleGallery}>
            <Text style={styles.outlineButtonText}>🖼️ Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Issue Type Dropdown (Mock) */}
        <Text style={styles.label}>Issue Type</Text>
        <TouchableOpacity 
          style={styles.inputContainer} 
          onPress={() => setDropdownExpanded(!dropdownExpanded)}
        >
          <Text style={[styles.inputText, !issueType && { color: theme.colors.textSecondary }]}>
            {issueType || 'Select issue type'}
          </Text>
        </TouchableOpacity>

        {dropdownExpanded && (
          <View style={styles.dropdown}>
            {issueTypes.map((type, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.dropdownItem}
                onPress={() => {
                  setIssueType(type);
                  setDropdownExpanded(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{type}</Text>
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

        {/* Location */}
        <Text style={styles.label}>Location</Text>
        <TouchableOpacity 
          style={[styles.locationCard, latitude && styles.locationCardActive]} 
          onPress={handleLocation}
        >
          <Text style={styles.locationIcon}>📍</Text>
          <View>
            <Text style={styles.locationTitle}>
              {latitude ? 'Location Detected' : 'Detect Location'}
            </Text>
            <Text style={styles.locationSubtitle}>
              {latitude ? `${latitude.toFixed(4)}, ${longitude?.toFixed(4)}` : 'Tap to detect location'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[
            styles.button, 
            (!imageUri || !issueType || !description || !latitude || loading) && styles.buttonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!imageUri || !issueType || !description || !latitude || loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.surface} />
          ) : (
            <Text style={styles.buttonText}>🚀 Submit Report</Text>
          )}
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>
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
    padding: theme.spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  outlineButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  outlineButtonText: {
    color: theme.colors.text,
    fontWeight: '500',
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  inputText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  dropdown: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    marginTop: 4,
    elevation: 2,
  },
  dropdownItem: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dropdownItemText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  textArea: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    height: 120,
    fontSize: 16,
    color: theme.colors.text,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  locationCardActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  locationIcon: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  locationSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
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
    borderRadius: 8,
    width: '100%',
    marginBottom: theme.spacing.xl,
  },
  successCardText: {
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },
});

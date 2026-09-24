import React from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { theme } from '../theme';

interface ReportSummaryScreenProps {
  route: any;
  navigation: any;
}

export const ReportSummaryScreen: React.FC<ReportSummaryScreenProps> = ({ route, navigation }) => {
  const { report } = route.params;

  const handlePostOnX = () => {
    const text = `I just reported a ${report.category} at ${report.address || 'my location'} using Trace App!\n\n${report.description ? report.description + '\n' : ''}`;
    const urlParam = report.image_url ? `&url=${encodeURIComponent(report.image_url)}` : '';
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}${urlParam}`;
    Linking.openURL(twitterUrl).catch(err => console.error('Error opening X:', err));
  };

  const getEmoji = (type: string) => {
    switch(type) {
      case 'Pothole': return '🕳️';
      case 'Garbage': return '🗑️';
      case 'Broken streetlight': return '💡';
      case 'Water leakage': return '💧';
      default: return '📋';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.successIconContainer}>
          <Text style={styles.successIcon}>✅</Text>
        </View>
        <Text style={styles.title}>Report Submitted!</Text>
        <Text style={styles.subtitle}>Thank you for helping improve the community. Your report has been logged successfully.</Text>

        <View style={styles.card}>
          {report.image_url ? (
            <Image source={{ uri: report.image_url }} style={styles.image} />
          ) : null}
          
          <View style={styles.cardContent}>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Category:</Text>
              <Text style={styles.value}>{getEmoji(report.category)} {report.category}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Description:</Text>
              <Text style={styles.value}>{report.description || 'No description provided.'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Location:</Text>
              <Text style={styles.value}>📍 {report.address || `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Status:</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{report.status}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Date:</Text>
              <Text style={styles.value}>{new Date(report.created_at).toLocaleString()}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.button, styles.xButton]} 
          onPress={handlePostOnX}
        >
          <Text style={styles.xButtonText}>𝕏 Post on X</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.primaryButtonText}>Back to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.secondaryButtonText}>View My Reports</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.xl,
  },
  successIcon: {
    fontSize: 40,
  },
  title: {
    ...theme.typography.h1,
    color: '#10B981',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  card: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: theme.spacing.xl,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: theme.spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    alignItems: 'flex-start',
  },
  label: {
    width: 100,
    ...theme.typography.body,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
  },
  value: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text,
  },
  statusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  button: {
    width: '100%',
    padding: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  primaryButtonText: {
    ...theme.typography.body,
    color: theme.colors.surface,
    fontWeight: 'bold',
  },
  xButton: {
    backgroundColor: '#000000',
  },
  xButtonText: {
    ...theme.typography.body,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryButtonText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
});

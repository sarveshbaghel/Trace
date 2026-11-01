import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { theme } from '../theme';
import { getFullImageUrl } from '../api/TraceApi';

interface ReportSummaryScreenProps {
  route: any;
  navigation: any;
}

export const ReportSummaryScreen: React.FC<ReportSummaryScreenProps> = ({
  route,
  navigation,
}) => {
  const { report } = route.params;

  // Extract clean description and tags
  let cleanDescription = report?.description || 'No description provided.';
  let tags: string[] = [];

  if (Array.isArray(report?.tags) && report.tags.length > 0) {
    tags = report.tags;
  } else if (typeof report?.tags === 'string' && report.tags.trim()) {
    tags = report.tags.split(' ').filter((t: string) => t.trim().length > 0);
  } else if (cleanDescription.includes('Tags:')) {
    const parts = cleanDescription.split(/Tags:\s*/);
    cleanDescription = parts[0].trim();
    if (parts[1]) {
      tags = parts[1].split(' ').filter((t: string) => t.trim().length > 0);
    }
  }

  const handlePostOnX = () => {
    const tagString = tags.length > 0 ? tags.join(' ') : '#TraceApp #CivicAction';
    const text = `I just reported a ${report?.category || 'Civic Issue'} at ${
      report?.address || 'my location'
    } using Trace App!\n\n${
      cleanDescription ? cleanDescription + '\n\n' : ''
    }${tagString}`;
    const urlParam =
      report?.image_url && report.image_url.startsWith('http')
        ? `&url=${encodeURIComponent(report.image_url)}`
        : '';
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text,
    )}${urlParam}`;
    Linking.openURL(twitterUrl).catch(err =>
      console.error('Error opening X:', err),
    );
  };

  const getEmoji = (type: string) => {
    switch (type) {
      case 'Pothole':
        return '🕳️';
      case 'Garbage':
        return '🗑️';
      case 'Broken streetlight':
        return '💡';
      case 'Water leakage':
        return '💧';
      default:
        return '📋';
    }
  };

  const formattedDate = report?.created_at
    ? new Date(report.created_at).toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : new Date().toLocaleDateString();

  const formattedTime = report?.created_at
    ? new Date(report.created_at).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleTimeString();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Success Header */}
        <View style={styles.successIconContainer}>
          <Text style={styles.successIcon}>✓</Text>
        </View>
        <Text style={styles.title}>Report Submitted!</Text>
        <Text style={styles.subtitle}>
          Your report has been securely registered on TRACE and queued for action.
        </Text>

        {/* Status Pill */}
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>
            Status: {report?.status || 'SUBMITTED'}
          </Text>
        </View>

        {/* ─── 1. Issue Details ─────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>1</Text>
            </View>
            <Text style={styles.sectionTitle}>Issue</Text>
          </View>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryEmoji}>{getEmoji(report?.category)}</Text>
            <Text style={styles.categoryText}>{report?.category || 'Issue'}</Text>
          </View>
          <Text style={styles.descriptionText}>{cleanDescription}</Text>
        </View>

        {/* ─── 2. Date and Time ─────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>2</Text>
            </View>
            <Text style={styles.sectionTitle}>Date and Time</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>📅</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoPrimary}>
                {formattedDate} • {formattedTime}
              </Text>
              <Text style={styles.infoSecondary}>
                Official incident timestamp
              </Text>
            </View>
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
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>📍</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoPrimary}>
                {report?.address || 'Location pinned'}
              </Text>
              {report?.latitude && report?.longitude ? (
                <Text style={styles.infoSecondary}>
                  {Number(report.latitude).toFixed(5)},{' '}
                  {Number(report.longitude).toFixed(5)}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* ─── 4. Image ────────────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>4</Text>
            </View>
            <Text style={styles.sectionTitle}>Image</Text>
          </View>
          {report?.image_url ? (
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: getFullImageUrl(report.image_url) }}
                style={styles.image}
              />
            </View>
          ) : (
            <View style={styles.emptyImageBox}>
              <Text style={styles.emptyImageIcon}>📷</Text>
              <Text style={styles.emptyImageText}>No image provided</Text>
            </View>
          )}
        </View>

        {/* ─── 5. Some Tags ────────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>5</Text>
            </View>
            <Text style={styles.sectionTitle}>Tags</Text>
          </View>
          {tags.length > 0 ? (
            <View style={styles.tagsContainer}>
              {tags.map((t, idx) => (
                <View key={idx} style={styles.tagBadge}>
                  <Text style={styles.tagBadgeText}>{t}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noTagsText}>No tags selected</Text>
          )}
        </View>

        {/* ─── Action Buttons ──────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.button, styles.xButton]}
          onPress={handlePostOnX}
          activeOpacity={0.8}>
          <Text style={styles.xButtonText}>𝕏 Post on X</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.8}>
          <Text style={styles.primaryButtonText}>Back to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate('History')}
          activeOpacity={0.8}>
          <Text style={styles.secondaryButtonText}>View My Reports</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
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
    padding: 20,
    alignItems: 'center',
  },
  successIconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#86EFAC',
  },
  successIcon: {
    fontSize: 32,
    color: '#15803D',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 14,
    paddingHorizontal: 12,
    lineHeight: 20,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D97706',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* Section Card */
  sectionCard: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },

  /* Issue Section */
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 10,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  descriptionText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 22,
  },

  /* Info Box (Date & Location) */
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  infoPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    lineHeight: 20,
  },
  infoSecondary: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  /* Image Section */
  imageWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  emptyImageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyImageIcon: {
    fontSize: 20,
  },
  emptyImageText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },

  /* Tags Section */
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBadge: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
  noTagsText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },

  /* Buttons */
  button: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  xButton: {
    backgroundColor: '#000000',
    marginTop: 6,
  },
  xButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontWeight: 'bold',
    fontSize: 15,
  },
});

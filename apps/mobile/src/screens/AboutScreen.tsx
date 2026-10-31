import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { theme } from '../theme';

interface AboutScreenProps {
  navigation: any;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>About Trace</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>⚡</Text>
          </View>
          <Text style={styles.appName}>Trace</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appTagline}>Empowering Citizens, Fixing Communities</Text>
        </View>

        {/* Mission Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎯 Our Mission</Text>
          <Text style={styles.bodyText}>
            Trace bridges the gap between everyday citizens and municipal authorities. By leveraging
            geospatial intelligence, cryptographic evidence verification, and AI authenticity validation,
            Trace empowers communities to hold municipal bodies accountable and get civic infrastructure
            repaired swiftly.
          </Text>
        </View>

        {/* Key Features */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>✨ Core Capabilities</Text>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📸</Text>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureHeading}>Photographic Incident Capture</Text>
              <Text style={styles.featureDesc}>
                Direct camera capture captures visual evidence with timestamp and geo-tag metadata.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📍</Text>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureHeading}>Precision Geolocation</Text>
              <Text style={styles.featureDesc}>
                Automatic high-accuracy GPS coordinates pinpoint the exact location on municipal maps.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🤖</Text>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureHeading}>AI Authenticity & Fraud Detection</Text>
              <Text style={styles.featureDesc}>
                Computer vision models verify evidence authenticity and filter duplicate submissions.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📢</Text>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureHeading}>Public Transparency & X Broadcast</Text>
              <Text style={styles.featureDesc}>
                Confirmed civic grievances are tagged to local municipal departments on public feeds.
              </Text>
            </View>
          </View>
        </View>

        {/* Impact Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>100%</Text>
            <Text style={styles.statLabel}>Transparent</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>24/7</Text>
            <Text style={styles.statLabel}>Citizen Voice</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>Zero</Text>
            <Text style={styles.statLabel}>Red Tape</Text>
          </View>
        </View>

        {/* Team & Open Civic Tech */}
        <TouchableOpacity
          style={styles.teamLinkCard}
          onPress={() => navigation.navigate('Developer')}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.teamLinkTitle}>👥 Meet the Team & Architecture</Text>
            <Text style={styles.teamLinkSubtitle}>
              Learn about the developers and technology powering Trace
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
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
    flex: 1,
    padding: theme.spacing.md,
  },
  heroSection: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoIcon: {
    fontSize: 32,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  appVersion: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  appTagline: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  featureIcon: {
    fontSize: 22,
    marginRight: 12,
    marginTop: 2,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureHeading: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: theme.spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  teamLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  teamLinkTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  teamLinkSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
});

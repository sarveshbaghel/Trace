import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { theme } from '../theme';

interface PrivacyPolicyScreenProps {
  navigation: any;
}

export const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.titleCard}>
          <Text style={styles.policyTitle}>Trace Privacy Policy</Text>
          <Text style={styles.lastUpdated}>Last updated: October 2026</Text>
          <Text style={styles.introText}>
            Trace is dedicated to transparent civic engagement. This privacy policy explains how your
            information is handled when reporting public infrastructure issues.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.sectionBody}>
            • <Text style={styles.bold}>Account Data:</Text> Your name, email, and phone number when
            registering or authenticating.{'\n\n'}
            • <Text style={styles.bold}>Incident Evidence:</Text> Photos captured or uploaded to substantiate
            civic reports, alongside descriptions and timestamps.{'\n\n'}
            • <Text style={styles.bold}>Geolocation Coordinates:</Text> High-precision GPS latitude and
            longitude at the time of report submission to pinpoint issue locations on civic maps.{'\n\n'}
            • <Text style={styles.bold}>Device & Telemetry:</Text> Operating system version and crash reports
            for application stability.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>2. How Your Information Is Used</Text>
          <Text style={styles.sectionBody}>
            • Routing incidents to the responsible municipal department (Roads, Sanitation, Electricity).{'\n\n'}
            • Reverse-geocoding coordinates to street landmarks.{'\n\n'}
            • AI computer vision pipeline scans to detect duplicates and authenticate genuine reports.{'\n\n'}
            • Sending status change notifications (In Progress, Resolved, Escalated).{'\n\n'}
            • Public accountability broadcasting on X (Twitter) if enabled by municipal policy.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>3. Location Privacy</Text>
          <Text style={styles.sectionBody}>
            Trace does <Text style={styles.bold}>NOT</Text> track your location continuously in the background.
            Your device's location is accessed strictly when creating a report or viewing the live incident map.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>4. AI & Media Processing</Text>
          <Text style={styles.sectionBody}>
            Images uploaded as evidence undergo automated integrity verification. We do not use citizen photos
            for commercial AI training or facial recognition. Photos are strictly utilized for municipal triage
            and verification.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>5. Data Security & Storage</Text>
          <Text style={styles.sectionBody}>
            All transmissions between your device, the NestJS API, and the database are encrypted using TLS 1.3.
            Passwords are cryptographically hashed using industry-standard bcrypt algorithms.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>6. Citizen Rights & Contact</Text>
          <Text style={styles.sectionBody}>
            You have the right to request access, correction, or deletion of your profile data at any time.
            Contact our privacy compliance desk at <Text style={styles.linkText}>privacy@trace.app</Text>.
          </Text>
        </View>

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
  titleCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  policyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
  },
  lastUpdated: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
    marginBottom: 10,
  },
  introText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
    color: theme.colors.text,
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

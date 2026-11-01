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

interface DeveloperScreenProps {
  navigation: any;
}

export const DeveloperScreen: React.FC<DeveloperScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Developer & Architecture</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Architecture Header */}
        <View style={styles.heroCard}>
          <Text style={styles.heroBadge}>ENGINEERING</Text>
          <Text style={styles.heroTitle}>Trace Civic Architecture</Text>
          <Text style={styles.heroSubtitle}>
            A modern, production-grade monorepo stack engineered for resilience, real-time spatial analysis, and high-trust community governance.
          </Text>
        </View>

        {/* Tech Stack Cards */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🛠️ Technology Stack</Text>

          <View style={styles.stackRow}>
            <Text style={styles.stackLabel}>Mobile App</Text>
            <Text style={styles.stackValue}>React Native 0.87 • TypeScript</Text>
          </View>
          <View style={styles.stackRow}>
            <Text style={styles.stackLabel}>Mapping Engine</Text>
            <Text style={styles.stackValue}>Google Maps SDK • OpenStreetMap</Text>
          </View>
          <View style={styles.stackRow}>
            <Text style={styles.stackLabel}>Backend API</Text>
            <Text style={styles.stackValue}>NestJS 10 • Node.js • Express</Text>
          </View>
          <View style={styles.stackRow}>
            <Text style={styles.stackLabel}>Database & ORM</Text>
            <Text style={styles.stackValue}>MongoDB Atlas • Prisma ORM</Text>
          </View>
          <View style={styles.stackRow}>
            <Text style={styles.stackLabel}>Admin Dashboard</Text>
            <Text style={styles.stackValue}>Vite • React 18 • Leaflet Maps</Text>
          </View>
          <View style={styles.stackRow}>
            <Text style={styles.stackLabel}>Monorepo Tooling</Text>
            <Text style={styles.stackValue}>Turborepo • npm workspaces</Text>
          </View>
        </View>

        {/* AI & Integrity Pipeline */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🧠 AI Verification Engine</Text>
          <Text style={styles.bodyText}>
            Every report is screened by neural network models that produce authenticity scores,
            detect image manipulation, calculate duplicate similarity across spatial clusters,
            and assist administrators in flagging spam before authority dispatch.
          </Text>
        </View>

        {/* Project Lead */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👨‍💻 Engineering Team</Text>
          <View style={styles.memberRow}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberInitial}>S</Text>
            </View>
            <View>
              <Text style={styles.memberName}>Sarvesh Baghel</Text>
              <Text style={styles.memberRole}>Developer & Architect</Text>
            </View>
          </View>

          <View style={styles.memberDivider} />

          <View style={styles.memberRow}>
            <View style={[styles.memberAvatar, { backgroundColor: '#8B5CF6' }]}>
              <Text style={styles.memberInitial}>A</Text>
            </View>
            <View>
              <Text style={styles.memberName}>Aditi Pawayia</Text>
              <Text style={styles.memberRole}>Developer & Architect</Text>
            </View>
          </View>
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
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  heroBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 20,
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
  stackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  stackLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  stackValue: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  memberRole: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});

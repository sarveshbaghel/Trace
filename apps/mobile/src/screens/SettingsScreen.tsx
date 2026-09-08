import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../theme';

interface SettingsScreenProps {
  navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const [autoPostEnabled, setAutoPostEnabled] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [bearerConfigured, setBearerConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setAutoPostEnabled(false);
      setApiConnected(true);
      setBearerConfigured(false);
      setLoading(false);
    }, 1000);
  }, []);

  const toggleAutoPost = async (value: boolean) => {
    setToggling(true);
    setTimeout(() => {
      setAutoPostEnabled(value);
      setToggling(false);
    }, 500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <View style={styles.container}>
          {/* X Integration Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>𝕏 X (Twitter) Integration</Text>
              <View style={[styles.badge, { backgroundColor: apiConnected ? '#DCFCE7' : '#FEF3C7' }]}>
                <Text style={[styles.badgeText, { color: apiConnected ? '#166534' : '#92400E' }]}>
                  {apiConnected ? '✅ Connected' : '⚠️ Partial'}
                </Text>
              </View>
            </View>

            <Text style={styles.cardDescription}>
              When enabled, every new report submitted will automatically be posted to your X account.
            </Text>

            <View style={styles.divider} />

            <View style={styles.toggleRow}>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Automatic Post to X</Text>
                <Text style={styles.toggleSubtitle}>
                  {autoPostEnabled ? 'New reports will be posted to X' : 'Reports must be posted to X manually'}
                </Text>
              </View>
              <Switch
                value={autoPostEnabled}
                onValueChange={toggleAutoPost}
                disabled={toggling}
                trackColor={{ false: '#CBD5E1', true: '#10B981' }}
                thumbColor={'#FFFFFF'}
              />
            </View>
          </View>

          {/* Connection Status Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔗 Connection Status</Text>
            
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: apiConnected ? '#10B981' : '#F59E0B' }]} />
              <View>
                <Text style={styles.statusTitle}>OAuth 1.0a (Post access)</Text>
                <Text style={styles.statusSubtitle}>
                  {apiConnected ? 'API keys configured' : 'Access Token & Secret needed'}
                </Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: bearerConfigured ? '#10B981' : '#F59E0B' }]} />
              <View>
                <Text style={styles.statusTitle}>Bearer Token (Read access)</Text>
                <Text style={styles.statusSubtitle}>
                  {bearerConfigured ? 'Bearer token configured' : 'Bearer token not set'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: theme.spacing.md,
    borderRadius: 12,
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  toggleSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: theme.spacing.md,
    borderRadius: 8,
    marginTop: theme.spacing.sm,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.md,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  statusSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});

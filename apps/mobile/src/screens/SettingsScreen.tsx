import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, SafeAreaView, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
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
  
  // New Settings States
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);

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

  const handleAction = (actionName: string) => {
    Alert.alert(actionName, 'This feature will be available soon.');
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
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          
          {/* App Preferences Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>🎨 App Preferences</Text>
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Dark Theme</Text>
                <Text style={styles.toggleSubtitle}>
                  {isDarkMode ? 'Dark mode is ON' : 'Light mode is ON'}
                </Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={setIsDarkMode}
                trackColor={{ false: '#CBD5E1', true: theme.colors.primary }}
                thumbColor={'#FFFFFF'}
              />
            </View>

            <View style={[styles.divider, { marginVertical: 4 }]} />

            <View style={styles.toggleRow}>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Push Notifications</Text>
                <Text style={styles.toggleSubtitle}>Receive alerts for new reports</Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ false: '#CBD5E1', true: theme.colors.primary }}
                thumbColor={'#FFFFFF'}
              />
            </View>
          </View>

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

          {/* About Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>ℹ️ About & Support</Text>
            
            <TouchableOpacity style={styles.actionRow} onPress={() => handleAction('Privacy Policy')}>
              <Text style={styles.actionText}>Privacy Policy</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.actionRow} onPress={() => handleAction('Terms of Service')}>
              <Text style={styles.actionText}>Terms of Service</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.actionRow} onPress={() => handleAction('Contact Support')}>
              <Text style={styles.actionText}>Contact Support</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <View style={styles.versionContainer}>
              <Text style={styles.versionText}>Trace App Version 1.0.0</Text>
            </View>
          </View>
          
          {/* Bottom Padding */}
          <View style={{ height: 40 }} />
        </ScrollView>
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
    marginBottom: 8,
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
    marginVertical: theme.spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    paddingVertical: theme.spacing.sm,
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
    marginTop: 2,
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionText: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 20,
    color: theme.colors.textSecondary,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  versionText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});

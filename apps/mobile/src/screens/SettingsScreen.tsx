import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { theme } from '../theme';

interface SettingsScreenProps {
  navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const [autoPostEnabled, setAutoPostEnabled] = useState(false);
  const [apiConnected, setApiConnected] = useState(true);
  const [bearerConfigured, setBearerConfigured] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Appearance & Notification States
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  const toggleAutoPost = async (value: boolean) => {
    setToggling(true);
    setTimeout(() => {
      setAutoPostEnabled(value);
      setToggling(false);
    }, 400);
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && styles.safeAreaDark]}>
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backButtonText, isDarkMode && styles.textDark]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, isDarkMode && styles.textDark]}>Settings</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* App Preferences Card */}
          <View style={[styles.card, isDarkMode && styles.cardDark]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, isDarkMode && styles.textDark]}>🎨 Appearance & Alerts</Text>
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleTextContainer}>
                <Text style={[styles.toggleTitle, isDarkMode && styles.textDark]}>Dark Theme</Text>
                <Text style={styles.toggleSubtitle}>
                  {isDarkMode ? 'Night mode enabled' : 'Clean day mode enabled'}
                </Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={setIsDarkMode}
                trackColor={{ false: '#CBD5E1', true: theme.colors.primary }}
                thumbColor={'#FFFFFF'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.toggleRow}>
              <View style={styles.toggleTextContainer}>
                <Text style={[styles.toggleTitle, isDarkMode && styles.textDark]}>Push Notifications</Text>
                <Text style={styles.toggleSubtitle}>Instant alerts when report status changes</Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ false: '#CBD5E1', true: theme.colors.primary }}
                thumbColor={'#FFFFFF'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.toggleRow}>
              <View style={styles.toggleTextContainer}>
                <Text style={[styles.toggleTitle, isDarkMode && styles.textDark]}>Email Digests</Text>
                <Text style={styles.toggleSubtitle}>Weekly civic activity summaries in your ward</Text>
              </View>
              <Switch
                value={emailAlerts}
                onValueChange={setEmailAlerts}
                trackColor={{ false: '#CBD5E1', true: theme.colors.primary }}
                thumbColor={'#FFFFFF'}
              />
            </View>
          </View>

          {/* X / Twitter Integration Card */}
          <View style={[styles.card, isDarkMode && styles.cardDark]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, isDarkMode && styles.textDark]}>𝕏 X (Twitter) Broadcast</Text>
              <View style={[styles.badge, { backgroundColor: apiConnected ? '#DCFCE7' : '#FEF3C7' }]}>
                <Text style={[styles.badgeText, { color: apiConnected ? '#166534' : '#92400E' }]}>
                  {apiConnected ? '✅ Connected' : '⚠️ Partial'}
                </Text>
              </View>
            </View>

            <Text style={[styles.cardDescription, isDarkMode && styles.descDark]}>
              When enabled, submitted and verified civic issues will automatically be tagged to
              the responsible municipal department handle on X for public accountability.
            </Text>

            <View style={styles.divider} />

            <View style={styles.toggleRow}>
              <View style={styles.toggleTextContainer}>
                <Text style={[styles.toggleTitle, isDarkMode && styles.textDark]}>Automatic Post to X</Text>
                <Text style={styles.toggleSubtitle}>
                  {autoPostEnabled
                    ? 'New reports will be posted to X'
                    : 'Reports must be posted to X manually'}
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
          <View style={[styles.card, isDarkMode && styles.cardDark]}>
            <Text style={[styles.cardTitle, isDarkMode && styles.textDark]}>🔗 Municipal Conduit Status</Text>

            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: apiConnected ? '#10B981' : '#F59E0B' },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.statusTitle, isDarkMode && styles.textDark]}>
                  OAuth 1.0a (Authority Tagging)
                </Text>
                <Text style={styles.statusSubtitle}>
                  {apiConnected ? 'Connected & ready to broadcast' : 'Configuration pending'}
                </Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: bearerConfigured ? '#10B981' : '#F59E0B' },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.statusTitle, isDarkMode && styles.textDark]}>
                  Trace Core Engine (API Gateway)
                </Text>
                <Text style={styles.statusSubtitle}>
                  Connected to localhost:4000
                </Text>
              </View>
            </View>
          </View>

          {/* About & Support Links Card */}
          <View style={[styles.card, isDarkMode && styles.cardDark]}>
            <Text style={[styles.cardTitle, isDarkMode && styles.textDark]}>ℹ️ Information & Legal</Text>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('PrivacyPolicy')}
            >
              <Text style={[styles.actionText, isDarkMode && styles.textDark]}>Privacy Policy</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('About')}
            >
              <Text style={[styles.actionText, isDarkMode && styles.textDark]}>About Trace App</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('HelpSupport')}
            >
              <Text style={[styles.actionText, isDarkMode && styles.textDark]}>Help & Support / FAQs</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('Developer')}
            >
              <Text style={[styles.actionText, isDarkMode && styles.textDark]}>Developers & Architecture</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>

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
  safeAreaDark: {
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerDark: {
    backgroundColor: '#1E293B',
    borderBottomColor: '#334155',
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
  textDark: {
    color: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    padding: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  cardDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  descDark: {
    color: '#94A3B8',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: 16,
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
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  statusSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  chevron: {
    fontSize: 22,
    color: theme.colors.textSecondary,
  },
});

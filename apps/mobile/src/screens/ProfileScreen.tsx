import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { theme } from '../theme';
import { useAuthStore } from '../store/authStore';
import { TraceApi } from '../api/TraceApi';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const logout = useAuthStore((state) => state.logout);

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await TraceApi.getMe(token);
      setProfile(data);
      setEditName(data.name || '');
      setEditPhone(data.phone || '');
    } catch (error) {
      console.error('Failed to fetch profile', error);
      // Fallback to store user
      if (user) {
        setProfile(user);
        setEditName(user.name || '');
        setEditPhone(user.phone || '');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!token) return;
    try {
      setSaving(true);
      const updatedUser = await TraceApi.updateProfile(token, {
        name: editName,
        phone: editPhone,
      });
      setProfile({ ...profile, ...updatedUser });
      setAuth(token, updatedUser);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      console.error('Failed to update profile', error);
      Alert.alert('Error', error.response?.data?.message || 'Could not save profile changes');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of Trace?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          logout();
        },
      },
    ]);
  };

  const displayName = profile?.name || user?.name || 'Citizen';
  const displayEmail = profile?.email || user?.email || '';
  const displayPhone = profile?.phone || user?.phone || 'No phone set';
  const avatarLetter = displayName.charAt(0).toUpperCase() || 'U';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Profile</Text>
        <View style={{ flex: 1 }} />
        {!isEditing ? (
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Text style={styles.editButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Hero Header with Avatar */}
          <View style={styles.heroHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            </View>

            {isEditing ? (
              <View style={styles.editForm}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter full name"
                />
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
                <Text style={styles.inputLabel}>Email (Permanent)</Text>
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={displayEmail}
                  editable={false}
                />
              </View>
            ) : (
              <View style={styles.infoContainer}>
                <Text style={styles.userName}>{displayName}</Text>
                <Text style={styles.userEmail}>{displayEmail}</Text>
                <View style={styles.phoneBadge}>
                  <Text style={styles.phoneBadgeText}>📱 {displayPhone}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Stats Summary */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{profile?.stats?.totalReports || 0}</Text>
              <Text style={styles.statLabel}>Reports</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#3B82F6' }]}>
                {profile?.stats?.inProgressReports || 0}
              </Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#10B981' }]}>
                {profile?.stats?.resolvedReports || 0}
              </Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>
          </View>

          {/* Section: Activity */}
          <Text style={styles.sectionTitle}>Activity</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('History')}
            >
              <View style={[styles.menuIconBg, { backgroundColor: '#EFF6FF' }]}>
                <Text style={styles.menuIcon}>📋</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuItemText}>My Reports History</Text>
                <Text style={styles.menuItemSubtext}>View status and timeline of past issues</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('Map')}
            >
              <View style={[styles.menuIconBg, { backgroundColor: '#ECFDF5' }]}>
                <Text style={styles.menuIcon}>🗺️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuItemText}>Civic Incident Map</Text>
                <Text style={styles.menuItemSubtext}>Live spatial map of community reports</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Section: App & Support */}
          <Text style={styles.sectionTitle}>App & Support</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('Settings')}
            >
              <View style={[styles.menuIconBg, { backgroundColor: '#F1F5F9' }]}>
                <Text style={styles.menuIcon}>⚙️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuItemText}>Settings & Preferences</Text>
                <Text style={styles.menuItemSubtext}>Appearance, dark mode, and X integration</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('About')}
            >
              <View style={[styles.menuIconBg, { backgroundColor: '#EFF6FF' }]}>
                <Text style={styles.menuIcon}>⚡</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuItemText}>About Trace</Text>
                <Text style={styles.menuItemSubtext}>Version, mission, and civic impact</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('HelpSupport')}
            >
              <View style={[styles.menuIconBg, { backgroundColor: '#FEF3C7' }]}>
                <Text style={styles.menuIcon}>🎧</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuItemText}>Help & Support</Text>
                <Text style={styles.menuItemSubtext}>FAQs and municipal emergency contacts</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('PrivacyPolicy')}
            >
              <View style={[styles.menuIconBg, { backgroundColor: '#F3E8FF' }]}>
                <Text style={styles.menuIcon}>🔒</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuItemText}>Privacy Policy</Text>
                <Text style={styles.menuItemSubtext}>How your location and evidence are safeguarded</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('Developer')}
            >
              <View style={[styles.menuIconBg, { backgroundColor: '#F1F5F9' }]}>
                <Text style={styles.menuIcon}>👥</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuItemText}>Developers & Architecture</Text>
                <Text style={styles.menuItemSubtext}>Meet the engineering team</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Log Out of Trace</Text>
          </TouchableOpacity>

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
  editButtonText: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  heroHeader: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarText: {
    fontSize: 34,
    color: theme.colors.primary,
    fontWeight: '800',
  },
  infoContainer: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  phoneBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  phoneBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  editForm: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: theme.colors.text,
  },
  inputDisabled: {
    backgroundColor: '#F1F5F9',
    color: theme.colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: theme.spacing.lg,
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
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  menuIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuIcon: {
    fontSize: 18,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  menuItemSubtext: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  chevron: {
    fontSize: 22,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 64,
  },
  logoutButton: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
});

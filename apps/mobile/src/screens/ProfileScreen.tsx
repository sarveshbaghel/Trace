import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, TextInput, ActivityIndicator } from 'react-native';
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
      Alert.alert('Error', 'Could not load profile data');
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
        phone: editPhone
      });
      // Update local profile state
      setProfile({ ...profile, ...updatedUser });
      // Update global auth store so other screens see the new name
      setAuth(token, updatedUser);
      setIsEditing(false);
    } catch (error: any) {
      console.error('Failed to update profile', error);
      Alert.alert('Error', error.response?.data?.message || 'Could not save profile changes');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Logout', 
        style: 'destructive',
        onPress: () => {
          // Clear auth state — AppNavigator will automatically switch to login stack
          logout();
        } 
      }
    ]);
  };

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
            {saving ? <ActivityIndicator size="small" color={theme.colors.primary} /> : <Text style={styles.editButtonText}>Save</Text>}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{profile?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
              </View>
              
              {isEditing ? (
                <View style={styles.editForm}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput 
                    style={styles.input} 
                    value={editName} 
                    onChangeText={setEditName} 
                    placeholder="Enter your name"
                  />
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <TextInput 
                    style={styles.input} 
                    value={editPhone} 
                    onChangeText={setEditPhone} 
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                  />
                  <Text style={styles.inputLabel}>Email (Read-only)</Text>
                  <TextInput 
                    style={[styles.input, styles.inputDisabled]} 
                    value={profile?.email} 
                    editable={false}
                  />
                </View>
              ) : (
                <>
                  <Text style={styles.name}>{profile?.name}</Text>
                  <Text style={styles.email}>{profile?.email}</Text>
                  <Text style={styles.city}>{profile?.phone || 'No phone added'}</Text>
                </>
              )}
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{profile?.stats?.totalReports || 0}</Text>
                <Text style={styles.statLabel}>Reports</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{profile?.stats?.resolvedReports || 0}</Text>
                <Text style={styles.statLabel}>Resolved</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('History')}>
              <Text style={styles.menuItemIcon}>📋</Text>
              <Text style={styles.menuItemText}>My Reports History</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
              <Text style={styles.menuItemIcon}>⚙️</Text>
              <Text style={styles.menuItemText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
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
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarText: {
    fontSize: 32,
    color: theme.colors.surface,
    fontWeight: 'bold',
  },
  name: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: 4,
  },
  email: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  city: {
    ...theme.typography.caption,
    color: theme.colors.text,
    backgroundColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  editForm: {
    width: '100%',
    paddingHorizontal: theme.spacing.lg,
  },
  inputLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  inputDisabled: {
    backgroundColor: theme.colors.background,
    color: theme.colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xl,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    ...theme.typography.h2,
    color: theme.colors.primary,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  menuItemIcon: {
    fontSize: 20,
    marginRight: theme.spacing.md,
  },
  menuItemText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '500',
  },
  logoutButton: {
    marginTop: 'auto',
    backgroundColor: '#FEE2E2',
    padding: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    ...theme.typography.body,
    color: '#EF4444',
    fontWeight: 'bold',
  },
});

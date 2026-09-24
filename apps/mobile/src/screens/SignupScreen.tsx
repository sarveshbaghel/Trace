import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { theme } from '../theme';

interface SignupScreenProps {
  navigation: any;
  onSignupSuccess?: (token: string) => void;
}

import { useAuthStore } from '../store/authStore';
import { TraceApi } from '../api/TraceApi';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { getAuth, signInWithCredential, GoogleAuthProvider } from '@react-native-firebase/auth';

export const SignupScreen: React.FC<SignupScreenProps> = ({ navigation, onSignupSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setAuth = useAuthStore(state => state.setAuth);

  const handleSignup = async () => {
    if (!email || password.length < 6) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await TraceApi.signup({ name, email, password });
      
      setLoading(false);
      setAuth(data.accessToken, data.user);
      
      if (onSignupSuccess) {
        onSignupSuccess(data.accessToken);
      }
    } catch (e: any) {
      setLoading(false);
      const msg = e.response?.data?.message || e.response?.data?.errors?.[0]?.message || e.message;
      setError(`Signup failed: ${msg}`);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (response.type !== 'success') {
        setLoading(false);
        return;
      }
      const idToken = response.data.idToken;
      if (!idToken) throw new Error('No ID token returned from Google');
      
      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(getAuth(), googleCredential);
      const firebaseIdToken = await userCredential.user.getIdToken();
      
      const data = await TraceApi.googleLogin(firebaseIdToken);
      
      setLoading(false);
      setAuth(data.accessToken, data.user);
      
      if (onSignupSuccess) {
        onSignupSuccess(data.accessToken);
      }
    } catch (e: any) {
      setLoading(false);
      setError(`Google sign-in failed. ${e.message}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Trace today</Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              placeholder="Enter your name"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Enter your email"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Min 6 characters"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <TouchableOpacity 
            style={[
              styles.button, 
              (!email || password.length < 6 || loading) && styles.buttonDisabled
            ]}
            onPress={handleSignup}
            disabled={!email || password.length < 6 || loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.surface} />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity 
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleButtonText}>Sign up with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginText}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.xl,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    ...theme.typography.h1,
    fontSize: 24,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    padding: theme.spacing.md,
    borderRadius: 8,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 13,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.body,
    fontWeight: '500',
    marginBottom: 8,
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginButton: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
  },
  loginText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    marginHorizontal: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DADCE0',
    borderRadius: 8,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4285F4',
    marginRight: 12,
  },
  googleButtonText: {
    color: '#3C4043',
    fontSize: 16,
    fontWeight: '600',
  },
});

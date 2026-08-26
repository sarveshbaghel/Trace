import React from 'react';
import { SafeAreaView, StatusBar, Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from './src/theme';

const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trace</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Civic Issue Reporting</Text>
        <Text style={styles.subtitle}>Report issues in your city and track their resolution.</Text>
        
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Report New Issue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: theme.colors.surface,
    ...theme.typography.h2,
  },
  content: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: theme.colors.text,
    ...theme.typography.h1,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    ...theme.typography.body,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: theme.colors.surface,
    ...theme.typography.body,
    fontWeight: 'bold',
  }
});

export default App;

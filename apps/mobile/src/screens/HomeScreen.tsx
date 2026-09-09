import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { theme } from '../theme';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <View>
              <Text style={styles.title}>Trace</Text>
              <Text style={styles.subtitle}>Help improve your community</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileButton}>
              <Text style={styles.profileButtonText}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>

        {/* Report Issue Card */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('Report')}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardTextContainer}>
              <Text style={[styles.cardTitle, { color: theme.colors.surface }]}>Report an Issue</Text>
              <Text style={[styles.cardSubtitle, { color: theme.colors.surface, opacity: 0.8 }]}>
                Take a photo and report a civic issue
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Live Map Card */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: '#10B981' }]} // Using a distinct color like green
          onPress={() => navigation.navigate('Map')}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardTextContainer}>
              <Text style={[styles.cardTitle, { color: theme.colors.surface }]}>Live Map</Text>
              <Text style={[styles.cardSubtitle, { color: theme.colors.surface, opacity: 0.8 }]}>
                View all reported issues on the map
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* View History Card */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.colors.surface }]}
          onPress={() => navigation.navigate('History')}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardTextContainer}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>My Reports</Text>
              <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                View your submitted reports and their status
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Issue Categories</Text>

        <View style={styles.categoriesContainer}>
          {[
            { emoji: '🕳️', label: 'Pothole', color: '#FEF3C7' },
            { emoji: '🗑️', label: 'Garbage', color: '#DCFCE7' },
            { emoji: '💡', label: 'Street\nLight', color: '#E8F2FD' },
            { emoji: '💧', label: 'Water\nLeak', color: '#DBEAFE' },
          ].map((cat, index) => (
            <View key={index} style={[styles.categoryCard, { backgroundColor: cat.color }]}>
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.primary,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  sectionTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  card: {
    borderRadius: 12,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
  },
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryCard: {
    flex: 1,
    borderRadius: 12,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  categoryEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text,
    textAlign: 'center',
  },
  profileButton: {
    backgroundColor: theme.colors.surface,
    padding: 10,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  profileButtonText: {
    fontSize: 24,
  },
});

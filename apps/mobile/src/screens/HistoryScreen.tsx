import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, SafeAreaView, TouchableOpacity } from 'react-native';
import { theme } from '../theme';

interface HistoryScreenProps {
  navigation: any;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ navigation }) => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock fetch
    setTimeout(() => {
      setReports([
        {
          id: '1',
          issueType: 'Pothole',
          status: 'pending',
          description: 'Large pothole on main street causing traffic slowdowns.',
          address: '123 Main St',
          createdAt: '2026-09-08T10:00:00Z',
        },
        {
          id: '2',
          issueType: 'Garbage',
          status: 'resolved',
          description: 'Illegal dumping in the alleyway.',
          address: '456 Side St',
          createdAt: '2026-09-07T14:30:00Z',
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const renderItem = ({ item }: { item: any }) => {
    const statusColor = item.status === 'pending' ? '#F59E0B' : 
                        item.status === 'resolved' ? '#10B981' : 
                        item.status === 'rejected' ? '#EF4444' : theme.colors.primary;
    const statusBg = item.status === 'pending' ? '#FEF3C7' : 
                     item.status === 'resolved' ? '#DCFCE7' : 
                     item.status === 'rejected' ? '#FEE2E2' : '#E0E7FF';

    const getEmoji = (type: string) => {
      switch(type) {
        case 'Pothole': return '🕳️';
        case 'Garbage': return '🗑️';
        case 'Broken streetlight': return '💡';
        case 'Water leakage': return '💧';
        default: return '📋';
      }
    };

    return (
      <View style={styles.card}>
        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
        )}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{getEmoji(item.issueType)} {item.issueType}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
          <Text style={styles.address}>📍 {item.address || `${item.latitude}, ${item.longitude}`}</Text>
          <Text style={styles.date}>{item.createdAt.substring(0, 10)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Reports</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyEmoji}>📥</Text>
          <Text style={styles.emptyTitle}>No reports yet</Text>
          <Text style={styles.emptySubtitle}>Submit an issue to see it here</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
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
  emptyEmoji: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    ...theme.typography.h2,
    color: theme.colors.textSecondary,
  },
  emptySubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  listContainer: {
    padding: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: theme.spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  address: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  date: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    opacity: 0.7,
  },
});

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, SafeAreaView, TouchableOpacity, RefreshControl, LayoutAnimation, UIManager, Platform } from 'react-native';
import { theme } from '../theme';
import { TraceApi } from '../api/TraceApi';
import { useAuthStore } from '../store/authStore';

interface HistoryScreenProps {
  navigation: any;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ navigation }) => {
  const token = useAuthStore(state => state.token);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    if (!token) return;
    try {
      const data = await TraceApi.getReports(token);
      setReports(data || []);
    } catch (err) {
      console.error('Failed to load reports', err);
    }
  }, [token]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      await fetchReports();
      if (isMounted) setLoading(false);
    };
    load();
    return () => { isMounted = false; };
  }, [fetchReports]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  }, [fetchReports]);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

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

    const isExpanded = item.id === expandedId;

    return (
      <TouchableOpacity style={styles.card} onPress={() => toggleExpand(item.id)} activeOpacity={0.8}>
        {!isExpanded && item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.thumbnail} />
        ) : null}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{getEmoji(item.category)} {item.category}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>
          
          <Text style={styles.description} numberOfLines={isExpanded ? undefined : 2}>
            {item.description}
          </Text>

          {isExpanded && item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.fullImage} />
          ) : null}

          <View style={styles.detailsRow}>
            <Text style={styles.address}>📍 {item.address || `${item.latitude}, ${item.longitude}`}</Text>
          </View>
          
          <View style={styles.dateRow}>
            <Text style={styles.date}>
              {new Date(item.created_at).toLocaleDateString()} {isExpanded ? new Date(item.created_at).toLocaleTimeString() : ''}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
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
  fullImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginVertical: 12,
    resizeMode: 'cover',
  },
  detailsRow: {
    marginTop: 8,
  },
  dateRow: {
    marginTop: 4,
  },
});

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import { useCommunityNotifications } from '../../hooks/tabs/useCommunityNotifications';
import { formatRelativeTime } from '../../utils/communityHelpers';

export default function CommunityNotificationsScreen({ navigation }) {
  const {
    notifications,
    loading,
    refreshing,
    loadNotifications,
    handleRefresh,
    handleMarkAllRead,
    handleNotificationPress,
  } = useCommunityNotifications();

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const getNotifIconInfo = (type) => {
    switch (type) {
      case 'like':
        return { name: 'heart', color: Colors.error, bgColor: Colors.errorContainer + '20' };
      case 'comment':
        return { name: 'chatbubble', color: Colors.primary, bgColor: Colors.primaryContainer + '20' };
      case 'follow':
        return { name: 'person-add', color: '#059669', bgColor: '#e6f4ea' };
      case 'report_resolved':
        return { name: 'shield-checkmark', color: '#7c3aed', bgColor: '#f3e8ff' };
      default:
        return { name: 'notifications', color: Colors.onSurfaceVariant, bgColor: Colors.surfaceContainerHigh };
    }
  };

  const renderNotifItem = ({ item }) => {
    const iconInfo = getNotifIconInfo(item.type);
    const relativeTime = formatRelativeTime(item.createdAt);

    return (
      <TouchableOpacity
        style={[styles.notifCard, !item.isRead && styles.unreadCard]}
        onPress={() => handleNotificationPress(item, navigation)}
      >
        <View style={[styles.iconCircle, { backgroundColor: iconInfo.bgColor }]}>
          <Ionicons name={iconInfo.name} size={18} color={iconInfo.color} />
        </View>

        <View style={styles.notifContent}>
          <Text style={styles.notifText} numberOfLines={3}>
            <Text style={styles.actorName}>{item.actor?.name || 'Ai đó'}</Text> {item.content}
          </Text>
          <Text style={styles.timeText}>{relativeTime}</Text>
        </View>

        {!item.isRead ? <View style={styles.unreadIndicator} /> : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo</Text>
        {notifications.some((n) => !n.isRead) ? (
          <TouchableOpacity style={styles.markAllReadButton} onPress={handleMarkAllRead}>
            <Text style={styles.markAllReadText}>Đọc tất cả</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {/* List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotifItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="notifications-off-outline" size={48} color={Colors.onSurfaceVariant} />
              </View>
              <Text style={styles.emptyTitle}>Chưa có thông báo nào</Text>
              <Text style={styles.emptySub}>
                Mọi tương tác như thích, bình luận hoặc theo dõi sẽ được thông báo tại đây.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerHigh,
  },
  backButton: { padding: 4 },
  headerTitle: {
    fontFamily: Typography.fontBrand_Bold,
    fontSize: Typography.titleMd,
    color: Colors.onSurface,
  },
  markAllReadButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markAllReadText: {
    fontFamily: Typography.fontBody_Bold,
    fontSize: Typography.labelMd,
    color: Colors.primary,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingVertical: 8 },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerHigh,
  },
  unreadCard: {
    backgroundColor: Colors.primaryContainer + '08', // Nhạt để làm nổi bật thông báo chưa đọc
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notifContent: { flex: 1, gap: 4, paddingRight: 8 },
  notifText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodySm,
    color: Colors.onSurface,
    lineHeight: 18,
  },
  actorName: {
    fontFamily: Typography.fontBody_Bold,
    color: Colors.onSurface,
  },
  timeText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.labelSm,
    color: Colors.onSurfaceVariant,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 120,
    gap: 12,
  },
  emptyIconBg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: Typography.fontBrand_Bold,
    fontSize: Typography.titleSm,
    color: Colors.onSurface,
  },
  emptySub: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
});
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ScrollView,
  Alert,
 ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import { useCommunityAdmin } from '../../hooks/tabs/useCommunityAdmin';

const PREDEFINED_ICONS = [
  'cash-outline',
  'school-outline',
  'pie-chart-outline',
  'briefcase-outline',
  'receipt-outline',
  'wallet-outline',
  'people-outline',
  'bulb-outline',
  'help-circle-outline',
  'trending-up-outline',
  'card-outline',
  'calculator-outline',
  'gift-outline',
  'heart-outline',
  'book-outline',
];

const PREDEFINED_COLORS = [
  '#006d4a',
  '#0284c7',
  '#7c3aed',
  '#b45309',
  '#865400',
  '#0891b2',
  '#059669',
  '#d97706',
  '#dc2626',
  '#db2777',
  '#2563eb',
  '#0f172a',
];

export default function CommunityAdminScreen({ navigation }) {
  const {
    activeTab,
    setActiveTab,
    reportsFilter,
    setReportsFilter,
    reports,
    topics,
    flaggedPosts,
    loading,
    refreshing,
    loadReports,
    loadTopics,
    loadFlaggedPosts,
    handleRefresh,
    handleResolveReport,
    handleRestrictUser,
    handleCreateTopic,
    handleUpdateTopic,
    handleDeleteTopic,
    handleApprovePost,
    handleHidePost,
    userRole,
 roleChecked,
 hasAccess,
    checkRole,
  } = useCommunityAdmin();

  // Review note inputs (keyed by reportId)
  const [reviewNotes, setReviewNotes] = useState({});

  // Topic Modal State
  const [topicModalVisible, setTopicModalVisible] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null); // null for create, topic object for edit
  const [topicName, setTopicName] = useState('');
  const [topicIcon, setTopicIcon] = useState('cash-outline');
  const [topicColor, setTopicColor] = useState('#006d4a');
  const [topicSort, setTopicSort] = useState('1');

  // Restrict User Modal State
  const [restrictModalVisible, setRestrictModalVisible] = useState(false);
  const [restrictUserId, setRestrictUserId] = useState(null);
  const [restrictUserName, setRestrictUserName] = useState('');
  const [restrictType, setRestrictType] = useState('all'); // 'post' | 'comment' | 'all'
  const [restrictReason, setRestrictReason] = useState('');
  const [restrictDays, setRestrictDays] = useState('3'); // 1, 3, 7, 30

  useEffect(() => {
    checkRole();
  }, [checkRole]);

  useEffect(() => {
 if (roleChecked && hasAccess) {
      if (activeTab === 'reports') {
        loadReports(reportsFilter);
      } else if (activeTab === 'ai_review') {
        loadFlaggedPosts();
      } else {
        loadTopics();
      }
    }
  }, [activeTab, reportsFilter, loadReports, loadTopics, loadFlaggedPosts, userRole]);

  // Đang kiểm tra quyền → hiển thị loading
  if (!roleChecked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Không có quyền → hiển thị màn hình từ chối
  if (roleChecked && !hasAccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quản trị</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Ionicons name="shield-outline" size={64} color={Colors.onSurfaceVariant} />
          <Text style={{ fontFamily: Typography.fontHeadline_Bold, fontSize: Typography.titleMd, color: Colors.onSurface, marginTop: Spacing.lg, textAlign: 'center' }}>
            Không có quyền truy cập
          </Text>
          <Text style={{ fontFamily: Typography.fontBody_Regular, fontSize: Typography.bodyMd, color: Colors.onSurfaceVariant, marginTop: Spacing.sm, textAlign: 'center' }}>
            Chỉ Admin hoặc Moderator mới có thể truy cập trang này.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const openCreateTopicModal = () => {
    setEditingTopic(null);
    setTopicName('');
    setTopicIcon('cash-outline');
    setTopicColor('#006d4a');
    setTopicSort((topics.length + 1).toString());
    setTopicModalVisible(true);
  };

  const openEditTopicModal = (topic) => {
    setEditingTopic(topic);
    setTopicName(topic.name);
    setTopicIcon(topic.iconName);
    setTopicColor(topic.color);
    setTopicSort(topic.sortOrder.toString());
    setTopicModalVisible(true);
  };

  const submitTopic = () => {
    if (!topicName.trim()) {
      Alert.alert('Lỗi', 'Tên chủ đề không được bỏ trống.');
      return;
    }
    const sortVal = parseInt(topicSort, 10) || 1;
    if (editingTopic) {
      handleUpdateTopic(editingTopic.id, {
        name: topicName,
        iconName: topicIcon,
        color: topicColor,
        sortOrder: sortVal,
      });
    } else {
      handleCreateTopic(topicName, topicIcon, topicColor, sortVal);
    }
    setTopicModalVisible(false);
  };

  const openRestrictModal = (userId, userName) => {
    setRestrictUserId(userId);
    setRestrictUserName(userName);
    setRestrictReason('');
    setRestrictType('all');
    setRestrictDays('3');
    setRestrictModalVisible(true);
  };

  const submitRestriction = () => {
    if (!restrictReason.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do hạn chế.');
      return;
    }
    const days = parseInt(restrictDays, 10) || null;
    handleRestrictUser(restrictUserId, restrictType, restrictReason, days);
    setRestrictModalVisible(false);
  };

  const renderReportItem = ({ item }) => {
    const note = reviewNotes[item.id] || '';
    const isPending = item.status === 'pending';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, item.targetType === 'post' ? styles.postBadge : styles.commentBadge]}>
            <Text style={styles.badgeText}>
              {item.targetType === 'post' ? 'Bài viết' : 'Bình luận'}
            </Text>
          </View>
          <Text style={styles.cardTime}>
            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
          </Text>
        </View>

        <Text style={styles.previewTitle} numberOfLines={2}>
          Nội dung vi phạm: "{item.targetPreview}"
        </Text>
        <Text style={styles.authorText}>Tác giả: <Text style={styles.boldText}>{item.targetAuthorName}</Text></Text>

        <View style={styles.divider} />

        <View style={styles.reporterSection}>
          <Text style={styles.reporterLabel}>Người báo cáo:</Text>
          <Text style={styles.reporterValue}>{item.reporterName}</Text>
          <Text style={styles.reporterLabel}>Lý do:</Text>
          <Text style={styles.reporterValue}>{item.reason}</Text>
          {item.detail ? (
            <>
              <Text style={styles.reporterLabel}>Chi tiết:</Text>
              <Text style={styles.reporterValue}>{item.detail}</Text>
            </>
          ) : null}
        </View>

        {isPending ? (
          <View style={styles.actionBlock}>
            <TextInput
              style={styles.reviewInput}
              placeholder="Nhập ghi chú xử lý (bắt buộc)..."
              placeholderTextColor={Colors.onSurfaceVariant}
              value={note}
              onChangeText={(text) => setReviewNotes({ ...reviewNotes, [item.id]: text })}
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.dismissButton]}
                onPress={() => handleResolveReport(item.id, 'dismiss', note)}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color={Colors.primary} />
                <Text style={styles.dismissButtonText}>Bỏ qua</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.hideButton]}
                onPress={() => handleResolveReport(item.id, 'hide', note)}
              >
                <Ionicons name="eye-off-outline" size={16} color={Colors.error} />
                <Text style={styles.hideButtonText}>Ẩn nội dung</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.restrictUserTrigger}
              onPress={() => openRestrictModal(item.targetAuthorId, item.targetAuthorName)}
            >
              <Ionicons name="ban-outline" size={14} color={Colors.error} />
              <Text style={styles.restrictTriggerText}>Cấm / Hạn chế tài khoản này</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.resolvedBlock}>
            <Text style={styles.resolvedStatusText}>
              Trạng thái: <Text style={styles.boldText}>{item.status === 'dismissed' ? 'Đã bỏ qua' : 'Đã ẩn nội dung'}</Text>
            </Text>
            {item.reviewResult ? (
              <Text style={styles.resolvedNoteText}>Ghi chú: {item.reviewResult}</Text>
            ) : null}
          </View>
        )}
      </View>
    );
  };

  const renderTopicItem = ({ item }) => {
    return (
      <View style={styles.topicCard}>
        <View style={styles.topicIconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: item.color + '15' }]}>
            <Ionicons name={item.iconName} size={22} color={item.color} />
          </View>
          <View style={styles.topicInfo}>
            <Text style={styles.topicName}>{item.name}</Text>
            <Text style={styles.topicSortText}>Thứ tự: {item.sortOrder}</Text>
          </View>
        </View>
        <View style={styles.topicStatus}>
          {!item.isActive ? (
            <View style={styles.disabledBadge}>
              <Text style={styles.disabledText}>Đã tắt</Text>
            </View>
          ) : null}
          <View style={styles.topicActions}>
            <TouchableOpacity style={styles.iconButton} onPress={() => openEditTopicModal(item)}>
              <Ionicons name="create-outline" size={18} color={Colors.primary} />
            </TouchableOpacity>
            {item.isActive ? (
              <TouchableOpacity style={styles.iconButton} onPress={() => handleDeleteTopic(item.id)}>
                <Ionicons name="trash-outline" size={18} color={Colors.error} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleUpdateTopic(item.id, { isActive: true })}
              >
                <Ionicons name="refresh-outline" size={18} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const getModerationBadge = (status) => {
    if (status === 'rejected') return { label: 'Từ chối', color: Colors.error };
    if (status === 'needs_review') return { label: 'Cần xem xét', color: Colors.error };
    if (status === 'flagged') return { label: 'Nghi ngờ', color: '#d97706' };
    return { label: status, color: Colors.onSurfaceVariant };
  };

  const renderFlaggedItem = ({ item }) => {
    const badge = getModerationBadge(item.moderationStatus);
    const scorePercent = item.moderationScore != null ? Math.round(item.moderationScore * 100) : null;
    const categories = item.moderationCategories || [];

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: badge.color + '20' }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
          <Text style={styles.cardTime}>
            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
          </Text>
        </View>

        {/* Title & Author */}
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardMeta}>Tác giả: {item.authorName}</Text>

        {/* AI Analysis */}
        {scorePercent != null && (
          <View style={styles.aiScoreRow}>
            <Ionicons name="analytics-outline" size={16} color={badge.color} />
            <Text style={[styles.aiScoreText, { color: badge.color }]}>
              Rủi ro: {scorePercent}%
            </Text>
          </View>
        )}

        {item.moderationReason ? (
          <Text style={styles.aiReasonText}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.onSurfaceVariant} />{' '}
            {item.moderationReason}
          </Text>
        ) : null}

        {categories.length > 0 && (
          <View style={styles.aiCategoriesRow}>
            {categories.map((cat, idx) => (
              <View key={idx} style={styles.aiCategoryChip}>
                <Text style={styles.aiCategoryText}>{cat}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={[styles.buttonRow, { marginTop: 12 }]}>
          <TouchableOpacity
            style={[styles.actionButton, styles.dismissButton]}
            onPress={() => handleApprovePost(item.id)}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color={Colors.primary} />
            <Text style={styles.dismissButtonText}>Giữ bài</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.hideButton]}
            onPress={() => handleHidePost(item.id)}
          >
            <Ionicons name="eye-off-outline" size={18} color={Colors.error} />
            <Text style={styles.hideButtonText}>Ẩn bài</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản trị Cộng đồng</Text>
        {activeTab === 'topics' ? (
          <TouchableOpacity style={styles.addTopicHeaderButton} onPress={openCreateTopicModal}>
            <Ionicons name="add-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'reports' && styles.tabButtonActive]}
          onPress={() => setActiveTab('reports')}
        >
          <Text style={[styles.tabText, activeTab === 'reports' && styles.tabTextActive]}>Báo cáo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'ai_review' && styles.tabButtonActive]}
          onPress={() => setActiveTab('ai_review')}
        >
          <Text style={[styles.tabText, activeTab === 'ai_review' && styles.tabTextActive]}>AI Review</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'topics' && styles.tabButtonActive]}
          onPress={() => setActiveTab('topics')}
        >
          <Text style={[styles.tabText, activeTab === 'topics' && styles.tabTextActive]}>Chủ đề</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips for Reports */}
      {activeTab === 'reports' ? (
        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={[styles.filterChip, reportsFilter === 'pending' && styles.filterChipActive]}
            onPress={() => setReportsFilter('pending')}
          >
            <Text style={[styles.filterChipText, reportsFilter === 'pending' && styles.filterChipTextActive]}>
              Chờ xử lý
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, reportsFilter === 'reviewed' && styles.filterChipActive]}
            onPress={() => setReportsFilter('reviewed')}
          >
            <Text style={[styles.filterChipText, reportsFilter === 'reviewed' && styles.filterChipTextActive]}>
              Đã ẩn nội dung
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, reportsFilter === 'dismissed' && styles.filterChipActive]}
            onPress={() => setReportsFilter('dismissed')}
          >
            <Text style={[styles.filterChipText, reportsFilter === 'dismissed' && styles.filterChipTextActive]}>
              Đã bỏ qua
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Main List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'reports' ? reports : activeTab === 'ai_review' ? flaggedPosts : topics}
          keyExtractor={(item) => item.id}
          renderItem={activeTab === 'reports' ? renderReportItem : activeTab === 'ai_review' ? renderFlaggedItem : renderTopicItem}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name={activeTab === 'reports' ? 'shield-checkmark-outline' : activeTab === 'ai_review' ? 'sparkles-outline' : 'folder-open-outline'}
                size={48}
                color={Colors.onSurfaceVariant}
              />
              <Text style={styles.emptyText}>
                {activeTab === 'reports' ? 'Không có báo cáo vi phạm nào.' : activeTab === 'ai_review' ? 'Không có bài nào cần kiểm duyệt.' : 'Chưa có chủ đề nào.'}
              </Text>
            </View>
          }
        />
      )}

      {/* MODAL: CREATE / EDIT TOPIC */}
      <Modal visible={topicModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingTopic ? 'Cập nhật Chủ đề' : 'Thêm Chủ đề mới'}</Text>
              <TouchableOpacity onPress={() => setTopicModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.onSurface} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.inputLabel}>Tên chủ đề</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Nhập tên chủ đề..."
                placeholderTextColor={Colors.onSurfaceVariant}
                value={topicName}
                onChangeText={setTopicName}
              />

              <Text style={styles.inputLabel}>Thứ tự hiển thị</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Thứ tự..."
                placeholderTextColor={Colors.onSurfaceVariant}
                value={topicSort}
                keyboardType="numeric"
                onChangeText={setTopicSort}
              />

              <Text style={styles.inputLabel}>Chọn Biểu tượng</Text>
              <View style={styles.gridContainer}>
                {PREDEFINED_ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[styles.gridItem, topicIcon === icon && styles.gridItemActive]}
                    onPress={() => setTopicIcon(icon)}
                  >
                    <Ionicons name={icon} size={22} color={topicIcon === icon ? Colors.primary : Colors.onSurface} />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Chọn màu sắc</Text>
              <View style={styles.gridContainer}>
                {PREDEFINED_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorGridItem,
                      { backgroundColor: color },
                      topicColor === color && styles.colorGridItemActive,
                    ]}
                    onPress={() => setTopicColor(color)}
                  />
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.submitButton} onPress={submitTopic}>
              <Text style={styles.submitButtonText}>{editingTopic ? 'Cập nhật' : 'Tạo mới'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: RESTRICT USER */}
      <Modal visible={restrictModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hạn chế người dùng</Text>
              <TouchableOpacity onPress={() => setRestrictModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.onSurface} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.restrictWarning}>
                Hạn chế hoạt động của tài khoản: <Text style={styles.boldText}>{restrictUserName}</Text>
              </Text>

              <Text style={styles.inputLabel}>Hình thức hạn chế</Text>
              <View style={styles.choiceRow}>
                <TouchableOpacity
                  style={[styles.choiceBtn, restrictType === 'all' && styles.choiceBtnActive]}
                  onPress={() => setRestrictType('all')}
                >
                  <Text style={[styles.choiceText, restrictType === 'all' && styles.choiceTextActive]}>Tất cả</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.choiceBtn, restrictType === 'post' && styles.choiceBtnActive]}
                  onPress={() => setRestrictType('post')}
                >
                  <Text style={[styles.choiceText, restrictType === 'post' && styles.choiceTextActive]}>Đăng bài</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.choiceBtn, restrictType === 'comment' && styles.choiceBtnActive]}
                  onPress={() => setRestrictType('comment')}
                >
                  <Text style={[styles.choiceText, restrictType === 'comment' && styles.choiceTextActive]}>Bình luận</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Thời hạn cấm</Text>
              <View style={styles.choiceRow}>
                {[
                  { label: '3 Ngày', value: '3' },
                  { label: '7 Ngày', value: '7' },
                  { label: '30 Ngày', value: '30' },
                  { label: 'Vĩnh viễn', value: '0' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.choiceBtn, restrictDays === item.value && styles.choiceBtnActive]}
                    onPress={() => setRestrictDays(item.value)}
                  >
                    <Text style={[styles.choiceText, restrictDays === item.value && styles.choiceTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Lý do hạn chế</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Nhập lý do cụ thể gửi đến người dùng..."
                placeholderTextColor={Colors.onSurfaceVariant}
                multiline
                numberOfLines={3}
                value={restrictReason}
                onChangeText={restrictReason => setRestrictReason(restrictReason)}
              />
            </ScrollView>

            <TouchableOpacity style={[styles.submitButton, styles.restrictSubmitBtn]} onPress={submitRestriction}>
              <Text style={styles.submitButtonText}>Áp dụng cấm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  addTopicHeaderButton: { padding: 4 },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerHigh,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: { borderBottomColor: Colors.primary },
  tabText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  tabTextActive: {
    fontFamily: Typography.fontBody_Bold,
    color: Colors.primary,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerLow,
  },
  filterChipActive: { backgroundColor: Colors.primaryContainer },
  filterChipText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.labelMd,
    color: Colors.onSurfaceVariant,
  },
  filterChipTextActive: {
    color: Colors.primary,
    fontFamily: Typography.fontBody_Bold,
  },
     listContent: { padding: 16, gap: 16, paddingBottom: 40 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  postBadge: { backgroundColor: '#e0f2fe' },
  commentBadge: { backgroundColor: '#f3e8ff' },
  badgeText: {
    fontFamily: Typography.fontBody_Bold,
    fontSize: Typography.labelSm,
    color: Colors.primary,
  },
  cardTime: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.labelSm,
    color: Colors.onSurfaceVariant,
  },
  previewTitle: {
    fontFamily: Typography.fontBody_Bold,
    fontSize: Typography.bodyMd,
    color: Colors.onSurface,
    marginBottom: 4,
  },
  authorText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.labelMd,
    color: Colors.onSurfaceVariant,
    marginBottom: 12,
  },
  boldText: { fontFamily: Typography.fontBody_Bold, color: Colors.onSurface },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceContainerHigh,
    marginVertical: 8,
  },
  reporterSection: {
    backgroundColor: Colors.surfaceContainerLow,
    padding: 10,
    borderRadius: 8,
    gap: 4,
  },
  reporterLabel: {
    fontFamily: Typography.fontBody_Bold,
    fontSize: Typography.labelSm,
    color: Colors.onSurfaceVariant,
  },
  reporterValue: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodySm,
    color: Colors.onSurface,
    marginBottom: 4,
  },
  actionBlock: { marginTop: 12, gap: 12 },
  reviewInput: {
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodySm,
    backgroundColor: Colors.surfaceContainerLow,
    color: Colors.onSurface,
  },
  buttonRow: { flexDirection: 'row', gap: 12 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  dismissButton: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  dismissButtonText: {
    fontFamily: Typography.fontBody_Bold,
    fontSize: Typography.labelMd,
    color: Colors.primary,
  },
  hideButton: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorContainer + '15',
  },
  hideButtonText: {
    fontFamily: Typography.fontBody_Bold,
    fontSize: Typography.labelMd,
    color: Colors.error,
  },
  restrictUserTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  restrictTriggerText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.labelSm,
    color: Colors.error,
  },
  resolvedBlock: {
    marginTop: 12,
    backgroundColor: Colors.surfaceContainerHigh,
    padding: 10,
    borderRadius: 8,
    gap: 4,
  },
  resolvedStatusText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.labelMd,
    color: Colors.onSurface,
  },
  resolvedNoteText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  topicCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  topicIconContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicInfo: { gap: 2 },
  topicName: {
    fontFamily: Typography.fontBody_Bold,
    fontSize: Typography.bodyMd,
    color: Colors.onSurface,
  },
  topicSortText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.labelSm,
    color: Colors.onSurfaceVariant,
  },
  topicStatus: { alignItems: 'flex-end', gap: 8 },
  disabledBadge: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  disabledText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  topicActions: { flexDirection: 'row', gap: 4 },
  iconButton: { padding: 6 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerHigh,
  },
  modalTitle: {
    fontFamily: Typography.fontBrand_Bold,
    fontSize: Typography.titleMd,
    color: Colors.onSurface,
  },
  modalScroll: { padding: 20, gap: 16 },
  inputLabel: {
    fontFamily: Typography.fontBody_Bold,
    fontSize: Typography.labelMd,
    color: Colors.onSurface,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodyMd,
    backgroundColor: Colors.surfaceContainerLowest,
    color: Colors.onSurface,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: 4,
  },
  gridItem: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
  },
  gridItemActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryContainer + '20' },
  colorGridItem: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorGridItemActive: { borderColor: Colors.surface, borderWidth: 2, elevation: 4 },
  submitButton: {
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    fontFamily: Typography.fontBody_Bold,
    fontSize: Typography.bodyMd,
    color: Colors.surface,
  },
  restrictWarning: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodySm,
    color: Colors.error,
    backgroundColor: Colors.errorContainer + '10',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.errorContainer + '30',
  },
  choiceRow: { flexDirection: 'row', gap: 8 },
  choiceBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
  },
  choiceBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryContainer + '20',
  },
  choiceText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.labelMd,
    color: Colors.onSurfaceVariant,
  },
  choiceTextActive: {
    fontFamily: Typography.fontBody_Bold,
    color: Colors.primary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  restrictSubmitBtn: {
    backgroundColor: Colors.error,
  },
  // ===== AI REVIEW STYLES =====
  aiScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  aiScoreText: {
    fontFamily: Typography.fontBody_Bold,
    fontSize: Typography.labelMd,
  },
  aiReasonText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodySm,
    color: Colors.onSurfaceVariant,
    marginTop: 6,
    lineHeight: 18,
  },
  aiCategoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  aiCategoryChip: {
    backgroundColor: Colors.errorContainer + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.errorContainer + '40',
  },
  aiCategoryText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: 11,
    color: Colors.error,
  },
});
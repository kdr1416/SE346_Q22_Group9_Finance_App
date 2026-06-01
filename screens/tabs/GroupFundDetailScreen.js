import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import { formatVND } from '../../utils/currency';
import { useAuth } from '../../contexts/AuthContext';
import useGroupFundDetail from '../../hooks/tabs/useGroupFundDetail';
import { updateMemberRoleInDB, removeMemberFromDB } from '../../services/groupFundService';

export default function GroupFundDetailScreen({ route, navigation }) {
  const { fund } = route.params;
  const { user } = useAuth();

  const {
    members,
    paymentRequests,
    expenses,
    activityLogs,
    loading,
    activeSection,
    setActiveSection,
    myRole,
    isOwner,
    isAdminOrOwner,
    refreshAll,
    handleCreatePaymentRequest,
    handleSubmitPayment,
    handleConfirmPayment,
    handleCreateExpense,
    handleApproveExpense,
    handleRejectExpense,
    loadRequestMembers,
  } = useGroupFundDetail(fund);

  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [showCreateExpense, setShowCreateExpense] = useState(false);
  const [showRequestDetail, setShowRequestDetail] = useState(null);
  const [requestMembers, setRequestMembers] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [reqTitle, setReqTitle] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqAmount, setReqAmount] = useState('');
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('');
  const [expNote, setExpNote] = useState('');

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const getLogIcon = (type) => {
    const map = {
      create_fund: 'add-circle',
      add_member: 'person-add',
      remove_member: 'person-remove',
      promote_admin: 'shield-checkmark',
      demote_member: 'shield-outline',
      create_request: 'cash',
      confirm_payment: 'checkmark-circle',
      create_expense: 'cart',
      approve_expense: 'checkmark-done',
      reject_expense: 'close-circle',
    };
    return map[type] || 'document-text';
  };

  const openRequestDetail = async (request) => {
    setShowRequestDetail(request);
    setLoadingDetail(true);
    try {
      const membersData = await loadRequestMembers(request.id);
      setRequestMembers(membersData);
    } catch (error) {
      Alert.alert('Lỗi', error?.message || 'Không thể tải chi tiết yêu cầu.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const submitRequestPayment = async (memberId, note) => {
    if (!user?.id) {
      Alert.alert('Lỗi', 'Bạn cần đăng nhập để thực hiện.');
      return;
    }
    setSubmitting(true);
    try {
      await handleSubmitPayment(memberId, note);
      Alert.alert('Thành công', 'Bạn đã gửi yêu cầu xác nhận nộp tiền.');
      setShowRequestDetail(null);
      await refreshAll();
    } catch (error) {
      Alert.alert('Lỗi', error?.message || 'Không thể gửi yêu cầu.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmRequestPayment = async (memberId, amountDue) => {
    if (!showRequestDetail) return;
    setSubmitting(true);
    try {
      await handleConfirmPayment(memberId, showRequestDetail.id, amountDue);
      Alert.alert('Thành công', 'Đã xác nhận nộp tiền.');
      setShowRequestDetail(null);
      await refreshAll();
    } catch (error) {
      Alert.alert('Lỗi', error?.message || 'Không thể xác nhận.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMemberAction = async (member) => {
    if (!isOwner) return;
    Alert.alert(`Quản lý ${member.name}`, 'Chọn hành động:', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: member.role === 'admin' ? 'Giảm quyền' : 'Cấp quyền quản trị',
        onPress: async () => {
          try {
            await updateMemberRoleInDB(member.memberId, member.role === 'admin' ? 'member' : 'admin');
            await refreshAll();
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể cập nhật vai trò thành viên.');
          }
        },
      },
      {
        text: 'Xóa khỏi nhóm',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeMemberFromDB(member.memberId);
            await refreshAll();
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể xóa thành viên.');
          }
        },
      },
    ]);
  };

  const createRequest = async () => {
    if (!reqTitle.trim() || !reqAmount.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề và số tiền');
      return;
    }
    setSubmitting(true);
    try {
      await handleCreatePaymentRequest(reqTitle.trim(), reqDesc.trim(), Number(reqAmount), null);
      setShowCreateRequest(false);
      setReqTitle('');
      setReqDesc('');
      setReqAmount('');
      Alert.alert('Thành công', 'Tạo yêu cầu thu quỹ thành công.');
    } catch (error) {
      Alert.alert('Lỗi', error?.message || 'Không thể tạo yêu cầu.');
    } finally {
      setSubmitting(false);
    }
  };

  const createExpense = async () => {
    if (!expTitle.trim() || !expAmount.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề và số tiền');
      return;
    }
    setSubmitting(true);
    try {
      await handleCreateExpense(expTitle.trim(), Number(expAmount), expCategory.trim() || null, null, expNote.trim() || null);
      setShowCreateExpense(false);
      setExpTitle('');
      setExpAmount('');
      setExpCategory('');
      setExpNote('');
      Alert.alert('Thành công', 'Đã tạo khoản chi.');
    } catch (error) {
      Alert.alert('Lỗi', error?.message || 'Không thể tạo khoản chi.');
    } finally {
      setSubmitting(false);
    }
  };

  const sections = [
    { key: 'requests', label: 'Thu quỹ', icon: 'cash-outline' },
    { key: 'expenses', label: 'Chi quỹ', icon: 'cart-outline' },
    { key: 'logs', label: 'Lịch sử', icon: 'time-outline' },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{fund?.name || 'Chi tiết quỹ'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Số dư Quỹ nhóm</Text>
          <Text style={styles.balanceValue}>{formatVND(fund.currentBalance)}</Text>
          <Text style={styles.balanceMeta}>Mã mời: {fund.inviteCode}</Text>
        </View>

        <View style={styles.tabRow}>
          {sections.map((section) => (
            <TouchableOpacity
              key={section.key}
              style={[styles.tabButton, activeSection === section.key && styles.tabButtonActive]}
              onPress={() => setActiveSection(section.key)}
            >
              <Ionicons name={section.icon} size={18} color={activeSection === section.key ? Colors.surface : Colors.onSurfaceVariant} />
              <Text style={[styles.tabLabel, activeSection === section.key && styles.tabLabelActive]}>{section.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeSection === 'requests' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Yêu cầu thu quỹ</Text>
              <AppButton label="Tạo mới" onPress={() => setShowCreateRequest(true)} style={styles.smallActionButton} />
            </View>
            {paymentRequests.length === 0 ? (
              <Text style={styles.emptyText}>Chưa có yêu cầu thu quỹ nào.</Text>
            ) : (
              paymentRequests.map((request) => (
                <TouchableOpacity key={request.id} style={styles.card} onPress={() => openRequestDetail(request)}>
                  <View style={styles.cardRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{request.title}</Text>
                      <Text style={styles.cardSubtitle}>{request.createdByName} · {formatDate(request.createdAt)}</Text>
                    </View>
                    <View style={[styles.statusBadge, request.status === 'collecting' ? styles.statusPending : styles.statusCompleted]}>
                      <Text style={styles.statusText}>{request.status === 'collecting' ? 'Đang thu' : 'Hoàn tất'}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardAmount}>Mỗi người: {formatVND(request.amountPerMember)}</Text>
                  <Text style={styles.cardMeta}>Đã thu {formatVND(request.totalCollectedAmount)} / {formatVND(request.totalExpectedAmount)}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {activeSection === 'expenses' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Khoản chi</Text>
              <AppButton label="Tạo mới" onPress={() => setShowCreateExpense(true)} style={styles.smallActionButton} />
            </View>
            {expenses.length === 0 ? (
              <Text style={styles.emptyText}>Chưa có khoản chi nào.</Text>
            ) : (
              expenses.map((expense) => (
                <View key={expense.id} style={styles.card}>
                  <View style={styles.cardRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{expense.title}</Text>
                      <Text style={styles.cardSubtitle}>{expense.createdByName} · {formatDate(expense.expenseDate)}</Text>
                    </View>
                    <View style={[styles.statusBadge,
                      expense.status === 'approved' ? styles.statusCompleted :
                      expense.status === 'rejected' ? styles.statusRejected : styles.statusPending
                    ]}>
                      <Text style={styles.statusText}>
                        {expense.status === 'approved' ? 'Đã duyệt' : expense.status === 'rejected' ? 'Bị từ chối' : 'Chờ duyệt'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardAmount}>{formatVND(expense.amount)}</Text>
                  {isAdminOrOwner && expense.status === 'pending' && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity style={[styles.actionButtonMini, styles.actionApprove]} onPress={() => handleApproveExpense(expense.id, expense.amount)}>
                        <Ionicons name="checkmark-circle" size={16} color="#fff" />
                        <Text style={styles.actionButtonMiniText}>Duyệt</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionButtonMini, styles.actionReject]} onPress={() => handleRejectExpense(expense.id)}>
                        <Ionicons name="close-circle" size={16} color="#fff" />
                        <Text style={styles.actionButtonMiniText}>Từ chối</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {activeSection === 'logs' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lịch sử hoạt động</Text>
            {activityLogs.length === 0 ? (
              <Text style={styles.emptyText}>Chưa có hoạt động nào.</Text>
            ) : (
              activityLogs.map((log) => (
                <View key={log.id} style={styles.logRow}>
                  <View style={styles.logIcon}>
                    <Ionicons name={getLogIcon(log.actionType)} size={18} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.logDescription}>{log.description}</Text>
                    <Text style={styles.logMeta}>{log.actorName} · {formatDate(log.createdAt)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thành viên ({members.length})</Text>
          {isOwner && <Text style={styles.hintText}>Chạm vào thành viên để cấp quyền hoặc xóa khỏi nhóm.</Text>}
          {loading ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: Spacing.sm }} />
          ) : (
            members.map((member) => (
              <TouchableOpacity key={member.memberId} style={styles.memberRow} onPress={() => {
                if (isOwner && member.role !== 'owner') handleMemberAction(member);
              }} disabled={!isOwner || member.role === 'owner'} activeOpacity={0.75}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{member.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRole}>{member.role === 'owner' ? 'Chủ quỹ' : member.role === 'admin' ? 'Admin' : 'Thành viên'}</Text>
                </View>
                {isOwner && member.role !== 'owner' && <Ionicons name="ellipsis-vertical" size={16} color={Colors.onSurfaceVariant} />}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={showCreateRequest} animationType="slide" transparent onRequestClose={() => setShowCreateRequest(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Tạo yêu cầu thu quỹ</Text>
            <AppInput label="Tiêu đề" value={reqTitle} onChangeText={setReqTitle} placeholder="Nhập tiêu đề" />
            <AppInput label="Mô tả" value={reqDesc} onChangeText={setReqDesc} placeholder="Mô tả" />
            <AppInput label="Số tiền mỗi người" value={reqAmount} onChangeText={setReqAmount} placeholder="100000" keyboardType="numeric" />
            <View style={styles.modalButtons}>
              <AppButton label="Hủy" variant="secondary" onPress={() => setShowCreateRequest(false)} style={{ flex: 1, marginRight: Spacing.sm }} />
              <AppButton label="Tạo" onPress={createRequest} style={{ flex: 1 }} loading={submitting} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showCreateExpense} animationType="slide" transparent onRequestClose={() => setShowCreateExpense(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Tạo khoản chi</Text>
            <AppInput label="Tiêu đề" value={expTitle} onChangeText={setExpTitle} placeholder="Nhập tiêu đề" />
            <AppInput label="Số tiền" value={expAmount} onChangeText={setExpAmount} placeholder="100000" keyboardType="numeric" />
            <AppInput label="Loại" value={expCategory} onChangeText={setExpCategory} placeholder="Ví dụ: Mua sắm" />
            <AppInput label="Ghi chú" value={expNote} onChangeText={setExpNote} placeholder="Ghi chú thêm" />
            <View style={styles.modalButtons}>
              <AppButton label="Hủy" variant="secondary" onPress={() => setShowCreateExpense(false)} style={{ flex: 1, marginRight: Spacing.sm }} />
              <AppButton label="Gửi" onPress={createExpense} style={{ flex: 1 }} loading={submitting} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={Boolean(showRequestDetail)} animationType="slide" transparent onRequestClose={() => setShowRequestDetail(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardLarge}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{showRequestDetail?.title || 'Chi tiết yêu cầu'}</Text>
                <TouchableOpacity onPress={() => setShowRequestDetail(null)}>
                  <Ionicons name="close" size={24} color={Colors.onSurface} />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalSubtitle}>{showRequestDetail?.description || 'Không có mô tả'}</Text>
              <Text style={styles.modalMeta}>Mỗi người: {formatVND(showRequestDetail?.amountPerMember || 0)}</Text>
              <Text style={styles.modalMeta}>Trạng thái: {showRequestDetail?.status}</Text>

            <View style={styles.requestMembersList}>
              {loadingDetail ? (
                <ActivityIndicator color={Colors.primary} />
              ) : requestMembers.length === 0 ? (
                <Text style={styles.emptyText}>Chưa có thành viên nào.</Text>
              ) : (
                requestMembers.map((item) => (
                  <View key={item.id} style={styles.requestMemberRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName}>{item.name}</Text>
                      <Text style={styles.memberRole}>Trạng thái: {item.status}</Text>
                      <Text style={styles.memberMeta}>Nợ: {formatVND(item.amountDue)} · Đã đóng: {formatVND(item.amountPaid)}</Text>
                    </View>
                    {user?.id === item.memberId && item.status === 'unpaid' && (
                      <TouchableOpacity style={styles.requestAction} onPress={() => submitRequestPayment(item.id, '')}>
                        <Text style={styles.requestActionText}>Nộp</Text>
                      </TouchableOpacity>
                    )}
                    {isAdminOrOwner && item.status === 'pending_confirm' && (
                      <TouchableOpacity style={styles.requestActionConfirm} onPress={() => confirmRequestPayment(item.id, item.amountDue)}>
                        <Text style={styles.requestActionText}>Xác nhận</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.base },
  title: { fontFamily: Typography.fontHeadline_Bold, fontSize: Typography.headlineSm, color: Colors.onSurface, flex: 1, textAlign: 'center', marginHorizontal: Spacing.md },
  container: { padding: Spacing.lg, paddingBottom: Spacing.xl },
  balanceCard: { backgroundColor: Colors.primary, borderRadius: Spacing.radiusXl, padding: Spacing.xl, marginBottom: Spacing.lg },
  balanceLabel: { fontFamily: Typography.fontBody_Regular, color: Colors.onPrimary, marginBottom: Spacing.xs },
  balanceValue: { fontFamily: Typography.fontHeadline_ExtraBold, fontSize: Typography.displayLg, color: Colors.onPrimary, marginBottom: Spacing.sm },
  balanceMeta: { fontFamily: Typography.fontBody_Regular, color: Colors.onPrimary, opacity: 0.9 },
  tabRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg },
  tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.sm, borderRadius: Spacing.radiusLg, backgroundColor: Colors.surfaceContainerLowest, marginRight: Spacing.sm },
  tabButtonActive: { backgroundColor: Colors.primary },
  tabLabel: { marginLeft: Spacing.xs, fontFamily: Typography.fontBody_Medium, color: Colors.onSurfaceVariant },
  tabLabelActive: { color: Colors.surface },
  section: { marginBottom: Spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { fontFamily: Typography.fontHeadline_SemiBold, fontSize: Typography.headlineSm, color: Colors.onSurface },
  smallActionButton: { minWidth: 100 },
  card: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Spacing.radiusXl, padding: Spacing.lg, marginBottom: Spacing.md },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  cardTitle: { fontFamily: Typography.fontHeadline_SemiBold, fontSize: Typography.bodyMd, color: Colors.onSurface },
  cardSubtitle: { fontFamily: Typography.fontBody_Regular, fontSize: Typography.bodyXs, color: Colors.onSurfaceVariant, marginTop: Spacing.xs },
  cardAmount: { fontFamily: Typography.fontHeadline_Bold, fontSize: Typography.titleMd, color: Colors.onSurface, marginBottom: Spacing.xs },
  cardMeta: { fontFamily: Typography.fontBody_Regular, fontSize: Typography.bodySm, color: Colors.onSurfaceVariant },
  statusBadge: { paddingVertical: 4, paddingHorizontal: Spacing.sm, borderRadius: Spacing.radiusFull },
  statusText: { fontFamily: Typography.fontBody_Bold, fontSize: Typography.bodyXs, color: Colors.surface },
  statusPending: { backgroundColor: Colors.secondary },
  statusCompleted: { backgroundColor: Colors.primary },
  statusRejected: { backgroundColor: '#EF4444' },
  actionRow: { flexDirection: 'row', marginTop: Spacing.sm },
  actionButtonMini: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm, borderRadius: Spacing.radiusLg, marginRight: Spacing.sm },
  actionApprove: { backgroundColor: '#22C55E' },
  actionReject: { backgroundColor: '#EF4444' },
  actionButtonMiniText: { marginLeft: Spacing.xs, color: Colors.white, fontFamily: Typography.fontBody_Medium },
  emptyText: { fontFamily: Typography.fontBody_Regular, fontSize: Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center', paddingVertical: Spacing.md },
  logRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.sm, backgroundColor: Colors.surfaceContainerLowest, borderRadius: Spacing.radiusLg, marginBottom: Spacing.sm },
  logIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  logDescription: { fontFamily: Typography.fontBody_Medium, color: Colors.onSurface },
  logMeta: { fontFamily: Typography.fontBody_Regular, color: Colors.onSurfaceVariant, marginTop: Spacing.xs },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.surfaceContainerHigh },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  avatarText: { fontFamily: Typography.fontHeadline_Bold, fontSize: 16, color: Colors.white },
  memberName: { fontFamily: Typography.fontHeadline_SemiBold, fontSize: Typography.bodyMd, color: Colors.onSurface },
  memberRole: { fontFamily: Typography.fontBody_Regular, fontSize: Typography.bodyXs, color: Colors.onSurfaceVariant },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  modalCard: { backgroundColor: Colors.surface, borderTopLeftRadius: Spacing.radiusXl, borderTopRightRadius: Spacing.radiusXl, padding: Spacing.lg, minHeight: 320 },
  modalCardLarge: { backgroundColor: Colors.surface, borderTopLeftRadius: Spacing.radiusXl, borderTopRightRadius: Spacing.radiusXl, padding: Spacing.lg, minHeight: 420 },
  modalTitle: { fontFamily: Typography.fontHeadline_SemiBold, fontSize: Typography.headlineSm, color: Colors.onSurface, marginBottom: Spacing.md },
  modalSubtitle: { fontFamily: Typography.fontBody_Regular, color: Colors.onSurfaceVariant, marginBottom: Spacing.sm },
  modalMeta: { fontFamily: Typography.fontBody_Regular, color: Colors.onSurfaceVariant, marginBottom: Spacing.xs },
  modalButtons: { flexDirection: 'row', marginTop: Spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  requestMembersList: { marginTop: Spacing.md },
  requestMemberRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.sm, backgroundColor: Colors.surfaceContainerLowest, borderRadius: Spacing.radiusLg, marginBottom: Spacing.sm },
  requestAction: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Spacing.radiusLg },
  requestActionConfirm: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm, backgroundColor: '#22C55E', borderRadius: Spacing.radiusLg },
  requestActionText: { color: Colors.surface, fontFamily: Typography.fontBody_Medium },
});

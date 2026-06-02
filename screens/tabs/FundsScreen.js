import React, { useState, useMemo } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, 
  TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PotItem from '../../components/finance/PotItem';
import PotFormModal from '../../components/finance/PotFormModal';
import PotActionModal from '../../components/finance/PotActionModal';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import usePots from '../../hooks/tabs/usePots';
import useTransactions from '../../hooks/tabs/useTransactions';
import useGroupFunds from '../../hooks/tabs/useGroupFunds'; // <--- Import Hook Quỹ nhóm
import AppInput from '../../components/ui/AppInput';
import { formatVND } from '../../utils/currency';
import { useNavigation } from '@react-navigation/native';

export default function FundsScreen() {
  const navigation = useNavigation();
  const { pots, totalSaved, totalTarget, loading, savePot, depositToPot, withdrawFromPot, completePot, deletePot } = usePots();
  const { addTransactionLocally, transactions } = useTransactions();
  
  // Gọi hook quản lý Quỹ Nhóm thật
  const { groupFunds, loading: groupLoading, handleCreateGroup, handleJoinGroup } = useGroupFunds();

  // 1. TOP TAB STATE: 'personal' hoặc 'group'
  const [activeTab, setActiveTab] = useState('personal');

  // Tính số dư thực tế từ toàn bộ lịch sử giao dịch (cho nạp/rút quỹ cá nhân)
  const availableBalance = useMemo(() => {
    return transactions.reduce((balance, t) => {
      return t.type === 'income' ? balance + t.amount : balance - t.amount;
    }, 0);
  }, [transactions]);

  // Các Modal State
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedPot, setSelectedPot] = useState(null);

  // Modal Tạo / Tham gia Quỹ nhóm
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);

  // State nhập liệu cho Quỹ nhóm mới
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const overallProgress = totalTarget > 0 ? totalSaved / totalTarget : 0;

  const handleDeposit = (pot) => {
    setSelectedPot(pot);
    setActionModalVisible(true);
  };

  const handleEdit = (pot) => {
    setSelectedPot(pot);
    setFormModalVisible(true);
  };

  const handleComplete = (pot) => {
    const msg = pot.savedAmount > 0
      ? `Bạn muốn kết thúc lọ "${pot.name}"?\n\nSố tiền ${formatVND(pot.savedAmount)} sẽ được giải ngân và cộng vào số dư tài khoản.`
      : `Bạn muốn kết thúc lọ "${pot.name}"?\n\nLọ không còn tiền, chỉ đánh dấu hoàn thành.`;

    Alert.alert('Kết thúc lọ tiết kiệm 🏁', msg, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: pot.savedAmount > 0 ? 'Giải ngân & Kết thúc' : 'Kết thúc',
        onPress: () => completePot(pot, addTransactionLocally),
      },
    ]);
  };

  const handleDelete = (pot) => {
    Alert.alert(
      'Xóa lọ tiết kiệm',
      `Xóa lọ "${pot.name}"? Hành động này không thể hoàn tác.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: () => deletePot(pot.id) },
      ]
    );
  };

  // Tạo quỹ nhóm mới
  const onCreateGroupSubmit = async () => {
    if (!groupName.trim()) {
      Alert.alert('Thông báo', 'Tên quỹ nhóm không được để trống.');
      return;
    }
    setSubmitting(true);
    try {
      await handleCreateGroup(
        groupName.trim(),
        groupDesc.trim(),
        'team',
        targetAmount ? Number(targetAmount) : null
      );
      setCreateModalVisible(false);
      setGroupName('');
      setGroupDesc('');
      setTargetAmount('');
    } catch (e) {
      // Đã Alert trong hook
    } finally {
      setSubmitting(false);
    }
  };

  // Tham gia bằng mã mời
  const onJoinGroupSubmit = async () => {
    if (!inviteCodeInput.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập mã mời.');
      return;
    }
    setSubmitting(true);
    try {
      await handleJoinGroup(inviteCodeInput.trim().toUpperCase());
      setJoinModalVisible(false);
      setInviteCodeInput('');
    } catch (e) {
      // Đã Alert trong hook
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header & Selector */}
      <View style={styles.header}>
        <Text style={styles.title}>Quỹ tài chính</Text>
        
        {/* Nút Thêm Lọ cá nhân */}
        {activeTab === 'personal' && (
          <TouchableOpacity 
            style={styles.addBtn} 
            onPress={() => { setSelectedPot(null); setFormModalVisible(true); }}
          >
            <Ionicons name="add" size={22} color={Colors.white} />
          </TouchableOpacity>
        )}
      </View>

      {/* Segmented Top Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'personal' && styles.tabActive]}
          onPress={() => setActiveTab('personal')}
          activeOpacity={0.8}
        >
          <Ionicons 
            name="wallet-outline" 
            size={18} 
            color={activeTab === 'personal' ? Colors.onPrimary : Colors.onSurfaceVariant} 
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'personal' && styles.tabTextActive]}>
            Quỹ cá nhân
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'group' && styles.tabActive]}
          onPress={() => setActiveTab('group')}
          activeOpacity={0.8}
        >
          <Ionicons 
            name="people-outline" 
            size={18} 
            color={activeTab === 'group' ? Colors.onPrimary : Colors.onSurfaceVariant} 
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'group' && styles.tabTextActive]}>
            Quỹ nhóm
          </Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* ==================== TAB 1: QUỸ CÁ NHÂN ==================== */}
        {activeTab === 'personal' && (
          <View>
            <View style={styles.summaryCard}>
              <View style={styles.summaryTop}>
                <View>
                  <Text style={styles.sumLabel}>Tổng đã tiết kiệm</Text>
                  <Text style={styles.sumAmount}>{formatVND(totalSaved)}</Text>
                  <Text style={styles.sumOf}>trên {formatVND(totalTarget)} mục tiêu</Text>
                </View>
                <View style={styles.percentCircle}>
                  <Text style={styles.percentText}>{Math.round(overallProgress * 100)}%</Text>
                </View>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${Math.min(overallProgress * 100, 100)}%` }]} />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Các lọ tiết kiệm cá nhân</Text>
              {loading ? (
                <ActivityIndicator size="large" color={Colors.secondary} style={{ marginTop: 20 }} />
              ) : (
                <View style={styles.card}>
                  {pots.length > 0 ? (
                    pots.map((p, index) => (
                      <PotItem
                        key={p.id || `pot-${index}`}
                        item={p}
                        onDeposit={() => handleDeposit(p)}
                        onEdit={() => handleEdit(p)}
                        onComplete={() => handleComplete(p)}
                        onDelete={() => handleDelete(p)}
                      />
                    ))
                  ) : (
                    <Text style={styles.empty}>Chưa có lọ tiết kiệm nào. Nhấn + để tạo lọ đầu tiên!</Text>
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ==================== TAB 2: QUỸ NHÓM THẬT ==================== */}
        {activeTab === 'group' && (
          <View style={styles.groupContainer}>
            {/* Các nút hành động chính */}
            <View style={styles.groupActionRow}>
              <TouchableOpacity 
                style={styles.groupActionBtn} 
                onPress={() => setCreateModalVisible(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                <Text style={styles.groupActionBtnText}>Tạo quỹ nhóm</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.groupActionBtn, { backgroundColor: Colors.surfaceContainerHighest }]} 
                onPress={() => setJoinModalVisible(true)}
              >
                <Ionicons name="enter-outline" size={20} color={Colors.onSurface} />
                <Text style={[styles.groupActionBtnText, { color: Colors.onSurface }]}>Nhập mã mời</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Quỹ nhóm đang tham gia</Text>

            {groupLoading ? (
              <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
            ) : (
              <View style={{ gap: Spacing.md }}>
                {groupFunds.length > 0 ? (
                  groupFunds.map((g) => (
                    <TouchableOpacity 
                      key={g.id} 
                      style={styles.groupCard}
                      onPress={() => navigation.navigate('GroupFundDetail', { fund: g })}
                      activeOpacity={0.8}
                    >
                      <View style={styles.groupCardHeader}>
                        <View style={styles.groupIconBox}>
                          <Ionicons name="people" size={24} color={Colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.groupName}>{g.name}</Text>
                          <Text style={styles.groupRole} numberOfLines={1}>
                            Vai trò: {g.myRole === 'owner' ? 'Chủ quỹ 👑' : g.myRole === 'admin' ? 'Quản trị viên 🛡️' : 'Thành viên 👥'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.groupCardDivider} />
                      <View style={styles.groupCardBody}>
                        <View>
                          <Text style={styles.groupBalLabel}>Số dư hiện có</Text>
                          <Text style={styles.groupBalance}>{formatVND(g.currentBalance)}</Text>
                        </View>
                        <View style={styles.inviteBadge}>
                          <Text style={styles.inviteCodeText}>Mã: {g.inviteCode}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.groupEmptyCard}>
                    <Ionicons name="alert-circle-outline" size={48} color={Colors.onSurfaceVariant} />
                    <Text style={styles.groupEmptyText}>Bạn chưa tham gia hay quản lý quỹ nhóm nào.</Text>
                    <Text style={styles.groupEmptySub}>Hãy tạo quỹ mới hoặc xin mã mời của bạn bè để tham gia!</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        <View style={{ height: Spacing.xl + 60 }} />
      </ScrollView>

      {/* ==================== MODAL TẠO QUỸ NHÓM ==================== */}
      <Modal visible={createModalVisible} transparent animationType="slide" onRequestClose={() => setCreateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Tạo Quỹ nhóm mới 👥</Text>
            
            <AppInput label="Tên quỹ nhóm" value={groupName} onChangeText={setGroupName} placeholder="Ví dụ: Quỹ lớp K24, Quỹ bóng đá..." iconName="people-outline" />
            <AppInput label="Mô tả quỹ" value={groupDesc} onChangeText={setGroupDesc} placeholder="Mục đích sử dụng của quỹ..." iconName="document-text-outline" />
            <AppInput label="Số tiền mục tiêu (Tùy chọn)" value={targetAmount} onChangeText={setTargetAmount} placeholder="Nhập số tiền mục tiêu" keyboardType="numeric" iconName="flag-outline" />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setCreateModalVisible(false)}>
                <Text style={styles.modalBtnCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnSave]} onPress={onCreateGroupSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.modalBtnSaveText}>Tạo quỹ</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================== MODAL NHẬP MÃ MỜI ==================== */}
      <Modal visible={joinModalVisible} transparent animationType="slide" onRequestClose={() => setJoinModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Tham gia Quỹ nhóm 🤝</Text>
            
            <AppInput label="Mã mời tham gia" value={inviteCodeInput} onChangeText={setInviteCodeInput} placeholder="Nhập mã 6 ký tự (Ví dụ: A8CD8F)" autoCapitalize="characters" iconName="key-outline" />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setJoinModalVisible(false)}>
                <Text style={styles.modalBtnCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnSave]} onPress={onJoinGroupSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.modalBtnSaveText}>Tham gia</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Tạo / Sửa Lọ cá nhân */}
      <PotFormModal visible={formModalVisible} onClose={() => setFormModalVisible(false)} onSave={savePot} onDelete={(id) => { deletePot(id); setFormModalVisible(false); }} initialData={selectedPot?.isCompleted ? null : selectedPot} />

      {/* Modal Nạp / Rút Tiền cá nhân */}
      <PotActionModal visible={actionModalVisible} onClose={() => setActionModalVisible(false)} pot={selectedPot} availableBalance={availableBalance} onDeposit={(pot, amt) => depositToPot(pot, amt, addTransactionLocally)} onWithdraw={(pot, amt) => withdrawFromPot(pot, amt, addTransactionLocally)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.base },
  title: { fontFamily: Typography.fontHeadline_Bold, fontSize: Typography.headlineMd, color: Colors.onSurface, letterSpacing: Typography.tightTracking },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },
  tabContainer: { flexDirection: 'row', backgroundColor: Colors.surfaceContainerHigh, borderRadius: Spacing.radiusLg, padding: 4, marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.sm, borderRadius: Spacing.radiusMd },
  tabActive: { backgroundColor: Colors.primary, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tabIcon: { marginRight: 6 },
  tabText: { fontFamily: Typography.fontBody_Medium, fontSize: Typography.bodySm, color: Colors.onSurfaceVariant },
  tabTextActive: { color: Colors.onPrimary, fontFamily: Typography.fontBody_Bold },
  summaryCard: { backgroundColor: Colors.secondary, marginHorizontal: Spacing.lg, borderRadius: Spacing.radiusXl, padding: Spacing.xl, marginBottom: Spacing.xl },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  sumLabel: { fontFamily: Typography.fontBody_Regular, fontSize: Typography.labelMd, color: Colors.onSecondary, opacity: 0.8, marginBottom: Spacing.xs },
  sumAmount: { fontFamily: Typography.fontHeadline_ExtraBold, fontSize: Typography.displayMd, color: Colors.onSecondary, letterSpacing: Typography.tightTracking, marginBottom: 4 },
  sumOf: { fontFamily: Typography.fontBody_Regular, fontSize: Typography.bodyMd, color: Colors.onSecondary, opacity: 0.8 },
  percentCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  percentText: { fontFamily: Typography.fontHeadline_Bold, fontSize: Typography.titleMd, color: Colors.onSecondary },
  progressBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.onSecondary, borderRadius: 4 },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.base },
  sectionTitle: { fontFamily: Typography.fontHeadline_SemiBold, fontSize: Typography.headlineSm, color: Colors.onSurface, letterSpacing: Typography.tightTracking, marginBottom: Spacing.md },
  card: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Spacing.radiusLg, padding: Spacing.base, shadowColor: Colors.onSurface, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 1 },
  empty: { fontFamily: Typography.fontBody_Regular, fontSize: Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center', paddingVertical: Spacing.lg },
  
  // Group Fund Styles
  groupContainer: { paddingHorizontal: Spacing.lg },
  groupActionRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  groupActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryContainer, paddingVertical: Spacing.md, borderRadius: Spacing.radiusLg, gap: 6, elevation: 1 },
  groupActionBtnText: { fontFamily: Typography.fontBody_Bold, fontSize: Typography.bodySm, color: Colors.primary },
  groupCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Spacing.radiusLg, padding: Spacing.lg, marginBottom: Spacing.md, shadowColor: Colors.onSurface, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 1 },
  groupCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  groupIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  groupName: { fontFamily: Typography.fontHeadline_SemiBold, fontSize: Typography.bodyLg, color: Colors.onSurface },
  groupRole: { fontFamily: Typography.fontBody_Regular, fontSize: Typography.bodyXs, color: Colors.onSurfaceVariant, marginTop: 2 },
  groupCardDivider: { height: 1, backgroundColor: Colors.surfaceContainerHigh, marginVertical: Spacing.md },
  groupCardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  groupBalLabel: { fontFamily: Typography.fontBody_Regular, fontSize: Typography.bodyXs, color: Colors.onSurfaceVariant, marginBottom: 2 },
  groupBalance: { fontFamily: Typography.fontHeadline_Bold, fontSize: Typography.titleLg, color: Colors.onSurface },
  inviteBadge: { backgroundColor: Colors.secondaryContainer, paddingHorizontal: Spacing.base, paddingVertical: 4, borderRadius: Spacing.radiusFull },
  inviteCodeText: { fontFamily: Typography.fontBody_Bold, fontSize: Typography.bodyXs, color: Colors.secondary },
  groupEmptyCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Spacing.radiusLg, padding: Spacing.xxl, alignItems: 'center', shadowColor: Colors.onSurface, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 1 },
  groupEmptyText: { fontFamily: Typography.fontHeadline_SemiBold, fontSize: Typography.bodyMd, color: Colors.onSurface, textAlign: 'center', marginTop: Spacing.md, marginBottom: Spacing.xs },
  groupEmptySub: { fontFamily: Typography.fontBody_Regular, fontSize: Typography.bodyXs, color: Colors.onSurfaceVariant, textAlign: 'center', paddingHorizontal: Spacing.lg },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  modalCard: { width: '100%', backgroundColor: Colors.white, borderRadius: Spacing.radiusXl, padding: Spacing.xl, elevation: 10 },
  modalTitle: { fontFamily: Typography.fontHeadline_Bold, fontSize: Typography.titleLg, color: Colors.onSurface, marginBottom: Spacing.lg },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm, marginTop: Spacing.lg },
  modalBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: Spacing.radiusMd, minWidth: 80, alignItems: 'center', justifyContent: 'center' },
  modalBtnCancel: { backgroundColor: Colors.surfaceContainerHigh },
  modalBtnCancelText: { fontFamily: Typography.fontBody_SemiBold, color: Colors.onSurfaceVariant, fontSize: Typography.bodyMd },
  modalBtnSave: { backgroundColor: Colors.primary },
  modalBtnSaveText: { fontFamily: Typography.fontBody_SemiBold, color: Colors.white, fontSize: Typography.bodyMd },
});
import React, { useState, useMemo } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, 
  TouchableOpacity, ActivityIndicator, Alert, Platform 
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
import { formatVND } from '../../utils/currency';

export default function FundsScreen() {
  const { pots, totalSaved, totalTarget, loading, savePot, depositToPot, withdrawFromPot, completePot, deletePot } = usePots();
  const { addTransactionLocally, transactions } = useTransactions();

  // 1. TOP TAB STATE: 'personal' hoặc 'group'
  const [activeTab, setActiveTab] = useState('personal');

  // Tính số dư thực tế từ toàn bộ lịch sử giao dịch (cho nạp/rút quỹ cá nhân)
  const availableBalance = useMemo(() => {
    return transactions.reduce((balance, t) => {
      return t.type === 'income' ? balance + t.amount : balance - t.amount;
    }, 0);
  }, [transactions]);

  const [formModalVisible, setFormModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedPot, setSelectedPot] = useState(null);

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

  const showGroupDemoAlert = () => {
    Alert.alert(
      'Tính năng Quỹ Nhóm 👥',
      'Chào mừng bạn đến với module Quỹ Nhóm (Team Fund)!\n\n🚀 Tính năng này đang được thiết lập cấu trúc nền tảng và sẽ được triển khai đầy đủ trong Sprint 4 & 5 bởi chính bạn!\n\n💡 Các tính năng chính:\n• Quản lý quỹ lớp, quỹ gia đình, nhóm thể thao...\n• Mời thành viên bằng mã mời hoặc email.\n• Yêu cầu nộp tiền định kỳ & thanh toán 1 chạm mượt mà.\n• Ghi nhận khoản chi và xuất nhật ký minh bạch cho toàn bộ thành viên.',
      [{ text: 'Tuyệt vời!' }]
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header & Selector */}
      <View style={styles.header}>
        <Text style={styles.title}>Quỹ tài chính</Text>
        
        {/* Chỉ hiện nút Thêm khi ở tab cá nhân */}
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
            {/* Summary Card */}
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

            {/* Danh sách lọ */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Các lọ tiết kiệm cá nhân</Text>
              {loading ? (
                <ActivityIndicator size="large" color={Colors.secondary} style={{ marginTop: 20 }} />
              ) : (
                <View style={styles.card}>
                  {pots.length > 0 ? (
                    pots.map((p, index) => {
                      if (!p.id) console.warn(`Cảnh báo: Lọ "${p.name}" bị thiếu id!`, p);
                      return (
                        <PotItem
                          key={p.id || `pot-${index}`}
                          item={p}
                          onDeposit={() => handleDeposit(p)}
                          onEdit={() => handleEdit(p)}
                          onComplete={() => handleComplete(p)}
                          onDelete={() => handleDelete(p)}
                        />
                      );
                    })
                  ) : (
                    <Text style={styles.empty}>Chưa có lọ tiết kiệm nào. Nhấn + để tạo lọ đầu tiên!</Text>
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ==================== TAB 2: QUỸ NHÓM (PLACEHOLDER DỰNG SẴN CHO SPRINT 4 & 5) ==================== */}
        {activeTab === 'group' && (
          <View style={styles.groupContainer}>
            {/* Promo Card */}
            <View style={styles.groupPromoCard}>
              <View style={styles.groupPromoIconBox}>
                <Ionicons name="people" size={32} color={Colors.white} />
              </View>
              <Text style={styles.groupPromoTitle}>Phát triển Quỹ Nhóm ở Sprint 4 & 5! 👥</Text>
              <Text style={styles.groupPromoDesc}>
                Cho phép lập quỹ chung cho lớp học, nhóm bạn, câu lạc bộ hoặc gia đình. Thu chi rõ ràng, kiểm soát công khai, nâng tầm trải nghiệm tài chính!
              </Text>
            </View>

            {/* Features Checklist */}
            <View style={styles.featureCard}>
              <Text style={styles.featureTitle}>Các module nghiệp vụ quỹ nhóm gồm:</Text>
              
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#2E7D32" />
                <Text style={styles.featureText}>Quản lý thành viên (mời qua email / mã mời)</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#2E7D32" />
                <Text style={styles.featureText}>Tạo đợt thu quỹ định kỳ & Xác nhận 1 chạm</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#2E7D32" />
                <Text style={styles.featureText}>Ghi nhận khoản chi trực tiếp từ số dư chung</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#2E7D32" />
                <Text style={styles.featureText}>Nhật ký hoạt động (Activity Logs) công khai 100%</Text>
              </View>
            </View>

            {/* Call to Action Demo button */}
            <TouchableOpacity 
              style={styles.groupDemoBtn} 
              activeOpacity={0.8} 
              onPress={showGroupDemoAlert}
            >
              <Ionicons name="rocket-outline" size={20} color={Colors.white} style={{ marginRight: 8 }} />
              <Text style={styles.groupDemoBtnText}>Khám phá Quỹ nhóm</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: Spacing.xl + 60 }} />
      </ScrollView>

      {/* Modal Tạo / Sửa Lọ (Chỉ dùng cho Cá nhân) */}
      <PotFormModal
        visible={formModalVisible}
        onClose={() => setFormModalVisible(false)}
        onSave={savePot}
        onDelete={(id) => { deletePot(id); setFormModalVisible(false); }}
        initialData={selectedPot?.isCompleted ? null : selectedPot}
      />

      {/* Modal Nạp / Rút Tiền (Chỉ dùng cho Cá nhân) */}
      <PotActionModal
        visible={actionModalVisible}
        onClose={() => setActionModalVisible(false)}
        pot={selectedPot}
        availableBalance={availableBalance}
        onDeposit={(pot, amt) => depositToPot(pot, amt, addTransactionLocally)}
        onWithdraw={(pot, amt) => withdrawFromPot(pot, amt, addTransactionLocally)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
  },
  title: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.headlineMd,
    color: Colors.onSurface,
    letterSpacing: Typography.tightTracking,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Spacing.radiusLg,
    padding: 4,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.radiusMd,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  tabTextActive: {
    color: Colors.onPrimary,
    fontFamily: Typography.fontBody_Bold,
  },
  summaryCard: {
    backgroundColor: Colors.secondary,
    marginHorizontal: Spacing.lg,
    borderRadius: Spacing.radiusXl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  sumLabel: { fontFamily: Typography.fontBody_Regular, fontSize: Typography.labelMd, color: Colors.onSecondary, opacity: 0.8, marginBottom: Spacing.xs },
  sumAmount: { fontFamily: Typography.fontHeadline_ExtraBold, fontSize: Typography.displayMd, color: Colors.onSecondary, letterSpacing: Typography.tightTracking, marginBottom: 4 },
  sumOf: { fontFamily: Typography.fontBody_Regular, fontSize: Typography.bodyMd, color: Colors.onSecondary, opacity: 0.8 },
  percentCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  percentText: { fontFamily: Typography.fontHeadline_Bold, fontSize: Typography.titleMd, color: Colors.onSecondary },
  progressBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.onSecondary, borderRadius: 4 },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.base },
  sectionTitle: {
    fontFamily: Typography.fontHeadline_SemiBold,
    fontSize: Typography.headlineSm,
    color: Colors.onSurface,
    letterSpacing: Typography.tightTracking,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Spacing.radiusLg,
    padding: Spacing.base,
    shadowColor: Colors.onSurface,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 1,
  },
  empty: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  // Group Fund Styles
  groupContainer: {
    paddingHorizontal: Spacing.lg,
  },
  groupPromoCard: {
    backgroundColor: Colors.primary,
    borderRadius: Spacing.radiusXl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  groupPromoIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  groupPromoTitle: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.titleMd,
    color: Colors.onPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  groupPromoDesc: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodySm,
    color: Colors.onPrimary,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 20,
  },
  featureCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Spacing.radiusLg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    shadowColor: Colors.onSurface,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 1,
  },
  featureTitle: {
    fontFamily: Typography.fontHeadline_SemiBold,
    fontSize: Typography.bodyMd,
    color: Colors.onSurface,
    marginBottom: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  featureText: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodySm,
    color: Colors.onSurfaceVariant,
    marginLeft: 8,
    flex: 1,
  },
  groupDemoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: Spacing.radiusLg,
    paddingVertical: Spacing.md,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  groupDemoBtnText: {
    fontFamily: Typography.fontBody_Bold,
    fontSize: Typography.bodyMd,
    color: Colors.white,
  },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import useGroupFunds from '../../hooks/tabs/useGroupFunds';
import { formatVND } from '../../utils/currency';

const FUND_TYPE_LABEL = {
  class: 'Quỹ lớp',
  team: 'Quỹ nhóm',
  event: 'Quỹ sự kiện',
  other: 'Khác',
};

export default function GroupFundsScreen({ navigation }) {
  const { groupFunds, loading, handleCreateGroup, handleJoinGroup } = useGroupFunds();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const onSubmitCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên quỹ nhóm.');
      return;
    }

    const parsedTarget = Number(targetAmount) || null;
    await handleCreateGroup(name.trim(), description.trim(), 'team', parsedTarget);
    setCreateModalVisible(false);
    setName('');
    setDescription('');
    setTargetAmount('');
  };

  const onSubmitJoin = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập mã mời.');
      return;
    }

    await handleJoinGroup(inviteCode.trim().toUpperCase());
    setJoinModalVisible(false);
    setInviteCode('');
  };

  const openDetail = (fund) => {
    navigation.navigate('GroupFundDetail', { fund });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Quỹ nhóm</Text>
          <Text style={styles.subtitle}>Quản lý quỹ nhóm, mời thành viên và theo dõi số dư.</Text>
        </View>

        <View style={styles.actionsRow}>
          <AppButton label="Tạo quỹ mới" onPress={() => setCreateModalVisible(true)} style={[styles.actionButton, styles.actionButtonLeft]} />
          <AppButton label="Nhập mã mời" variant="secondary" onPress={() => setJoinModalVisible(true)} style={styles.actionButton} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.xl }} />
        ) : (
          <View style={styles.listContainer}>
            {groupFunds.length > 0 ? (
              groupFunds.map((fund) => (
                <TouchableOpacity key={fund.id} style={styles.fundCard} onPress={() => openDetail(fund)} activeOpacity={0.8}>
                  <View style={styles.fundHeader}>
                    <Text style={styles.fundName}>{fund.name}</Text>
                    <Text style={styles.fundRole}>{fund.myRole === 'owner' ? 'Chủ quỹ' : fund.myRole === 'admin' ? 'Admin' : 'Thành viên'}</Text>
                  </View>
                  <Text style={styles.fundType}>{FUND_TYPE_LABEL[fund.fundType] || 'Quỹ nhóm'}</Text>
                  <Text style={styles.fundBalance}>{formatVND(fund.currentBalance)}</Text>
                  <Text style={styles.fundInviteCode}>Mã mời: {fund.inviteCode}</Text>
                  {fund.targetAmount !== null && <Text style={styles.fundMeta}>Mục tiêu: {formatVND(fund.targetAmount)}</Text>}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={36} color={Colors.onSurfaceVariant} />
                <Text style={styles.emptyText}>Bạn chưa tham gia hoặc tạo quỹ nhóm nào.</Text>
                <Text style={styles.emptyHint}>Tạo quỹ mới hoặc nhập mã mời để bắt đầu.</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={createModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tạo quỹ nhóm mới</Text>
            <AppInput label="Tên quỹ" value={name} onChangeText={setName} placeholder="Nhập tên quỹ" />
            <AppInput label="Mô tả" value={description} onChangeText={setDescription} placeholder="Mô tả ngắn" />
            <AppInput label="Mục tiêu (VND)" value={targetAmount} onChangeText={setTargetAmount} placeholder="Ví dụ 5000000" keyboardType="numeric" />

            <View style={styles.modalButtons}>
              <AppButton label="Hủy" variant="secondary" onPress={() => setCreateModalVisible(false)} style={{ flex: 1, marginRight: Spacing.sm }} />
              <AppButton label="Tạo" onPress={onSubmitCreate} style={{ flex: 1 }} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={joinModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nhập mã mời</Text>
            <AppInput label="Mã mời" value={inviteCode} onChangeText={setInviteCode} placeholder="Nhập mã mời" autoCapitalize="characters" />
            <View style={styles.modalButtons}>
              <AppButton label="Hủy" variant="secondary" onPress={() => setJoinModalVisible(false)} style={{ flex: 1, marginRight: Spacing.sm }} />
              <AppButton label="Tham gia" onPress={onSubmitJoin} style={{ flex: 1 }} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  container: { padding: Spacing.lg, paddingBottom: Spacing.xl },
  header: { marginBottom: Spacing.lg },
  title: { fontFamily: Typography.fontHeadline_Bold, fontSize: Typography.headlineLg, color: Colors.onSurface, marginBottom: Spacing.xs },
  subtitle: { fontFamily: Typography.fontBody_Regular, fontSize: Typography.bodyMd, color: Colors.onSurfaceVariant, lineHeight: 22 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg },
  actionButton: { flex: 1 },
  actionButtonLeft: { marginRight: Spacing.sm },
  listContainer: {},
  fundCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Spacing.radiusXl, padding: Spacing.lg, marginBottom: Spacing.md, shadowColor: Colors.onSurface, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  fundHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  fundName: { fontFamily: Typography.fontHeadline_SemiBold, fontSize: Typography.titleMd, color: Colors.onSurface },
  fundRole: { fontFamily: Typography.fontBody_Medium, fontSize: Typography.bodySm, color: Colors.primary },
  fundType: { fontFamily: Typography.fontBody_Regular, fontSize: Typography.bodySm, color: Colors.onSurfaceVariant, marginBottom: Spacing.sm },
  fundBalance: { fontFamily: Typography.fontHeadline_Bold, fontSize: Typography.titleLg, color: Colors.onSurface, marginBottom: Spacing.sm },
  fundInviteCode: { fontFamily: Typography.fontBody_Regular, fontSize: Typography.bodySm, color: Colors.onSurfaceVariant },
  fundMeta: { marginTop: Spacing.xs, fontFamily: Typography.fontBody_Medium, fontSize: Typography.bodyMd, color: Colors.onSurface },
  emptyState: { justifyContent: 'center', alignItems: 'center', padding: Spacing.xl, borderRadius: Spacing.radiusXl, backgroundColor: Colors.surfaceContainerLowest },
  emptyText: { marginTop: Spacing.md, fontFamily: Typography.fontHeadline_Medium, fontSize: Typography.bodyMd, color: Colors.onSurface },
  emptyHint: { marginTop: Spacing.xs, fontFamily: Typography.fontBody_Regular, fontSize: Typography.bodySm, color: Colors.onSurfaceVariant, textAlign: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: Spacing.radiusXl, borderTopRightRadius: Spacing.radiusXl, padding: Spacing.lg, minHeight: 320 },
  modalTitle: { fontFamily: Typography.fontHeadline_SemiBold, fontSize: Typography.headlineSm, color: Colors.onSurface, marginBottom: Spacing.md },
  modalButtons: { flexDirection: 'row', marginTop: Spacing.lg },
});

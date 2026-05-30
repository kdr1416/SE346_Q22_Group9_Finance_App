import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import { formatVND } from '../../utils/currency';
import { fetchGroupMembers, updateMemberRoleInDB, removeMemberFromDB } from '../../services/groupFundService';

export default function GroupFundDetailScreen({ route, navigation }) {
  const { fund } = route.params;
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const myRole = fund?.myRole;
  const isOwner = myRole === 'owner';

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await fetchGroupMembers(fund.id);
      setMembers(data);
    } catch (error) {
      console.error('Lỗi tải thành viên:', error?.message || error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [fund.id]);

  const handleMemberAction = (member) => {
    if (member.role === 'owner') return;

    if (!isOwner) {
      Alert.alert('Giới hạn quyền hạn 🔒', 'Chỉ có Chủ Quỹ mới được cấp quyền Admin hoặc xóa thành viên.');
      return;
    }

    const options = [
      { text: 'Hủy', style: 'cancel' },
    ];

    if (member.role === 'member') {
      options.push({
        text: 'Cấp quyền Admin 🛡️',
        onPress: async () => {
          try {
            await updateMemberRoleInDB(member.memberId, 'admin');
            Alert.alert('Thành công', `Đã cấp quyền Quản trị viên cho ${member.name}`);
            loadMembers();
          } catch (error) {
            Alert.alert('Lỗi', error?.message || 'Không thể cập nhật quyền.');
          }
        },
      });
    } else if (member.role === 'admin') {
      options.push({
        text: 'Hạ quyền xuống Thành viên 👥',
        onPress: async () => {
          try {
            await updateMemberRoleInDB(member.memberId, 'member');
            Alert.alert('Thành công', `Đã hạ quyền ${member.name} xuống thành viên thường.`);
            loadMembers();
          } catch (error) {
            Alert.alert('Lỗi', error?.message || 'Không thể cập nhật quyền.');
          }
        },
      });
    }

    options.push({
      text: 'Xóa khỏi quỹ ❌',
      style: 'destructive',
      onPress: () => {
        Alert.alert(
          'Xác nhận xóa',
          `Bạn có chắc chắn muốn xóa ${member.name} khỏi quỹ nhóm không?`,
          [
            { text: 'Hủy', style: 'cancel' },
            {
              text: 'Đồng ý xóa',
              style: 'destructive',
              onPress: async () => {
                try {
                  await removeMemberFromDB(member.memberId);
                  Alert.alert('Thành công', `Đã xóa ${member.name} khỏi nhóm.`);
                  loadMembers();
                } catch (error) {
                  Alert.alert('Lỗi', error?.message || 'Không thể xóa thành viên.');
                }
              },
            },
          ]
        );
      },
    });

    Alert.alert('Quản lý Thành viên ⚙️', `Lựa chọn hành động với ${member.name}:`, options);
  };

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
          <Text style={styles.label}>Số dư Quỹ nhóm</Text>
          <Text style={styles.balance}>{formatVND(fund.currentBalance)}</Text>
          <View style={styles.codeBadge}>
            <Text style={styles.codeText}>Mã mời: {fund.inviteCode}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mô tả quỹ</Text>
          <Text style={styles.description}>{fund.description || 'Không có mô tả cho quỹ nhóm này.'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thành viên ({members.length})</Text>
          {isOwner && <Text style={styles.hintText}>💡 Bạn là Chủ Quỹ. Chạm vào thành viên để cấp quyền Admin hoặc xóa khỏi nhóm.</Text>}

          {loading ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: Spacing.sm }} />
          ) : (
            <View style={styles.membersList}>
              {members.map((member) => (
                <TouchableOpacity
                  key={member.memberId}
                  style={styles.memberRow}
                  onPress={() => handleMemberAction(member)}
                  disabled={member.role === 'owner'}
                  activeOpacity={0.7}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{member.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberRole}>
                      Vai trò: {member.role === 'owner' ? 'Chủ quỹ 👑' : member.role === 'admin' ? 'Quản trị viên 🛡️' : 'Thành viên 👥'}
                    </Text>
                  </View>
                  {isOwner && member.role !== 'owner' ? (
                    <Ionicons name="ellipsis-vertical" size={16} color={Colors.onSurfaceVariant} />
                  ) : (
                    <Ionicons name="ribbon" size={20} color="#F59E0B" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.base },
  title: { fontFamily: Typography.fontHeadline_Bold, fontSize: Typography.headlineSm, color: Colors.onSurface, flex: 1, textAlign: 'center', marginHorizontal: Spacing.md },
  container: { padding: Spacing.lg },
  balanceCard: { backgroundColor: Colors.primary, borderRadius: Spacing.radiusXl, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.lg },
  label: { fontFamily: Typography.fontBody_Regular, fontSize: Typography.bodySm, color: Colors.onPrimary, opacity: 0.85 },
  balance: { fontFamily: Typography.fontHeadline_ExtraBold, fontSize: Typography.displayLg, color: Colors.onPrimary, marginVertical: Spacing.sm },
  codeBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Spacing.radiusFull },
  codeText: { fontFamily: Typography.fontBody_Bold, fontSize: Typography.bodySm, color: Colors.onPrimary },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { fontFamily: Typography.fontHeadline_SemiBold, fontSize: Typography.headlineSm, color: Colors.onSurface, marginBottom: Spacing.sm },
  description: { fontFamily: Typography.fontBody_Regular, fontSize: Typography.bodyMd, color: Colors.onSurfaceVariant, lineHeight: 22 },
  hintText: { fontFamily: Typography.fontBody_Regular, fontSize: Typography.bodyXs, color: Colors.onSurfaceVariant, marginBottom: Spacing.sm },
  membersList: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Spacing.radiusLg, padding: Spacing.base, elevation: 1 },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.surfaceContainerHigh },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  avatarText: { fontFamily: Typography.fontHeadline_Bold, color: Colors.white, fontSize: 16 },
  memberInfo: { flex: 1 },
  memberName: { fontFamily: Typography.fontHeadline_SemiBold, fontSize: Typography.bodyMd, color: Colors.onSurface },
  memberRole: { fontFamily: Typography.fontBody_Regular, fontSize: Typography.bodyXs, color: Colors.onSurfaceVariant },
});

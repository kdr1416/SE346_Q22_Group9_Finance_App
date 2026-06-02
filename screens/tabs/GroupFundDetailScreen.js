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
  RefreshControl,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
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
    fundDetail,
    members,
    pendingRequests,
    paymentRequests,
    expenses,
    activityLogs,
    stats,
    chartData,
    loading,
    activeSection,
    setActiveSection,
    myRole,
    isOwner,
    isAdminOrOwner,
    refreshAll,
    handleApproveJoin,
    handleRejectJoin,
    handleCreatePaymentRequest,
    handleSubmitPayment,
    handleConfirmPayment,
    handleCreateExpense,
    handleApproveExpense,
    handleRejectExpense,
    handleUpdateFund,
    handleLeaveGroup,
    handleCloseGroup,
    handleStopPaymentRequest,
    loadRequestMembers,
  } = useGroupFundDetail(fund);

  const [logSearchQuery, setLogSearchQuery] = useState('');

  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [showCreateExpense, setShowCreateExpense] = useState(false);
  const [showRequestDetail, setShowRequestDetail] = useState(null);
  const [showUpdateFund, setShowUpdateFund] = useState(false);
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

  const [updateName, setUpdateName] = useState('');
  const [updateDesc, setUpdateDesc] = useState('');
  const [updateTarget, setUpdateTarget] = useState('');

  // Khởi tạo thông tin cho Modal chỉnh sửa
  const initUpdateModal = () => {
    setUpdateName(fundDetail?.name || fund.name);
    setUpdateDesc(fundDetail?.description || fund.description || '');
    setUpdateTarget(fundDetail?.targetAmount ? String(fundDetail.targetAmount) : '');
    setShowUpdateFund(true);
  };

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
            await updateMemberRoleInDB(member.memberId, member.role === 'admin' ? 'member' : 'admin', fund.id, user.id, member.name);
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
            await removeMemberFromDB(member.memberId, fund.id, user.id, member.name);
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

  const updateFund = async () => {
    if (!updateName.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên quỹ nhóm.');
      return;
    }
    setSubmitting(true);
    try {
      await handleUpdateFund(updateName.trim(), updateDesc.trim(), updateTarget ? Number(updateTarget) : null);
      setShowUpdateFund(false);
      Alert.alert('Thành công', 'Đã cập nhật thông tin quỹ nhóm.');
    } catch (error) {
      Alert.alert('Lỗi', error?.message || 'Không thể cập nhật thông tin.');
    } finally {
      setSubmitting(false);
    }
  };

  const sections = [
    { key: 'overview', label: 'Tổng quan', icon: 'pie-chart-outline' },
    { key: 'requests', label: 'Thu quỹ', icon: 'cash-outline' },
    { key: 'expenses', label: 'Chi quỹ', icon: 'cart-outline' },
    { key: 'logs', label: 'Lịch sử', icon: 'time-outline' },
  ];

  const filteredLogs = (activityLogs || []).filter(log =>
    log.description?.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
    log.actorName?.toLowerCase().includes(logSearchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{fundDetail?.name || fund?.name || 'Chi tiết quỹ'}</Text>
        {isOwner ? (
          <TouchableOpacity onPress={initUpdateModal}>
            <Ionicons name="settings-outline" size={24} color={Colors.onSurface} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshAll} tintColor={Colors.primary} />
        }
      >
        <View style={[styles.balanceCard, fundDetail?.status === 'closed' && styles.balanceCardClosed]}>
          <View style={styles.balanceHeaderRow}>
            <Text style={styles.balanceLabel}>Số dư Quỹ nhóm</Text>
            {fundDetail?.status === 'closed' && (
              <View style={styles.closedBadge}>
                <Ionicons name="lock-closed" size={10} color="#fff" style={{ marginRight: 4 }} />
                <Text style={styles.closedBadgeText}>Đã đóng</Text>
              </View>
            )}
          </View>
          <Text style={styles.balanceValue}>{formatVND(fundDetail?.currentBalance ?? fund.currentBalance)}</Text>
          <TouchableOpacity
            style={styles.codeBadge}
            onPress={async () => {
              const code = fundDetail?.inviteCode || fund.inviteCode;
              await Clipboard.setStringAsync(code);
              Alert.alert('Đã sao chép 📋', `Mã mời "${code}" đã được sao chép vào bộ nhớ tạm.`);
            }}
          >
            <Text style={styles.codeText}>Mã mời: {fundDetail?.inviteCode || fund.inviteCode} 📋</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={styles.tabRow}
        >
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
        </ScrollView>

        {activeSection === 'overview' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tổng quan tài chính</Text>
            
            {/* Hàng tóm tắt số liệu */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <View style={styles.summaryIconContainer}>
                  <Ionicons name="trending-up" size={20} color="#2E7D32" />
                </View>
                <Text style={styles.summaryLabel}>Tổng thu</Text>
                <Text style={[styles.summaryValue, { color: '#2E7D32' }]}>
                  {formatVND(stats?.totalIncome || 0)}
                </Text>
              </View>

              <View style={styles.summaryCard}>
                <View style={[styles.summaryIconContainer, { backgroundColor: '#FFEBEE' }]}>
                  <Ionicons name="trending-down" size={20} color="#C62828" />
                </View>
                <Text style={styles.summaryLabel}>Tổng chi</Text>
                <Text style={[styles.summaryValue, { color: '#C62828' }]}>
                  {formatVND(stats?.totalExpense || 0)}
                </Text>
              </View>
            </View>

            {/* Chi tiết cơ cấu chi tiêu (Donut Chart) */}
            <View style={styles.card}>
              <Text style={styles.cardHeaderTitle}>Cơ cấu chi tiêu</Text>
              {stats?.expenseBreakdown?.length === 0 ? (
                <View style={styles.emptyChartContainer}>
                  <Ionicons name="pie-chart-outline" size={48} color={Colors.outline} />
                  <Text style={styles.emptyChartText}>Chưa có khoản chi tiêu nào được duyệt</Text>
                </View>
              ) : (
                <View style={styles.chartContentRow}>
                  {/* SVG Donut Chart */}
                  <View style={styles.donutWrapper}>
                    <Svg width={140} height={140} viewBox="0 0 140 140">
                      <G rotation="-90" origin="70, 70">
                        {(() => {
                          const totalSpent = stats?.expenseBreakdown.reduce((sum, item) => sum + item.spent, 0) || 1;
                          const radius = 50;
                          const strokeWidth = 12;
                          const circumference = 2 * Math.PI * radius;
                          let currentAngle = 0;

                          return stats?.expenseBreakdown.map((item, index) => {
                            const percentage = item.spent / totalSpent;
                            const strokeLength = percentage * circumference;
                            const strokeOffset = circumference - (strokeLength + currentAngle);
                            currentAngle += strokeLength;

                            return (
                              <Circle
                                key={index}
                                cx={70}
                                cy={70}
                                r={radius}
                                fill="transparent"
                                stroke={item.color || '#cccccc'}
                                strokeWidth={strokeWidth}
                                strokeDasharray={`${strokeLength} ${circumference}`}
                                strokeDashoffset={strokeOffset}
                                strokeLinecap="round"
                              />
                            );
                          });
                        })()}
                        {/* Lớp nền trong suốt tạo khuyết ở giữa */}
                        <Circle cx={70} cy={70} r={43} fill={Colors.surfaceContainerLowest || '#ffffff'} />
                      </G>
                    </Svg>
                    <View style={styles.donutTextContainer}>
                      <Text style={styles.donutLabel}>Đã chi</Text>
                      <Text style={styles.donutValue} numberOfLines={1} adjustsFontSizeToFit>
                        {formatVND(stats?.totalExpense || 0).replace('₫', '')}
                      </Text>
                      <Text style={styles.donutUnit}>VND</Text>
                    </View>
                  </View>

                  {/* Chú thích bên phải */}
                  <View style={styles.legendContainer}>
                    {stats?.expenseBreakdown.slice(0, 4).map((item, index) => {
                      const totalSpent = stats?.expenseBreakdown.reduce((sum, item) => sum + item.spent, 0) || 1;
                      const percentage = (item.spent / totalSpent) * 100;
                      return (
                        <View key={index} style={styles.legendItem}>
                          <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                          <View style={styles.legendInfo}>
                            <Text style={styles.legendLabel} numberOfLines={1}>{item.category}</Text>
                            <Text style={styles.legendValue}>{percentage.toFixed(1)}%</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* Thống kê thu chi 6 tháng gần nhất */}
            <View style={styles.card}>
              <Text style={styles.cardHeaderTitle}>Thu chi 6 tháng gần nhất</Text>
              {chartData?.length === 0 ? (
                <View style={styles.emptyChartContainer}>
                  <Ionicons name="bar-chart-outline" size={48} color={Colors.outline} />
                  <Text style={styles.emptyChartText}>Chưa có dữ liệu giao dịch</Text>
                </View>
              ) : (
                <View style={styles.barChartContainer}>
                  <View style={styles.chartYAxis}>
                    <Text style={styles.yAxisLabel}>{formatVND(Math.max(...chartData.map(d => Math.max(d.income, d.expense)), 100000) / 2).replace('₫', '')}</Text>
                    <Text style={styles.yAxisLabel}>0</Text>
                  </View>
                  
                  <View style={styles.barsContainer}>
                    {chartData.map((d, index) => {
                      const maxVal = Math.max(...chartData.map(item => Math.max(item.income, item.expense)), 100000);
                      const incomeHeight = (d.income / maxVal) * 100;
                      const expenseHeight = (d.expense / maxVal) * 100;

                      return (
                        <View key={index} style={styles.barColumn}>
                          <View style={styles.barPairContainer}>
                            <View style={styles.barWrapper}>
                              <View style={[styles.trendBar, { height: `${incomeHeight}%`, backgroundColor: '#2E7D32' }]} />
                            </View>
                            <View style={styles.barWrapper}>
                              <View style={[styles.trendBar, { height: `${expenseHeight}%`, backgroundColor: '#C62828' }]} />
                            </View>
                          </View>
                          <Text style={styles.barLabel}>{d.monthLabel}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
              {/* Chú thích màu sắc biểu đồ cột */}
              <View style={styles.barLegendRow}>
                <View style={styles.barLegendItem}>
                  <View style={[styles.legendDotMini, { backgroundColor: '#2E7D32' }]} />
                  <Text style={styles.barLegendText}>Khoản thu</Text>
                </View>
                <View style={styles.barLegendItem}>
                  <View style={[styles.legendDotMini, { backgroundColor: '#C62828' }]} />
                  <Text style={styles.barLegendText}>Khoản chi</Text>
                </View>
              </View>
            </View>

            {/* Top đóng góp 🏆 */}
            <View style={styles.card}>
              <Text style={styles.cardHeaderTitle}>Thành viên đóng góp tích cực 🏆</Text>
              {stats?.topContributors?.length === 0 ? (
                <Text style={styles.emptyTextMini}>Chưa có đóng góp nào được ghi nhận.</Text>
              ) : (
                stats?.topContributors.map((c, idx) => (
                  <View key={c.id} style={styles.contributorRow}>
                    <View style={[styles.rankBadge, idx === 0 ? styles.rank1 : idx === 1 ? styles.rank2 : idx === 2 ? styles.rank3 : null]}>
                      <Text style={styles.rankText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.contributorName}>{c.name}</Text>
                    <Text style={styles.contributorAmount}>{formatVND(c.totalAmount)}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {activeSection === 'requests' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Yêu cầu thu quỹ</Text>
              {isAdminOrOwner && fundDetail?.status === 'active' && (
                <AppButton label="Tạo mới" onPress={() => setShowCreateRequest(true)} style={styles.smallActionButton} />
              )}
            </View>
            {paymentRequests.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="cash-outline" size={48} color={Colors.outline} />
                <Text style={styles.emptyStateTitle}>Chưa có yêu cầu thu quỹ</Text>
                <Text style={styles.emptyStateSubtitle}>Các yêu cầu thu đóng góp sẽ xuất hiện ở đây.</Text>
              </View>
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
                  
                  {/* Thanh tiến trình Progress Bar */}
                  {request.totalExpectedAmount > 0 && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { 
                          width: `${Math.min((request.totalCollectedAmount / request.totalExpectedAmount) * 100, 100)}%` 
                        }]} />
                      </View>
                      <Text style={styles.progressPercentText}>
                        {Math.round((request.totalCollectedAmount / request.totalExpectedAmount) * 100)}%
                      </Text>
                    </View>
                  )}
                  
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
              {fundDetail?.status === 'active' && (
                <AppButton label="Tạo mới" onPress={() => setShowCreateExpense(true)} style={styles.smallActionButton} />
              )}
            </View>
            {expenses.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="cart-outline" size={48} color={Colors.outline} />
                <Text style={styles.emptyStateTitle}>Chưa có khoản chi nào</Text>
                <Text style={styles.emptyStateSubtitle}>Các đề xuất hoặc giao dịch chi sẽ hiển thị ở đây.</Text>
              </View>
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
            
            {/* Ô tìm kiếm lịch sử hoạt động */}
            <View style={styles.searchBarContainer}>
              <Ionicons name="search" size={18} color={Colors.onSurfaceVariant} style={styles.searchIcon} />
              <AppInput
                placeholder="Tìm kiếm hoạt động..."
                value={logSearchQuery}
                onChangeText={setLogSearchQuery}
                containerStyle={styles.searchContainerOverride}
              />
            </View>

            {filteredLogs.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="search-outline" size={48} color={Colors.outline} />
                <Text style={styles.emptyStateTitle}>Không tìm thấy hoạt động</Text>
                <Text style={styles.emptyStateSubtitle}>Thử tìm kiếm với từ khóa khác xem sao nhé.</Text>
              </View>
            ) : (
              filteredLogs.map((log) => (
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

        {/* ===== YÊU CẦU THAM GIA CHỜ DUYỆT ===== */}
        {isAdminOrOwner && pendingRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔔 Yêu cầu tham gia ({pendingRequests.length})</Text>
            {pendingRequests.map((req) => (
              <View key={req.memberId} style={[styles.card, { flexDirection: 'row', alignItems: 'center' }]}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{req.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{req.name}</Text>
                  <Text style={styles.memberRole}>Đang chờ duyệt</Text>
                </View>
                <TouchableOpacity
                  style={[styles.actionButtonMini, styles.actionApprove]}
                  onPress={() => handleApproveJoin(req.memberId, req.name)}
                >
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButtonMini, styles.actionReject, { marginLeft: 6 }]}
                  onPress={() => handleRejectJoin(req.memberId, req.name)}
                >
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ===== DANH SÁCH THÀNH VIÊN ===== */}
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
                  <Text style={styles.memberRole}>{member.role === 'owner' ? 'Chủ quỹ 👑' : member.role === 'admin' ? 'Admin 🛡️' : 'Thành viên 👥'}</Text>
                </View>
                {isOwner && member.role !== 'owner' && <Ionicons name="ellipsis-vertical" size={16} color={Colors.onSurfaceVariant} />}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* ===== HÀNH ĐỘNG HÀNH CHÍNH QUỸ ===== */}
        <View style={[styles.section, { marginTop: Spacing.sm }]}>
          {isOwner && fundDetail?.status === 'active' && (
            <AppButton
              label="Đóng quỹ nhóm"
              variant="secondary"
              onPress={() => {
                Alert.alert(
                  'Xác nhận đóng quỹ 🔒',
                  'Bạn có chắc chắn muốn đóng quỹ nhóm này? Thao tác này sẽ vô hiệu hóa mọi khoản thu và chi mới.',
                  [
                    { text: 'Hủy', style: 'cancel' },
                    {
                      text: 'Đóng quỹ',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await handleCloseGroup();
                          Alert.alert('Thành công', 'Đã đóng quỹ nhóm.');
                        } catch (err) {
                          Alert.alert('Lỗi', err.message);
                        }
                      }
                    }
                  ]
                );
              }}
              style={styles.dangerButton}
            />
          )}

          {!isOwner && (
            <AppButton
              label="Rời khỏi quỹ nhóm"
              variant="secondary"
              onPress={() => {
                Alert.alert(
                  'Xác nhận rời quỹ 🚪',
                  'Bạn có chắc chắn muốn rời khỏi quỹ nhóm này không?',
                  [
                    { text: 'Hủy', style: 'cancel' },
                    {
                      text: 'Rời nhóm',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await handleLeaveGroup();
                          Alert.alert('Thành công', 'Bạn đã rời khỏi quỹ nhóm.');
                          navigation.goBack();
                        } catch (err) {
                          Alert.alert('Lỗi', err.message);
                        }
                      }
                    }
                  ]
                );
              }}
              style={styles.dangerButton}
            />
          )}
        </View>
      </ScrollView>

      {/* Modal tạo yêu cầu nộp quỹ */}
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

      {/* Modal tạo khoản chi */}
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

      {/* Modal cập nhật thông tin quỹ */}
      <Modal visible={showUpdateFund} animationType="slide" transparent onRequestClose={() => setShowUpdateFund(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cập nhật thông tin quỹ</Text>
            <AppInput label="Tên quỹ nhóm" value={updateName} onChangeText={setUpdateName} placeholder="Nhập tên quỹ" />
            <AppInput label="Mô tả" value={updateDesc} onChangeText={setUpdateDesc} placeholder="Nhập mô tả" />
            <AppInput label="Mục tiêu nộp (tùy chọn)" value={updateTarget} onChangeText={setUpdateTarget} placeholder="Ví dụ: 5000000" keyboardType="numeric" />
            <View style={styles.modalButtons}>
              <AppButton label="Hủy" variant="secondary" onPress={() => setShowUpdateFund(false)} style={{ flex: 1, marginRight: Spacing.sm }} />
              <AppButton label="Cập nhật" onPress={updateFund} style={{ flex: 1 }} loading={submitting} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal chi tiết yêu cầu nộp */}
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
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md }}>
              <Text style={[styles.modalMeta, { marginBottom: 0 }]}>Trạng thái: {showRequestDetail?.status === 'collecting' ? 'Đang thu' : 'Hoàn tất'}</Text>
              {isAdminOrOwner && showRequestDetail?.status === 'collecting' && (
                <TouchableOpacity
                  style={styles.stopRequestButton}
                  onPress={() => {
                    Alert.alert(
                      'Dừng yêu cầu thu quỹ 🔒',
                      'Bạn có chắc chắn muốn dừng yêu cầu thu quỹ này không? Sau khi dừng, thành viên khác sẽ không thể tiếp tục nộp tiền.',
                      [
                        { text: 'Hủy', style: 'cancel' },
                        {
                          text: 'Dừng thu',
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              await handleStopPaymentRequest(showRequestDetail.id, showRequestDetail.title);
                              setShowRequestDetail(null);
                              Alert.alert('Thành công', 'Đã dừng yêu cầu thu quỹ.');
                            } catch (err) {
                              Alert.alert('Lỗi', err.message);
                            }
                          }
                        }
                      ]
                    );
                  }}
                >
                  <Ionicons name="stop-circle" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                  <Text style={styles.stopRequestButtonText}>Dừng thu</Text>
                </TouchableOpacity>
              )}
            </View>

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
                      <Text style={styles.memberRole}>Trạng thái: {item.status === 'unpaid' ? 'Chưa đóng' : item.status === 'pending_confirm' ? 'Chờ xác nhận' : 'Đã đóng'}</Text>
                      <Text style={styles.memberMeta}>Nợ: {formatVND(item.amountDue)} · Đã đóng: {formatVND(item.amountPaid)}</Text>
                    </View>
                    {user?.id === item.userId && item.status === 'unpaid' && (
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
  balanceCardClosed: { backgroundColor: '#9E9E9E' },
  balanceHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs },
  closedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Spacing.radiusFull },
  closedBadgeText: { fontFamily: Typography.fontBody_Bold, fontSize: 10, color: Colors.surface },
  balanceLabel: { fontFamily: Typography.fontBody_Regular, color: Colors.onPrimary },
  balanceValue: { fontFamily: Typography.fontHeadline_ExtraBold, fontSize: Typography.displayLg, color: Colors.onPrimary, marginBottom: Spacing.sm },
  balanceMeta: { fontFamily: Typography.fontBody_Regular, color: Colors.onPrimary, opacity: 0.9 },
  codeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Spacing.radiusMd,
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  codeText: {
    fontFamily: Typography.fontBody_Bold,
    fontSize: Typography.bodySm,
    color: '#ffffff',
  },
  tabScroll: { marginBottom: Spacing.lg, maxHeight: 48 },
  tabRow: { flexDirection: 'row', paddingRight: Spacing.lg },
  tabButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Spacing.radiusLg, backgroundColor: Colors.surfaceContainerLowest, marginRight: Spacing.sm },
  tabButtonActive: { backgroundColor: Colors.primary },
  tabLabel: { marginLeft: Spacing.xs, fontFamily: Typography.fontBody_Medium, color: Colors.onSurfaceVariant },
  tabLabelActive: { color: Colors.surface },
  
  // Dashboard & Statistics Styles
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: Spacing.lg },
  summaryCard: { flex: 1, backgroundColor: Colors.surfaceContainerLowest, borderRadius: Spacing.radiusXl, padding: Spacing.lg, alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  summaryIconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  summaryLabel: { fontSize: 12, color: Colors.onSurfaceVariant, fontFamily: Typography.fontBody_Regular },
  summaryValue: { fontSize: 16, fontFamily: Typography.fontHeadline_Bold, marginTop: Spacing.xs },
  cardHeaderTitle: { fontFamily: Typography.fontHeadline_SemiBold, fontSize: Typography.bodyMd, color: Colors.onSurface, marginBottom: Spacing.lg },
  emptyChartContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xl },
  emptyChartText: { fontFamily: Typography.fontBody_Regular, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: Spacing.sm },
  chartContentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  donutWrapper: { width: 140, height: 140, justifyContent: 'center', alignItems: 'center' },
  donutTextContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center', width: 80, height: 80 },
  donutLabel: { fontSize: 10, color: Colors.onSurfaceVariant, fontFamily: Typography.fontBody_Regular },
  donutValue: { fontSize: 14, fontFamily: Typography.fontHeadline_Bold, color: Colors.onSurface, marginVertical: 2 },
  donutUnit: { fontSize: 8, color: Colors.onSurfaceVariant, fontFamily: Typography.fontBody_Regular },
  legendContainer: { flex: 1, marginLeft: Spacing.lg, gap: Spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  colorDot: { width: 8, height: 8, borderRadius: 4, marginRight: Spacing.xs },
  legendInfo: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  legendLabel: { fontSize: 11, fontFamily: Typography.fontBody_Regular, color: Colors.onSurface, flex: 1, marginRight: Spacing.xs },
  legendValue: { fontSize: 11, fontFamily: Typography.fontBody_Bold, color: Colors.onSurfaceVariant },
  
  // Bar Chart Styles
  barChartContainer: { flexDirection: 'row', height: 160, alignItems: 'flex-end', paddingTop: Spacing.md },
  chartYAxis: { justifyContent: 'space-between', height: '100%', paddingRight: Spacing.sm, borderRightWidth: 1, borderRightColor: Colors.surfaceContainerHigh, width: 60 },
  yAxisLabel: { fontSize: 8, color: Colors.onSurfaceVariant, fontFamily: Typography.fontBody_Regular, textAlign: 'right' },
  barsContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', height: '100%', alignItems: 'flex-end' },
  barColumn: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' },
  barPairContainer: { flexDirection: 'row', gap: 4, alignItems: 'flex-end', height: '80%', width: '100%', justifyContent: 'center' },
  barWrapper: { height: '100%', width: 8, justifyContent: 'flex-end' },
  trendBar: { width: '100%', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  barLabel: { fontSize: 9, color: Colors.onSurfaceVariant, fontFamily: Typography.fontBody_Regular, marginTop: Spacing.xs },
  barLegendRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.lg, marginTop: Spacing.md },
  barLegendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDotMini: { width: 6, height: 6, borderRadius: 3, marginRight: Spacing.xs },
  barLegendText: { fontSize: 10, color: Colors.onSurfaceVariant, fontFamily: Typography.fontBody_Regular },
  
  // Leaderboard Styles
  emptyTextMini: { fontFamily: Typography.fontBody_Regular, fontSize: 12, color: Colors.onSurfaceVariant, textAlign: 'center' },
  contributorRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.surfaceContainerHigh },
  rankBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  rank1: { backgroundColor: '#FBC02D' },
  rank2: { backgroundColor: '#B0BEC5' },
  rank3: { backgroundColor: '#FF8A65' },
  rankText: { fontSize: 10, fontFamily: Typography.fontHeadline_Bold, color: '#fff' },
  contributorName: { flex: 1, fontFamily: Typography.fontBody_Medium, fontSize: 13, color: Colors.onSurface },
  contributorAmount: { fontFamily: Typography.fontHeadline_Bold, fontSize: 13, color: '#2E7D32' },
  
  // Search & Empty States Override Styles
  searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceContainerLowest, borderRadius: Spacing.radiusLg, paddingHorizontal: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.surfaceContainerHigh },
  searchIcon: { marginRight: Spacing.xs },
  searchContainerOverride: { flex: 1, borderBottomWidth: 0, paddingBottom: 0 },
  emptyStateContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xl * 1.5, paddingHorizontal: Spacing.xl },
  emptyStateTitle: { fontFamily: Typography.fontHeadline_SemiBold, fontSize: Typography.bodyLg, color: Colors.onSurface, marginTop: Spacing.md, marginBottom: Spacing.xs },
  emptyStateSubtitle: { fontFamily: Typography.fontBody_Regular, fontSize: Typography.bodySm, color: Colors.onSurfaceVariant, textAlign: 'center' },
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
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  progressBarBg: { flex: 1, height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  progressPercentText: { marginLeft: Spacing.sm, fontSize: 11, color: Colors.onSurfaceVariant, fontFamily: Typography.fontBody_Bold },
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
  dangerButton: { borderColor: '#EF4444' },
  stopRequestButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm, borderRadius: Spacing.radiusLg, borderWidth: 1, borderColor: '#FCA5A5' },
  stopRequestButtonText: { fontFamily: Typography.fontBody_Bold, fontSize: 11, color: '#EF4444' },
});

import { supabase } from '../lib/supabase';

/**
 * Hàm phụ trợ tự động sinh mã mời ngẫu nhiên gồm 6 ký tự viết hoa và số
 */
const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

/**
 * 1. Lấy danh sách quỹ nhóm mà một người dùng cụ thể đang tham gia
 */
export const fetchMyGroupFunds = async (userId) => {
  const { data: memberships, error: memError } = await supabase
    .from('group_fund_members')
    .select('role, status, group_funds (*)')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (memError) throw memError;

  return (memberships || [])
    .filter((m) => m.group_funds !== null)
    .map((m) => ({
      id: m.group_funds.id,
      name: m.group_funds.name,
      description: m.group_funds.description,
      fundType: m.group_funds.fund_type,
      currentBalance: Number(m.group_funds.current_balance || 0),
      targetAmount: m.group_funds.target_amount ? Number(m.group_funds.target_amount) : null,
      inviteCode: m.group_funds.invite_code,
      status: m.group_funds.status,
      myRole: m.role,
    }));
};

/**
 * 2. Tạo mới một Quỹ Nhóm
 * Đồng thời tự động thêm người tạo làm Thành viên với vai trò là 'owner'
 */
export const createGroupFund = async (ownerId, name, description, fundType, targetAmount) => {
  const inviteCode = generateInviteCode();

  const { data: newFund, error: fundError } = await supabase
    .from('group_funds')
    .insert({
      owner_id: ownerId,
      name,
      description,
      fund_type: fundType || 'team',
      target_amount: targetAmount || null,
      invite_code: inviteCode,
      current_balance: 0,
    })
    .select()
    .single();

  if (fundError) throw fundError;

  if (newFund) {
    const { error: memberError } = await supabase
      .from('group_fund_members')
      .insert({
        group_fund_id: newFund.id,
        user_id: ownerId,
        role: 'owner',
        status: 'active',
      });

    if (memberError) throw memberError;
  }

  return newFund;
};

/**
 * 3. Tham gia vào Quỹ Nhóm bằng mã mời (Invite Code)
 */
export const joinGroupFundByCode = async (userId, inviteCode) => {
  const { data: fund, error: findError } = await supabase
    .from('group_funds')
    .select('*')
    .eq('invite_code', inviteCode.trim().toUpperCase())
    .eq('status', 'active')
    .single();

  if (findError || !fund) {
    throw new Error('Mã mời không tồn tại hoặc quỹ nhóm đã bị khóa.');
  }

  const { data: existingMember } = await supabase
    .from('group_fund_members')
    .select('*')
    .eq('group_fund_id', fund.id)
    .eq('user_id', userId)
    .in('status', ['active', 'pending'])
    .maybeSingle();

  if (existingMember) {
    if (existingMember.status === 'pending') {
      throw new Error('Bạn đã gửi yêu cầu tham gia. Vui lòng chờ chủ quỹ duyệt.');
    }
    throw new Error('Bạn đã là thành viên của quỹ nhóm này rồi.');
  }

  const { error: joinError } = await supabase
    .from('group_fund_members')
    .insert({
      group_fund_id: fund.id,
      user_id: userId,
      role: 'member',
      status: 'pending',
    });

  if (joinError) throw joinError;

  return fund;
};

/**
 * 4. Lấy danh sách thành viên của một Quỹ Nhóm cùng hồ sơ hiển thị
 */
export const fetchGroupMembers = async (groupFundId) => {
  const { data: members, error } = await supabase
    .from('group_fund_members')
    .select('id, role, joined_at, profiles (id, name)')
    .eq('group_fund_id', groupFundId)
    .eq('status', 'active');

  if (error) throw error;

  return (members || []).map((m) => ({
    memberId: m.id,
    userId: m.profiles?.id,
    name: m.profiles?.name || 'Thành viên ẩn',
    role: m.role,
    joinedAt: m.joined_at,
  }));
};

/**
 * 5. [PHÂN QUYỀN] Cập nhật vai trò thành viên (Chỉ dành cho Owner)
 */
export const updateMemberRoleInDB = async (memberId, newRole) => {
  const { error } = await supabase
    .from('group_fund_members')
    .update({ role: newRole })
    .eq('id', memberId);

  if (error) throw error;
};

/**
 * 6. [PHÂN QUYỀN] Xóa thành viên ra khỏi quỹ
 */
export const removeMemberFromDB = async (memberId) => {
  const { error } = await supabase
    .from('group_fund_members')
    .update({ status: 'removed' })
    .eq('id', memberId);

  if (error) throw error;
};

// =====================================================
// SPRINT 5: THU QUỸ (Payment Requests)
// =====================================================

export const createPaymentRequest = async (
  groupFundId,
  createdBy,
  title,
  description,
  amountPerMember,
  dueDate,
  members,
) => {
  const totalExpectedAmount = amountPerMember * (members?.length || 0);

  const { data: newRequest, error: reqError } = await supabase
    .from('payment_requests')
    .insert({
      group_fund_id: groupFundId,
      created_by: createdBy,
      title,
      description,
      amount_per_member: amountPerMember,
      total_expected_amount: totalExpectedAmount,
      total_collected_amount: 0,
      due_date: dueDate || null,
      status: 'collecting',
    })
    .select()
    .single();

  if (reqError) throw reqError;

  const memberRows = (members || []).map((member) => ({
    payment_request_id: newRequest.id,
    member_id: member.memberId,
    amount_due: amountPerMember,
    amount_paid: 0,
    status: 'unpaid',
  }));

  if (memberRows.length > 0) {
    const { error: memError } = await supabase
      .from('payment_request_members')
      .insert(memberRows);

    if (memError) throw memError;
  }

  await addActivityLog(
    groupFundId,
    createdBy,
    'create_request',
    'payment_request',
    newRequest.id,
    `Tạo yêu cầu thu quỹ "${title}" — ${amountPerMember.toLocaleString('vi-VN')}đ/người`,
  );

  return newRequest;
};

export const fetchPaymentRequests = async (groupFundId) => {
  const { data, error } = await supabase
    .from('payment_requests')
    .select('*, profiles:created_by(name)')
    .eq('group_fund_id', groupFundId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((request) => ({
    id: request.id,
    title: request.title,
    description: request.description,
    amountPerMember: Number(request.amount_per_member),
    totalExpectedAmount: Number(request.total_expected_amount),
    totalCollectedAmount: Number(request.total_collected_amount),
    dueDate: request.due_date,
    status: request.status,
    createdByName: request.profiles?.name || 'Ẩn danh',
    createdAt: request.created_at,
  }));
};

/**
 * 9. Lấy chi tiết trạng thái nộp của từng thành viên trong 1 payment request
 */
export const fetchPaymentRequestMembers = async (paymentRequestId) => {
  // Bước 1: Lấy danh sách payment_request_members kèm thông tin group_fund_members
  const { data, error } = await supabase
    .from('payment_request_members')
    .select('*, group_fund_members(id, user_id, role)')
    .eq('payment_request_id', paymentRequestId);

  if (error) throw error;

  // Bước 2: Lấy tên profiles cho tất cả user_id
  const userIds = (data || [])
    .map((prm) => prm.group_fund_members?.user_id)
    .filter(Boolean);

  let profileMap = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', userIds);

    (profiles || []).forEach((p) => {
      profileMap[p.id] = p.name;
    });
  }

  return (data || []).map((prm) => ({
    id: prm.id,
    memberId: prm.member_id,
    userId: prm.group_fund_members?.user_id,
    name: profileMap[prm.group_fund_members?.user_id] || 'Ẩn danh',
    amountDue: Number(prm.amount_due),
    amountPaid: Number(prm.amount_paid),
    status: prm.status,
    submittedAt: prm.submitted_at,
    confirmedAt: prm.confirmed_at,
    note: prm.note,
  }));
};

export const submitPayment = async (paymentRequestMemberId, note) => {
  const { error } = await supabase
    .from('payment_request_members')
    .update({
      status: 'pending_confirm',
      submitted_at: new Date().toISOString(),
      note: note || null,
    })
    .eq('id', paymentRequestMemberId);

  if (error) throw error;
};

export const confirmPayment = async (
  paymentRequestMemberId,
  paymentRequestId,
  groupFundId,
  confirmedByUserId,
  amountDue,
) => {
  const { error: updateError } = await supabase
    .from('payment_request_members')
    .update({
      status: 'paid',
      amount_paid: amountDue,
      confirmed_by: confirmedByUserId,
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', paymentRequestMemberId);

  if (updateError) throw updateError;

  const { data: currentReq, error: reqError } = await supabase
    .from('payment_requests')
    .select('total_collected_amount')
    .eq('id', paymentRequestId)
    .single();

  if (reqError) throw reqError;

  const newCollected = Number(currentReq.total_collected_amount || 0) + amountDue;
  const { error: updateReqError } = await supabase
    .from('payment_requests')
    .update({ total_collected_amount: newCollected })
    .eq('id', paymentRequestId);

  if (updateReqError) throw updateReqError;

  const { data: currentFund, error: fundError } = await supabase
    .from('group_funds')
    .select('current_balance')
    .eq('id', groupFundId)
    .single();

  if (fundError) throw fundError;

  const newBalance = Number(currentFund.current_balance || 0) + amountDue;
  const { error: updateFundError } = await supabase
    .from('group_funds')
    .update({ current_balance: newBalance })
    .eq('id', groupFundId);

  if (updateFundError) throw updateFundError;

  await addActivityLog(
    groupFundId,
    confirmedByUserId,
    'confirm_payment',
    'payment_request',
    paymentRequestId,
    `Xác nhận nộp quỹ ${amountDue.toLocaleString('vi-VN')}đ`,
  );
};

// =====================================================
// SPRINT 5: CHI QUỸ (Group Expenses)
// =====================================================

export const createGroupExpense = async (
  groupFundId,
  createdBy,
  title,
  amount,
  category,
  expenseDate,
  note,
  role,
) => {
  const isApproved = role === 'owner' || role === 'admin';
  const status = isApproved ? 'approved' : 'pending';

  const { data: newExpense, error: expenseError } = await supabase
    .from('group_expenses')
    .insert({
      group_fund_id: groupFundId,
      created_by: createdBy,
      title,
      amount,
      category: category || null,
      expense_date: expenseDate || null,
      note: note || null,
      status,
    })
    .select()
    .single();

  if (expenseError) throw expenseError;

  if (isApproved) {
    const { data: currentFund, error: fundError } = await supabase
      .from('group_funds')
      .select('current_balance')
      .eq('id', groupFundId)
      .single();

    if (fundError) throw fundError;

    const newBalance = Number(currentFund.current_balance || 0) - amount;
    const { error: updateFundError } = await supabase
      .from('group_funds')
      .update({ current_balance: newBalance })
      .eq('id', groupFundId);

    if (updateFundError) throw updateFundError;
  }

  await addActivityLog(
    groupFundId,
    createdBy,
    'create_expense',
    'expense',
    newExpense.id,
    `Tạo khoản chi "${title}" — ${amount.toLocaleString('vi-VN')}đ`,
  );

  return newExpense;
};

export const fetchGroupExpenses = async (groupFundId) => {
  const { data, error } = await supabase
    .from('group_expenses')
    .select('*, profiles:created_by(name)')
    .eq('group_fund_id', groupFundId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((item) => ({
    id: item.id,
    title: item.title,
    amount: Number(item.amount),
    category: item.category,
    expenseDate: item.expense_date,
    note: item.note,
    status: item.status,
    createdByName: item.profiles?.name || 'Ẩn danh',
    createdAt: item.created_at,
  }));
};

export const approveExpense = async (expenseId, groupFundId, approvedByUserId, amount) => {
  const { error } = await supabase
    .from('group_expenses')
    .update({
      status: 'approved',
      approved_by: approvedByUserId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', expenseId);

  if (error) throw error;

  const { data: currentFund, error: fundError } = await supabase
    .from('group_funds')
    .select('current_balance')
    .eq('id', groupFundId)
    .single();

  if (fundError) throw fundError;

  const newBalance = Number(currentFund.current_balance || 0) - amount;
  const { error: updateFundError } = await supabase
    .from('group_funds')
    .update({ current_balance: newBalance })
    .eq('id', groupFundId);

  if (updateFundError) throw updateFundError;

  await addActivityLog(
    groupFundId,
    approvedByUserId,
    'approve_expense',
    'expense',
    expenseId,
    `Duyệt khoản chi ${amount.toLocaleString('vi-VN')}đ`,
  );
};

export const rejectExpense = async (expenseId, groupFundId, rejectedByUserId) => {
  const { error } = await supabase
    .from('group_expenses')
    .update({ status: 'rejected' })
    .eq('id', expenseId);

  if (error) throw error;

  await addActivityLog(
    groupFundId,
    rejectedByUserId,
    'reject_expense',
    'expense',
    expenseId,
    'Từ chối khoản chi',
  );
};

// =====================================================
// SPRINT 5: LỊCH SỬ HOẠT ĐỘNG (Activity Logs)
// =====================================================

export const addActivityLog = async (
  groupFundId,
  actorId,
  actionType,
  targetType,
  targetId,
  description,
) => {
  const { error } = await supabase
    .from('fund_activity_logs')
    .insert({
      group_fund_id: groupFundId,
      actor_id: actorId,
      action_type: actionType,
      target_type: targetType || null,
      target_id: targetId || null,
      description,
    });

  if (error) console.error('Lỗi ghi activity log:', error.message);
};

export const fetchActivityLogs = async (groupFundId) => {
  const { data, error } = await supabase
    .from('fund_activity_logs')
    .select('*, profiles:actor_id(name)')
    .eq('group_fund_id', groupFundId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data || []).map((log) => ({
    id: log.id,
    actionType: log.action_type,
    description: log.description,
    actorName: log.profiles?.name || 'Hệ thống',
    createdAt: log.created_at,
  }));
};

// =====================================================
// NÂNG CẤP: SỐ DƯ REALTIME + DUYỆT THÀNH VIÊN
// =====================================================

/**
 * 18. Lấy thông tin quỹ mới nhất (số dư realtime)
 */
export const fetchFundDetail = async (groupFundId) => {
  const { data, error } = await supabase
    .from('group_funds')
    .select('*')
    .eq('id', groupFundId)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    fundType: data.fund_type,
    currentBalance: Number(data.current_balance || 0),
    targetAmount: data.target_amount ? Number(data.target_amount) : null,
    inviteCode: data.invite_code,
    status: data.status,
  };
};

/**
 * 19. Lấy danh sách yêu cầu tham gia đang chờ duyệt
 */
export const fetchPendingJoinRequests = async (groupFundId) => {
  const { data, error } = await supabase
    .from('group_fund_members')
    .select('id, user_id, joined_at, profiles!user_id(id, name)')
    .eq('group_fund_id', groupFundId)
    .eq('status', 'pending');

  if (error) throw error;

  return (data || []).map((m) => ({
    memberId: m.id,
    userId: m.user_id,
    name: m.profiles?.name || 'Ẩn danh',
    requestedAt: m.joined_at,
  }));
};

/**
 * 20. Chủ quỹ/Admin DUYỆT yêu cầu tham gia (pending → active)
 */
export const approveJoinRequest = async (memberId, groupFundId, approvedByUserId, memberName) => {
  const { error } = await supabase
    .from('group_fund_members')
    .update({ status: 'active' })
    .eq('id', memberId);

  if (error) throw error;

  await addActivityLog(groupFundId, approvedByUserId, 'add_member', 'member', memberId,
    `Duyệt ${memberName} vào quỹ nhóm`);
};

/**
 * 21. Chủ quỹ/Admin TỪ CHỐI yêu cầu tham gia (pending → rejected)
 */
export const rejectJoinRequest = async (memberId, groupFundId, rejectedByUserId, memberName) => {
  const { error } = await supabase
    .from('group_fund_members')
    .update({ status: 'rejected' })
    .eq('id', memberId);

  if (error) throw error;

  await addActivityLog(groupFundId, rejectedByUserId, 'reject_member', 'member', memberId,
    `Từ chối ${memberName} vào quỹ nhóm`);
};

/**
 * 22. Lấy thống kê thu chi, cơ cấu và đóng góp của quỹ nhóm (Sprint 6)
 */
export const getGroupFundStats = async (groupFundId) => {
  try {
    // 1. Lấy tổng thu từ các payment_requests của quỹ
    const { data: payments, error: payError } = await supabase
      .from('payment_requests')
      .select('total_collected_amount')
      .eq('group_fund_id', groupFundId);

    if (payError) throw payError;
    const totalIncome = (payments || []).reduce((sum, p) => sum + Number(p.total_collected_amount || 0), 0);

    // 2. Lấy tổng chi từ các chi tiêu đã duyệt
    const { data: approvedExpenses, error: expError } = await supabase
      .from('group_expenses')
      .select('amount, category')
      .eq('group_fund_id', groupFundId)
      .eq('status', 'approved');

    if (expError) throw expError;
    const totalExpense = (approvedExpenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // 3. Tính toán cơ cấu chi tiêu (expenseBreakdown)
    const breakdownMap = {};
    (approvedExpenses || []).forEach((e) => {
      const cat = e.category || 'Khác';
      breakdownMap[cat] = (breakdownMap[cat] || 0) + Number(e.amount || 0);
    });

    const CATEGORY_COLORS = [
      '#3B82F6', // Xanh dương
      '#10B981', // Xanh lá
      '#F59E0B', // Cam
      '#EF4444', // Đỏ
      '#8B5CF6', // Tím
      '#EC4899', // Hồng
    ];

    const expenseBreakdown = Object.keys(breakdownMap).map((cat, idx) => ({
      category: cat,
      spent: breakdownMap[cat],
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
    })).sort((a, b) => b.spent - a.spent);

    // 4. Lấy danh sách Top Contributors (Dựa trên các khoản nộp đã duyệt)
    const { data: paidContributions, error: contError } = await supabase
      .from('payment_request_members')
      .select(`
        amount_paid,
        group_fund_members!inner (
          group_fund_id,
          profiles!inner (name)
        )
      `)
      .eq('status', 'paid')
      .eq('group_fund_members.group_fund_id', groupFundId);

    if (contError) throw contError;

    const contribMap = {};
    (paidContributions || []).forEach((c) => {
      const name = c.group_fund_members?.profiles?.name || 'Ẩn danh';
      contribMap[name] = (contribMap[name] || 0) + Number(c.amount_paid || 0);
    });

    const topContributors = Object.keys(contribMap).map((name, index) => ({
      id: index.toString(),
      name,
      totalAmount: contribMap[name],
    })).sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 5);

    return {
      totalIncome,
      totalExpense,
      expenseBreakdown,
      topContributors,
    };
  } catch (error) {
    console.error('Lỗi lấy thống kê quỹ nhóm:', error.message);
    throw error;
  }
};

/**
 * 23. Lấy dữ liệu biểu đồ thu chi 6 tháng gần nhất (Sprint 6)
 */
export const getGroupFundChartData = async (groupFundId) => {
  try {
    const chartData = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `T.${d.getMonth() + 1}`;
      chartData.push({
        label,
        year: d.getFullYear(),
        month: d.getMonth(),
        income: 0,
        expense: 0,
      });
    }

    // 1. Tính toán thu nhập theo tháng
    const { data: paidContributions, error: contError } = await supabase
      .from('payment_request_members')
      .select(`
        amount_paid,
        confirmed_at,
        group_fund_members!inner (
          group_fund_id
        )
      `)
      .eq('status', 'paid')
      .eq('group_fund_members.group_fund_id', groupFundId)
      .not('confirmed_at', 'is', null);

    if (contError) throw contError;

    (paidContributions || []).forEach((c) => {
      const dateStr = c.confirmed_at;
      if (!dateStr) return;
      const date = new Date(dateStr);
      const month = date.getMonth();
      const year = date.getFullYear();
      
      const targetMonth = chartData.find(m => m.month === month && m.year === year);
      if (targetMonth) {
        targetMonth.income += Number(c.amount_paid || 0);
      }
    });

    // 2. Tính toán chi tiêu theo tháng (Bỏ lọc strict not-null và fallback sang created_at)
    const { data: approvedExpenses, error: expError } = await supabase
      .from('group_expenses')
      .select('amount, expense_date, created_at')
      .eq('group_fund_id', groupFundId)
      .eq('status', 'approved');

    if (expError) throw expError;

    (approvedExpenses || []).forEach((e) => {
      const dateStr = e.expense_date || e.created_at;
      if (!dateStr) return;
      const date = new Date(dateStr);
      const month = date.getMonth();
      const year = date.getFullYear();
      
      const targetMonth = chartData.find(m => m.month === month && m.year === year);
      if (targetMonth) {
        targetMonth.expense += Number(e.amount || 0);
      }
    });

    return chartData.map(d => ({
      monthLabel: d.label, // Đồng bộ key monthLabel khớp với UI
      income: d.income,
      expense: d.expense,
    }));
  } catch (error) {
    console.error('Lỗi lấy dữ liệu biểu đồ quỹ:', error.message);
    throw error;
  }
};

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
export const updateMemberRoleInDB = async (memberId, newRole, groupFundId, actorId, memberName) => {
  const { error } = await supabase
    .from('group_fund_members')
    .update({ role: newRole })
    .eq('id', memberId);

  if (error) throw error;

  // Ghi log hoạt động
  if (groupFundId && actorId) {
    const actionType = newRole === 'admin' ? 'promote_admin' : 'demote_member';
    await addActivityLog(
      groupFundId,
      actorId,
      actionType,
      'member',
      memberId,
      `${newRole === 'admin' ? 'Cấp quyền Admin cho' : 'Hạ quyền'} ${memberName}`
    );
  }
};

/**
 * 6. [PHÂN QUYỀN] Xóa thành viên ra khỏi quỹ
 */
export const removeMemberFromDB = async (memberId, groupFundId, actorId, memberName) => {
  const { error } = await supabase
    .from('group_fund_members')
    .update({ status: 'removed' })
    .eq('id', memberId);

  if (error) throw error;

  // Ghi log hoạt động
  if (groupFundId && actorId) {
    await addActivityLog(
      groupFundId,
      actorId,
      'remove_member',
      'member',
      memberId,
      `Xóa ${memberName} khỏi quỹ nhóm`
    );
  }
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
  // 1. Tải toàn bộ dữ liệu cần thiết trong duy nhất 1 roundtrip đồng thời (Parallel SELECT)
  const [reqRes, memberRes] = await Promise.all([
    supabase
      .from('payment_requests')
      .select('title, total_collected_amount, group_funds(name, current_balance)')
      .eq('id', paymentRequestId)
      .single(),
    supabase
      .from('payment_request_members')
      .select('status, group_fund_members(user_id, profiles(name))')
      .eq('id', paymentRequestMemberId)
      .single()
  ]);

  if (reqRes.error) throw reqRes.error;
  if (memberRes.error) throw memberRes.error;

  // Nếu trạng thái đã là 'paid' (đã được xác nhận), kết thúc sớm để tránh tạo trùng lặp
  if (memberRes.data?.status === 'paid') {
    return;
  }

  const newCollected = Number(reqRes.data?.total_collected_amount || 0) + amountDue;
  const newBalance = Number(reqRes.data?.group_funds?.current_balance || 0) + amountDue;
  const targetUserId = memberRes.data?.group_fund_members?.user_id;
  const payerName = memberRes.data?.group_fund_members?.profiles?.name || 'Thành viên';
  const fundName = reqRes.data?.group_funds?.name || 'Quỹ nhóm';
  const requestTitle = reqRes.data?.title || 'Nộp quỹ';

  // 2. Thực hiện toàn bộ câu lệnh ghi (UPDATE, INSERT) song song trong roundtrip thứ hai
  const writePromises = [
    supabase
      .from('payment_request_members')
      .update({
        status: 'paid',
        amount_paid: amountDue,
        confirmed_by: confirmedByUserId,
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', paymentRequestMemberId),

    supabase
      .from('payment_requests')
      .update({ total_collected_amount: newCollected })
      .eq('id', paymentRequestId),

    supabase
      .from('group_funds')
      .update({ current_balance: newBalance })
      .eq('id', groupFundId),

    supabase
      .from('fund_activity_logs')
      .insert({
        group_fund_id: groupFundId,
        actor_id: confirmedByUserId,
        action_type: 'confirm_payment',
        target_type: 'payment_request',
        target_id: paymentRequestId,
        description: `Xác nhận ${payerName} nộp quỹ ${amountDue.toLocaleString('vi-VN')}đ`,
      })
  ];

  if (targetUserId) {
    writePromises.push(
      supabase
        .from('transactions')
        .insert({
          user_id: targetUserId,
          title: `Nộp quỹ: ${fundName} (${requestTitle})`,
          category: 'Khác',
          amount: amountDue,
          type: 'expense',
          icon_name: 'people-outline',
          date: new Date().toISOString(),
        })
    );
  }

  const writeResults = await Promise.all(writePromises);

  // Đảm bảo không có lỗi xảy ra ở bất kỳ tiến trình ghi nào
  for (const res of writeResults) {
    if (res.error) throw res.error;
  }
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
  // 1. Tải thông tin trạng thái chi phí và số dư quỹ nhóm song song (Parallel SELECT)
  const [expenseRes, fundRes] = await Promise.all([
    supabase
      .from('group_expenses')
      .select('status')
      .eq('id', expenseId)
      .single(),
    supabase
      .from('group_funds')
      .select('current_balance')
      .eq('id', groupFundId)
      .single()
  ]);

  if (expenseRes.error) throw expenseRes.error;
  if (fundRes.error) throw fundRes.error;

  // Nếu trạng thái đã được duyệt từ trước, kết thúc sớm để tránh trừ trùng số dư
  if (expenseRes.data?.status === 'approved') {
    return;
  }

  const newBalance = Number(fundRes.data?.current_balance || 0) - amount;

  // 2. Thực hiện toàn bộ câu lệnh ghi (UPDATE, INSERT) song song trong roundtrip thứ hai
  const writeResults = await Promise.all([
    supabase
      .from('group_expenses')
      .update({
        status: 'approved',
        approved_by: approvedByUserId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', expenseId),

    supabase
      .from('group_funds')
      .update({ current_balance: newBalance })
      .eq('id', groupFundId),

    supabase
      .from('fund_activity_logs')
      .insert({
        group_fund_id: groupFundId,
        actor_id: approvedByUserId,
        action_type: 'approve_expense',
        target_type: 'expense',
        target_id: expenseId,
        description: `Duyệt khoản chi ${amount.toLocaleString('vi-VN')}đ`,
      })
  ]);

  // Kiểm tra lỗi nếu có bất kỳ tác vụ ghi nào thất bại
  for (const res of writeResults) {
    if (res.error) throw res.error;
  }
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
 * 22. Cập nhật thông tin quỹ nhóm (Tên, mô tả, số tiền mục tiêu)
 */
export const updateGroupFundInfo = async (groupFundId, updates, userId) => {
  const { error } = await supabase
    .from('group_funds')
    .update({
      name: updates.name,
      description: updates.description,
      target_amount: updates.targetAmount || null,
    })
    .eq('id', groupFundId);

  if (error) throw error;

  await addActivityLog(groupFundId, userId, 'update_fund', 'fund', groupFundId, 'Cập nhật thông tin quỹ nhóm');
};

/**
 * 23. Rời khỏi quỹ nhóm
 */
export const leaveGroup = async (groupFundId, userId) => {
  // A. Kiểm tra chức vụ của thành viên
  const { data: member, error: checkError } = await supabase
    .from('group_fund_members')
    .select('role')
    .eq('group_fund_id', groupFundId)
    .eq('user_id', userId)
    .single();

  if (checkError) throw checkError;

  if (member?.role === 'owner') {
    throw new Error('Chủ quỹ không thể rời nhóm. Vui lòng chuyển giao quyền Chủ quỹ trước.');
  }

  // B. Cập nhật trạng thái thành viên thành 'left'
  const { error } = await supabase
    .from('group_fund_members')
    .update({ status: 'left' })
    .eq('group_fund_id', groupFundId)
    .eq('user_id', userId);

  if (error) throw error;

  await addActivityLog(groupFundId, userId, 'leave_group', 'member', null, 'Đã rời khỏi quỹ nhóm');
};

/**
 * 24. Đóng/kết thúc hoạt động của quỹ nhóm
 */
export const closeGroupFund = async (groupFundId, userId) => {
  const { error } = await supabase
    .from('group_funds')
    .update({ status: 'closed' })
    .eq('id', groupFundId);

  if (error) throw error;

  await addActivityLog(groupFundId, userId, 'close_fund', 'fund', groupFundId, 'Đã đóng quỹ nhóm');
};

/**
 * 25. Dừng yêu cầu thu quỹ (Chuyển trạng thái sang completed)
 */
export const stopPaymentRequest = async (paymentRequestId, groupFundId, userId, requestTitle) => {
  const { error } = await supabase
    .from('payment_requests')
    .update({ status: 'completed' })
    .eq('id', paymentRequestId);

  if (error) throw error;

  await addActivityLog(
    groupFundId,
    userId,
    'close_request',
    'payment_request',
    paymentRequestId,
    `Dừng yêu cầu thu quỹ "${requestTitle}"`
  );
};

/**
 * 26. Lấy thống kê tổng quan quỹ: tổng thu, tổng chi, top thành viên đóng góp, phân bổ chi tiêu
 */
export const getGroupFundStats = async (groupFundId) => {
  // A. Lấy danh sách payment requests thuộc quỹ này
  const { data: requests, error: reqError } = await supabase
    .from('payment_requests')
    .select('id')
    .eq('group_fund_id', groupFundId);

  if (reqError) throw reqError;

  const requestIds = (requests || []).map((r) => r.id);

  let prms = [];
  if (requestIds.length > 0) {
    const { data: prmsData, error: prmError } = await supabase
      .from('payment_request_members')
      .select('amount_paid, group_fund_members(user_id, profiles(name))')
      .in('payment_request_id', requestIds)
      .eq('status', 'paid');

    if (prmError) throw prmError;
    prms = prmsData || [];
  }

  // B. Lấy danh sách các khoản chi tiêu đã duyệt
  const { data: expenses, error: expError } = await supabase
    .from('group_expenses')
    .select('amount, category, title, created_at')
    .eq('group_fund_id', groupFundId)
    .eq('status', 'approved');

  if (expError) throw expError;

  const expensesList = expenses || [];

  // C. Tính tổng thu và chi
  const totalIncome = prms.reduce((sum, item) => sum + Number(item.amount_paid || 0), 0);
  const totalExpense = expensesList.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  // D. Thống kê top thành viên đóng góp
  const contributorsMap = {};
  prms.forEach((prm) => {
    const userId = prm.group_fund_members?.user_id;
    const name = prm.group_fund_members?.profiles?.name || 'Thành viên ẩn';
    if (userId) {
      if (!contributorsMap[userId]) {
        contributorsMap[userId] = { id: userId, name, totalAmount: 0 };
      }
      contributorsMap[userId].totalAmount += Number(prm.amount_paid || 0);
    }
  });

  const topContributors = Object.values(contributorsMap)
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5); // Lấy top 5 thành viên đóng góp nhiều nhất

  // E. Phân bổ chi tiêu theo danh mục (Pie breakdown)
  const categoryMap = {};
  const defaultColors = [
    '#2E7D32', // Xanh lá đậm
    '#D32F2F', // Đỏ
    '#1976D2', // Xanh dương
    '#FBC02D', // Vàng
    '#7B1FA2', // Tím
    '#E65100', // Cam
    '#0097A7', // Xanh ngọc
  ];

  expensesList.forEach((exp) => {
    const cat = exp.category || 'Khác';
    if (!categoryMap[cat]) {
      categoryMap[cat] = 0;
    }
    categoryMap[cat] += Number(exp.amount || 0);
  });

  const expenseBreakdown = Object.keys(categoryMap).map((cat, index) => ({
    category: cat,
    spent: categoryMap[cat],
    color: defaultColors[index % defaultColors.length],
  })).sort((a, b) => b.spent - a.spent);

  return {
    totalIncome,
    totalExpense,
    topContributors,
    expenseBreakdown,
  };
};

/**
 * 27. Lấy dữ liệu biểu đồ thu chi theo tháng (6 tháng gần nhất)
 */
export const getGroupFundChartData = async (groupFundId) => {
  // Lấy danh sách payment requests để tính thu nhập theo tháng
  const { data: requests, error: reqError } = await supabase
    .from('payment_requests')
    .select('id')
    .eq('group_fund_id', groupFundId);

  if (reqError) throw reqError;

  const requestIds = (requests || []).map((r) => r.id);

  let prms = [];
  if (requestIds.length > 0) {
    const { data: prmsData, error: prmError } = await supabase
      .from('payment_request_members')
      .select('amount_paid, confirmed_at')
      .in('payment_request_id', requestIds)
      .eq('status', 'paid');

    if (prmError) throw prmError;
    prms = prmsData || [];
  }

  // Lấy các khoản chi tiêu đã duyệt
  const { data: expenses, error: expError } = await supabase
    .from('group_expenses')
    .select('amount, expense_date, created_at')
    .eq('group_fund_id', groupFundId)
    .eq('status', 'approved');

  if (expError) throw expError;
  const expensesList = expenses || [];

  // Tạo nhãn 6 tháng gần nhất (định dạng Thg X)
  const monthlyData = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = `Thg ${d.getMonth() + 1}`;
    monthlyData.push({
      monthLabel: monthName,
      monthKey: `${d.getFullYear()}-${d.getMonth() + 1}`,
      income: 0,
      expense: 0,
    });
  }

  // Phân bổ thu nhập vào các tháng tương ứng
  prms.forEach((prm) => {
    const dateStr = prm.confirmed_at || new Date().toISOString();
    const date = new Date(dateStr);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const foundMonth = monthlyData.find((m) => m.monthKey === key);
    if (foundMonth) {
      foundMonth.income += Number(prm.amount_paid || 0);
    }
  });

  // Phân bổ chi tiêu vào các tháng tương ứng
  expensesList.forEach((exp) => {
    const dateStr = exp.expense_date || exp.created_at || new Date().toISOString();
    const date = new Date(dateStr);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const foundMonth = monthlyData.find((m) => m.monthKey === key);
    if (foundMonth) {
      foundMonth.expense += Number(exp.amount || 0);
    }
  });

  return monthlyData;
};

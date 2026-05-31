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

  const { data: existingMember, error: existingError } = await supabase
    .from('group_fund_members')
    .select('*')
    .eq('group_fund_id', fund.id)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingMember) {
    throw new Error('Bạn đã là thành viên của quỹ nhóm này rồi.');
  }

  const { error: joinError } = await supabase
    .from('group_fund_members')
    .insert({
      group_fund_id: fund.id,
      user_id: userId,
      role: 'member',
      status: 'active',
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

import { supabase } from '../lib/supabase';

/**
 * Kiểm tra xem giao dịch có bị khóa không.
 * Giao dịch bị khóa = được tạo tự động bởi Bill hoặc Pot, không được xóa thủ công.
 * @param {object} transaction - Object giao dịch (camelCase từ hook)
 * @returns {boolean}
 */
export const isLocked = (transaction) => {
  return !!(transaction?.linkedBillId || transaction?.linkedPotId);
};

/**
 * Tạo một giao dịch mới trong DB.
 * Single Responsibility: Đây là nguồn duy nhất để tạo transaction.
 * @param {string} userId
 * @param {object} payload - camelCase object
 * @returns {{ data: object|null, error: object|null }}
 */
export const createTransaction = async (userId, payload) => {
  const dbPayload = {
    user_id: userId,
    title: payload.title,
    category: payload.category,
    amount: payload.amount,
    type: payload.type,
    icon_name: payload.iconName || 'card-outline',
    date: payload.date || new Date().toISOString(),
    linked_bill_id: payload.linkedBillId || null,
    linked_pot_id: payload.linkedPotId || null,
  };

  const { data, error } = await supabase
    .from('transactions')
    .insert(dbPayload)
    .select()
    .single();

  return { data, error };
};

/**
 * Xóa một giao dịch trong DB (chỉ dùng cho giao dịch KHÔNG bị khóa).
 * @param {string} id
 * @returns {{ error: object|null }}
 */
export const removeTransaction = async (id) => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .match({ id });

  return { error };
};

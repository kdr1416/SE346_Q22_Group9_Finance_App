import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RichText, useEditorBridge, Toolbar } from '@10play/tentap-editor';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import useCreatePost from '../../hooks/tabs/useCreatePost';

export default function CreatePostScreen({ navigation, route }) {
  const {
    title,
    setTitle,
    postType,
    setPostType,
    selectedTopicIds,
    topics,
    imageUri,
    loading,
    submitting,
    initialContent,
    editPostId,
    pickImage,
    removeImage,
    toggleTopic,
    submitPost,
  } = useCreatePost(navigation, route);

  // Khởi tạo Rich Text Editor Tiptap
  const editor = useEditorBridge({
    placeholder: postType === 'share' 
      ? 'Chia sẻ kiến thức tài chính hoặc kinh nghiệm quản lý ví của bạn...' 
      : 'Đặt câu hỏi để cộng đồng giải đáp thắc mắc tài chính...',
    initialContent: initialContent,
  });

  // Tự động đồng bộ nội dung khi chỉnh sửa (Edit mode) tải xong dữ liệu bất đồng bộ từ DB
  useEffect(() => {
    if (editor && initialContent) {
      editor.setContent(initialContent);
    }
  }, [editor, initialContent]);

  // Xử lý gửi bài viết bằng cách lấy HTML từ Editor trước
  const handlePublish = async () => {
    if (!editor) return;
    try {
      const htmlContent = await editor.getHTML();
      await submitPost(htmlContent);
    } catch (e) {
      // Editor chưa sẵn sàng (WebView đang khởi tạo)
      console.warn('Editor chưa sẵn sàng:', e.message);
      Alert.alert('Vui lòng đợi', 'Trình soạn thảo đang tải, hãy thử lại sau giây lát.');
    }
  };

  const isEditMode = !!editPostId;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang tải nội dung bài viết...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* 1. Thanh Header tùy chỉnh */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backBtn}
          disabled={submitting}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {isEditMode 
            ? 'Chỉnh sửa bài viết' 
            : postType === 'share' 
              ? 'Tạo bài chia sẻ' 
              : 'Đặt câu hỏi'}
        </Text>

        <TouchableOpacity 
          onPress={handlePublish} 
          style={[styles.publishBtn, submitting ? styles.publishBtnDisabled : null]}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.publishBtnText}>
              {isEditMode ? 'Lưu' : 'Đăng'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Sử dụng KeyboardAvoidingView để đẩy trình soạn thảo và Toolbar lên khi bàn phím mở */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          style={styles.formContainer}
          contentContainerStyle={{ paddingBottom: Spacing.xxl }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 2. Chọn loại bài đăng (Chỉ cho phép chọn khi tạo mới) */}
          {!isEditMode && (
            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                style={[styles.typeBtn, postType === 'share' ? styles.typeBtnActive : null]}
                onPress={() => setPostType('share')}
              >
                <Ionicons 
                  name="document-text-outline" 
                  size={18} 
                  color={postType === 'share' ? Colors.white : Colors.onSurfaceVariant} 
                />
                <Text style={[styles.typeBtnLabel, postType === 'share' ? styles.typeBtnLabelActive : null]}>
                  Chia sẻ kiến thức
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeBtn, postType === 'question' ? styles.typeBtnActive : null]}
                onPress={() => setPostType('question')}
              >
                <Ionicons 
                  name="help-circle-outline" 
                  size={18} 
                  color={postType === 'question' ? Colors.white : Colors.onSurfaceVariant} 
                />
                <Text style={[styles.typeBtnLabel, postType === 'question' ? styles.typeBtnLabelActive : null]}>
                  Hỏi đáp cộng đồng
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 3. Nhập tiêu đề bài đăng */}
          <TextInput
            style={styles.titleInput}
            placeholder="Tiêu đề bài viết..."
            placeholderTextColor={Colors.outline}
            value={title}
            onChangeText={setTitle}
            maxLength={150}
            editable={!submitting}
          />

          {/* Đường gạch ngang nhỏ phân cách */}
          <View style={styles.inputDivider} />

          {/* 4. Trình soạn thảo Rich Text Editor */}
          <View style={styles.editorContainer}>
            {editor ? (
              <RichText 
                editor={editor} 
                style={styles.richTextComponent} 
              />
            ) : null}
          </View>

          {/* 5. Đính kèm hình ảnh minh họa */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Hình ảnh đính kèm</Text>
            {imageUri ? (
              <View style={styles.imageCard}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
                <TouchableOpacity 
                  style={styles.removeImageBtn} 
                  onPress={removeImage}
                  disabled={submitting}
                >
                  <Ionicons name="close" size={20} color={Colors.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.uploadBtn} 
                onPress={pickImage}
                activeOpacity={0.7}
                disabled={submitting}
              >
                <Ionicons name="image-outline" size={24} color={Colors.secondary} />
                <Text style={styles.uploadBtnLabel}>Thêm hình ảnh minh họa</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 6. Lọc gắn thẻ Chủ đề bắt buộc (BR-COM02) */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Chủ đề liên quan (Chọn ít nhất 1 nhãn)</Text>
            <View style={styles.topicsGrid}>
              {topics.map((t) => {
                const isSelected = selectedTopicIds.includes(t.id);
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.topicPill,
                      isSelected 
                        ? { backgroundColor: t.color, borderColor: t.color } 
                        : { backgroundColor: Colors.surfaceContainerLowest, borderColor: Colors.outlineVariant }
                    ]}
                    onPress={() => toggleTopic(t.id)}
                    disabled={submitting}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name={t.iconName || 'pricetag-outline'} 
                      size={14} 
                      color={isSelected ? Colors.white : t.color} 
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.topicLabel, isSelected ? styles.topicLabelActive : null]}>
                      {t.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* 7. Thanh công cụ soạn thảo Rich Text (Chỉ hiện khi bàn phím mở và editor sẵn sàng) */}
        {editor ? (
          <Toolbar 
            editor={editor} 
            activeColor={Colors.secondary}
            style={styles.richTextToolbar}
          />
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainer,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.titleMd,
    color: Colors.onSurface,
  },
  publishBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Spacing.radiusMd,
    backgroundColor: Colors.secondary, // Theme green
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 68,
  },
  publishBtnDisabled: {
    opacity: 0.6,
  },
  publishBtnText: {
    fontFamily: Typography.fontHeadline_SemiBold,
    fontSize: Typography.bodyMd,
    color: Colors.white,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Spacing.radiusLg,
    padding: 4,
    marginBottom: Spacing.md,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.radiusMd,
    gap: 6,
  },
  typeBtnActive: {
    backgroundColor: Colors.primary, // Đen thạch anh chủ đạo
  },
  typeBtnLabel: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.labelMd,
    color: Colors.onSurfaceVariant,
  },
  typeBtnLabelActive: {
    color: Colors.white,
    fontFamily: Typography.fontHeadline_SemiBold,
  },
  titleInput: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.headlineSm,
    color: Colors.onSurface,
    paddingVertical: Spacing.xs,
  },
  inputDivider: {
    height: 1,
    backgroundColor: Colors.surfaceContainer,
    marginVertical: Spacing.sm,
  },
  editorContainer: {
    minHeight: 200,
    marginBottom: Spacing.md,
  },
  richTextComponent: {
    flex: 1,
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodyMd,
    color: Colors.onSurface,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    fontFamily: Typography.fontHeadline_SemiBold,
    fontSize: Typography.bodyLg,
    color: Colors.onSurface,
    marginBottom: Spacing.sm,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    borderRadius: Spacing.radiusLg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLowest,
    gap: 8,
  },
  uploadBtnLabel: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  imageCard: {
    position: 'relative',
    borderRadius: Spacing.radiusLg,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: Spacing.radiusLg,
  },
  removeImageBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  topicPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 2,
    borderRadius: Spacing.radiusFull,
    borderWidth: 1,
  },
  topicLabel: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.labelMd,
    color: Colors.onSurface,
  },
  topicLabelActive: {
    color: Colors.white,
    fontFamily: Typography.fontHeadline_SemiBold,
  },
  richTextToolbar: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainer,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  loadingText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    marginTop: Spacing.md,
  },
});
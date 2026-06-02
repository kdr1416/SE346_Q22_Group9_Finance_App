import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

export default function CommunityProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Màn hình Hồ sơ Cộng đồng (Placeholder)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface },
  text: { fontFamily: Typography.fontBody_Medium, fontSize: Typography.bodyMd, color: Colors.onSurface },
});
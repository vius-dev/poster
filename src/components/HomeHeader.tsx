import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/theme';
import { brandColors } from '@/theme/colors';

const HomeHeader = () => {
  const { theme } = useTheme();
  return (
    <View style={[
      styles.header,
      {
        backgroundColor: theme.background + 'EE', // Semi-transparent
        borderBottomColor: theme.border
      }
    ]}>
      <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Timeline</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HomeHeader;

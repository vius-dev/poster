
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/theme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ExploreSearchBar from '@/components/ExploreSearchBar';

export default function NewMessageScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const menuItems = [
    {
      icon: 'mail-outline',
      title: 'Direct Message',
      subtitle: 'Start a private conversation',
      onPress: () => {
        router.push('/(modals)/new-dm');
      },
    },
    {
      icon: 'people-outline',
      title: 'Create Group',
      subtitle: 'Chat with multiple people',
      onPress: () => {
        router.push('/(modals)/create-group');
      },
    },
    {
      icon: 'megaphone-outline',
      title: 'Create Channel',
      subtitle: 'Broadcast messages to a wider audience',
      onPress: () => {
        router.push('/(modals)/create-channel');
      },
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary }]}>New Message</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={{ padding: 15 }}>
        <ExploreSearchBar
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            if (text.length > 0) {
              // Redirect to new-dm with query if user starts typing
              router.push({
                pathname: '/(modals)/new-dm',
                params: { q: text }
              });
            }
          }}
          placeholder="Search people"
        />
      </View>

      <ScrollView style={styles.menu}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, { borderBottomColor: theme.surface }]}
            onPress={item.onPress}
          >
            <Ionicons name={item.icon as any} size={28} color={theme.primary} style={styles.icon} />
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>{item.title}</Text>
              <Text style={[styles.menuSubtitle, { color: theme.textTertiary }]}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={theme.textTertiary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  menu: {
    marginTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    marginRight: 20,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  menuSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
});

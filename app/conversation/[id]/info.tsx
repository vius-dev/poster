
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, TextInput, Clipboard, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/theme/theme';
import { api } from '@/lib/api';
import { Conversation } from '@/types/message';
import { Ionicons } from '@expo/vector-icons';

import { CURRENT_USER_ID } from '@/lib/api';

type InfoTab = 'Info' | 'Members' | 'Media' | 'Settings';

export default function InfoScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const { id: conversationId } = useLocalSearchParams();
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<InfoTab>('Info');
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');

    useEffect(() => {
        if (typeof conversationId === 'string') {
            loadInfo(conversationId);
        }
    }, [conversationId]);

    const loadInfo = async (id: string) => {
        setLoading(true);
        try {
            const data = await api.getConversation(id);
            if (data) setConversation(data.conversation);
        } catch (error) {
            console.error('Error loading info:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !conversation) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
                    </TouchableOpacity>
                </View>
                <View style={styles.loadingContainer}>
                    <Text style={{ color: theme.textPrimary }}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const isOwner = conversation.ownerId === CURRENT_USER_ID;
    const isAdmin = conversation.adminIds?.includes(CURRENT_USER_ID) || isOwner;
    const isChannel = conversation.type === 'CHANNEL';
    const tabs: InfoTab[] = ['Info', 'Members', 'Media', 'Settings'];

    const handlePromote = async (userId: string) => {
        try {
            await api.promoteToAdmin(conversationId as string, userId);
            loadInfo(conversationId as string);
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleDemote = async (userId: string) => {
        try {
            await api.demoteFromAdmin(conversationId as string, userId);
            loadInfo(conversationId as string);
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleRemove = async (userId: string) => {
        try {
            await api.removeFromConversation(conversationId as string, userId);
            loadInfo(conversationId as string);
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleLeave = async () => {
        try {
            await api.leaveConversation(conversationId as string);
            router.replace('/(tabs)/messages');
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleDelete = async () => {
        try {
            await api.deleteConversation(conversationId as string);
            router.replace('/(tabs)/messages');
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleUpdate = async () => {
        try {
            await api.updateConversation(conversationId as string, {
                name: editName,
                description: editDescription
            });
            setIsEditing(false);
            loadInfo(conversationId as string);
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleEdit = () => {
        setEditName(conversation.name || '');
        setEditDescription(conversation.description || '');
        setIsEditing(true);
    };

    const renderInfoTab = () => (
        <ScrollView style={styles.tabContent}>
            {isEditing ? (
                <View style={styles.editSection}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>{isChannel ? 'CHANNEL NAME' : 'GROUP NAME'}</Text>
                    <View style={[styles.inputContainer, { backgroundColor: theme.surface }]}>
                        <TextInput
                            style={[styles.input, { color: theme.textPrimary }]}
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Name"
                            placeholderTextColor={theme.textTertiary}
                        />
                    </View>

                    <Text style={[styles.label, { color: theme.textSecondary, marginTop: 20 }]}>DESCRIPTION</Text>
                    <View style={[styles.inputContainer, styles.textAreaContainer, { backgroundColor: theme.surface }]}>
                        <TextInput
                            style={[styles.input, styles.textArea, { color: theme.textPrimary }]}
                            value={editDescription}
                            onChangeText={setEditDescription}
                            placeholder="Description"
                            placeholderTextColor={theme.textTertiary}
                            multiline
                        />
                    </View>

                    <View style={styles.editActions}>
                        <TouchableOpacity
                            style={[styles.editButton, { borderColor: theme.border, borderWidth: 1 }]}
                            onPress={() => setIsEditing(false)}
                        >
                            <Text style={{ color: theme.textPrimary }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.editButton, { backgroundColor: theme.primary }]}
                            onPress={handleUpdate}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={styles.infoSection}>
                    <View style={[styles.avatarContainer, { backgroundColor: theme.surface }]}>
                        <Ionicons
                            name={isChannel ? 'megaphone-outline' : 'people-outline'}
                            size={60}
                            color={theme.textSecondary}
                        />
                    </View>
                    <Text style={[styles.name, { color: theme.textPrimary }]}>{conversation.name}</Text>
                    <Text style={[styles.subtitle, { color: theme.textTertiary }]}>
                        {isChannel ? 'Broadcast Channel' : 'Group Chat'} • {conversation.participants.length} members
                    </Text>

                    {isAdmin && (
                        <TouchableOpacity style={styles.editIcon} onPress={handleEdit}>
                            <Ionicons name="pencil" size={16} color={theme.primary} />
                            <Text style={{ color: theme.primary, marginLeft: 4, fontWeight: '600' }}>Edit</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {!isEditing && conversation.description && (
                <View style={[styles.descriptionSection, { borderTopColor: theme.surface }]}>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Description</Text>
                    <Text style={[styles.description, { color: theme.textPrimary }]}>{conversation.description}</Text>
                </View>
            )}

            {!isEditing && (
                <View style={[styles.metaSection, { borderTopColor: theme.surface }]}>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Link</Text>
                    <TouchableOpacity
                        style={styles.linkContainer}
                        onPress={() => {
                            Clipboard.setString(`https://postr.app/${conversation.id}`);
                            Alert.alert('Link Copied', 'Conversation link has been copied to clipboard.');
                        }}
                    >
                        <Text style={[styles.linkText, { color: theme.primary }]}>postr.app/{conversation.id}</Text>
                        <Ionicons name="copy-outline" size={16} color={theme.primary} />
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );

    const renderMembersTab = () => (
        <View style={styles.tabContent}>
            <FlatList
                data={conversation.participants}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 15 }}
                renderItem={({ item }) => {
                    const isItemAdmin = conversation.adminIds?.includes(item.id) || conversation.ownerId === item.id;
                    const isItemOwner = conversation.ownerId === item.id;

                    return (
                        <View style={styles.memberItem}>
                            <Image source={{ uri: item.avatar }} style={styles.memberAvatar} />
                            <View style={styles.memberInfo}>
                                <Text style={[styles.memberName, { color: theme.textPrimary }]}>{item.name}</Text>
                                <Text style={[styles.memberUsername, { color: theme.textTertiary }]}>@{item.username}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {isItemAdmin && (
                                    <View style={[styles.adminBadgeContainer, { backgroundColor: theme.surface, marginRight: 8 }]}>
                                        <Text style={[styles.adminBadgeText, { color: theme.primary }]}>
                                            {isItemOwner ? 'Owner' : 'Admin'}
                                        </Text>
                                    </View>
                                )}

                                {isAdmin && item.id !== CURRENT_USER_ID && !isItemOwner && (
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (isItemAdmin && !isOwner) return; // Only owner can demote admins

                                            // Show management sheet
                                            const options = [];
                                            if (isOwner) {
                                                if (isItemAdmin) options.push({ label: 'Demote from Admin', onPress: () => handleDemote(item.id) });
                                                else options.push({ label: 'Promote to Admin', onPress: () => handlePromote(item.id) });
                                            }
                                            options.push({ label: 'Remove from Conversation', onPress: () => handleRemove(item.id), destructive: true });

                                            // For simplicity using native alert/confirm since I don't have a generic action sheet ready here locally
                                            if (isItemAdmin) {
                                                if (isOwner) {
                                                    handleDemote(item.id);
                                                }
                                            } else {
                                                handlePromote(item.id);
                                            }
                                        }}
                                    >
                                        <Ionicons name="ellipsis-vertical" size={20} color={theme.textTertiary} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    );
                }}
            />
        </View>
    );

    const renderMediaTab = () => (
        <ScrollView style={styles.tabContent} contentContainerStyle={styles.mediaGrid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <View key={i} style={[styles.mediaPlaceholder, { backgroundColor: theme.surface }]}>
                    <Ionicons name="images-outline" size={30} color={theme.textTertiary} />
                </View>
            ))}
        </ScrollView>
    );

    const renderSettingsTab = () => (
        <ScrollView style={styles.tabContent}>
            <TouchableOpacity style={[styles.actionItem, { borderTopColor: theme.surface }]}>
                <Ionicons name="notifications-outline" size={24} color={theme.textPrimary} />
                <Text style={[styles.actionText, { color: theme.textPrimary }]}>Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionItem, { borderTopColor: theme.surface }]}>
                <Ionicons name="share-outline" size={24} color={theme.textPrimary} />
                <Text style={[styles.actionText, { color: theme.textPrimary }]}>Invite Link</Text>
            </TouchableOpacity>

            {isAdmin && (
                <TouchableOpacity
                    style={[styles.actionItem, { borderTopColor: theme.surface }]}
                    onPress={handleEdit}
                >
                    <Ionicons name="create-outline" size={24} color={theme.textPrimary} />
                    <Text style={[styles.actionText, { color: theme.textPrimary }]}>Edit {isChannel ? 'Channel' : 'Group'}</Text>
                </TouchableOpacity>
            )}

            {!isOwner ? (
                <TouchableOpacity
                    style={[styles.actionItem, { borderTopColor: theme.surface }]}
                    onPress={handleLeave}
                >
                    <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
                    <Text style={[styles.actionText, { color: '#FF3B30' }]}>
                        {isChannel ? 'Leave Channel' : 'Leave Group'}
                    </Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={[styles.actionItem, { borderTopColor: theme.surface }]}
                    onPress={handleDelete}
                >
                    <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                    <Text style={[styles.actionText, { color: '#FF3B30' }]}>
                        Delete {isChannel ? 'Channel' : 'Group'}
                    </Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <View style={[styles.header, { borderBottomColor: theme.surface }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                    {isChannel ? 'Channel Info' : 'Group Info'}
                </Text>
            </View>

            {/* Tab Bar */}
            <View style={[styles.tabBar, { borderBottomColor: theme.surface }]}>
                {tabs.map((tab: InfoTab) => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        style={[
                            styles.tabItem,
                            activeTab === tab && { borderBottomColor: theme.primary }
                        ]}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === tab ? theme.primary : theme.textTertiary }
                        ]}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {activeTab === 'Info' && renderInfoTab()}
            {activeTab === 'Members' && renderMembersTab()}
            {activeTab === 'Media' && renderMediaTab()}
            {activeTab === 'Settings' && renderSettingsTab()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backButton: {
        marginRight: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    tabItem: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    tabContent: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoSection: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
    },
    descriptionSection: {
        padding: 20,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    metaSection: {
        padding: 20,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        lineHeight: 22,
    },
    linkContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    linkText: {
        fontSize: 16,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    memberAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '600',
    },
    memberUsername: {
        fontSize: 14,
    },
    adminBadgeContainer: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    adminBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    mediaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 2,
    },
    mediaPlaceholder: {
        width: '33.33%',
        aspectRatio: 1,
        borderWidth: 1,
        borderColor: 'transparent', // Space between items
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    actionText: {
        fontSize: 17,
        marginLeft: 15,
    },
    editSection: {
        padding: 20,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    inputContainer: {
        paddingHorizontal: 15,
        borderRadius: 12,
        height: 50,
        justifyContent: 'center',
    },
    input: {
        fontSize: 16,
    },
    textAreaContainer: {
        height: 120,
        paddingVertical: 10,
        alignItems: 'flex-start',
    },
    textArea: {
        width: '100%',
        textAlignVertical: 'top',
        height: '100%',
    },
    editActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 20,
    },
    editButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginLeft: 10,
    },
    editIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        padding: 8,
        borderRadius: 15,
    },
});

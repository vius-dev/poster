
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '@/lib/api';
import QuotedPost from '@/components/QuotedPost';
import { Post } from '@/types/post';
import { useEffect } from 'react';

const MAX_CHARACTERS = 280;

const ComposeScreen = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const { quotePostId } = useLocalSearchParams<{ quotePostId: string }>();
  const [text, setText] = useState('');
  const [media, setMedia] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [quotedPost, setQuotedPost] = useState<Post | null>(null);

  useEffect(() => {
    if (quotePostId) {
      const fetchQuotedPost = async () => {
        try {
          const post = await api.fetchPost(quotePostId);
          if (post) {
            setQuotedPost(post);
          }
        } catch (error) {
          console.error('Failed to fetch quoted post', error);
        }
      };
      fetchQuotedPost();
    }
  }, [quotePostId]);

  const characterCount = text.length;
  const isPostButtonDisabled = characterCount === 0 || characterCount > MAX_CHARACTERS;

  const handleCancel = () => {
    if (text.length > 0 || media.length > 0) {
      Alert.alert(
        'Discard post?',
        'Your post will be lost.',
        [
          { text: 'Keep editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ],
        { cancelable: true }
      );
    } else {
      router.back();
    }
  };

  const handlePost = async () => {
    try {
      await api.createPost({
        content: text,
        quotedPostId: quotePostId || undefined
      });
      router.back();
    } catch (error) {
      console.error('Failed to create post', error);
    }
  };

  const handlePickImage = async () => {
    if (media.length >= 4) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 4 - media.length,
      quality: 1,
    });

    if (!result.canceled) {
      setMedia([...media, ...result.assets]);
    }
  };

  const removeMedia = (uri: string) => {
    setMedia(media.filter((item) => item.uri !== uri));
  };

  const MediaPreview = () => {
    if (media.length === 0) return null;

    const renderMediaItem = (item: ImagePicker.ImagePickerAsset, containerStyle: object) => (
      <View style={containerStyle}>
        <Image source={{ uri: item.uri }} style={styles.mediaPreviewImage} />
        <TouchableOpacity onPress={() => removeMedia(item.uri)} style={styles.removeMediaButton}>
          <Ionicons name="close" size={18} color="white" />
        </TouchableOpacity>
      </View>
    );

    if (media.length === 1) {
      return <View style={styles.mediaGridContainer}>{renderMediaItem(media[0], styles.gridImage1)}</View>;
    }
    if (media.length === 2) {
      return (
        <View style={styles.mediaGridContainer}>
          {renderMediaItem(media[0], styles.gridImage2)}
          {renderMediaItem(media[1], styles.gridImage2)}
        </View>
      );
    }
    if (media.length === 3) {
      return (
        <View style={styles.mediaGridContainer}>
          {renderMediaItem(media[0], styles.gridImage3Left)}
          <View style={styles.gridImage3RightContainer}>
            {renderMediaItem(media[1], styles.gridImage3Right)}
            {renderMediaItem(media[2], styles.gridImage3Right)}
          </View>
        </View>
      );
    }
    return (
      <View style={[styles.mediaGridContainer, { flexWrap: 'wrap' }]}>
        {media.map((item) => renderMediaItem(item, styles.gridImage4))}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={handleCancel}>
          <Text style={[styles.headerButton, { color: theme.link }]}>Cancel</Text>
        </Pressable>
        <Pressable onPress={handlePost} disabled={isPostButtonDisabled}>
          <Text style={[styles.postButton, { color: isPostButtonDisabled ? theme.textTertiary : theme.link }]}>Post</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 44 + 46 : 0}
      >
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContentContainer}>
          <MediaPreview />
          <TextInput
            style={[styles.textInput, { color: theme.textPrimary }]}
            multiline
            autoFocus
            placeholder="What's happening?"
            placeholderTextColor={theme.textTertiary}
            value={text}
            onChangeText={setText}
          />
          {quotedPost && <QuotedPost post={quotedPost} />}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <View style={styles.iconRow}>
            <TouchableOpacity onPress={handlePickImage} style={styles.iconButton} disabled={media.length >= 4}>
              <Ionicons name="image-outline" size={24} color={media.length >= 4 ? theme.textTertiary : theme.link} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Text style={[styles.gifText, { color: theme.link }]}>GIF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="happy-outline" size={24} color={theme.link} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.charCount, { color: characterCount > MAX_CHARACTERS ? theme.error : theme.textTertiary }]}>
            {characterCount > 0 ? `${characterCount}/${MAX_CHARACTERS}` : ''}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 44,
    borderBottomWidth: 1,
  },
  headerButton: {
    fontSize: 16,
  },
  postButton: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  scrollContentContainer: {
    paddingTop: 10,
  },
  textInput: {
    fontSize: 18,
    minHeight: 100,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 5,
    marginRight: 15,
  },
  gifText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  charCount: {
    fontSize: 14,
  },
  mediaGridContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  gridImage1: {
    width: '100%',
    height: '100%',
  },
  gridImage2: {
    width: '50%',
    height: '100%',
    borderRightWidth: 2,
    borderColor: '#fff',
  },
  gridImage3Left: {
    width: '66.66%',
    height: '100%',
    borderRightWidth: 2,
    borderColor: '#fff',
  },
  gridImage3RightContainer: {
    width: '33.34%',
    height: '100%',
  },
  gridImage3Right: {
    width: '100%',
    height: '50%',
    borderBottomWidth: 2,
    borderColor: '#fff',
  },
  gridImage4: {
    width: '50%',
    height: '50%',
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#fff',
  },
  mediaPreviewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    position: 'absolute',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ComposeScreen;

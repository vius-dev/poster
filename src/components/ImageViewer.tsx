import React, { useState, useRef, useEffect } from 'react';
import {
    Modal,
    View,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    FlatList,
    StatusBar,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Media } from '@/types/post';

interface ImageViewerProps {
    visible: boolean;
    images: Media[];
    initialIndex: number;
    onClose: () => void;
}

const { width, height } = Dimensions.get('window');

const ImageViewer = ({ visible, images, initialIndex, onClose }: ImageViewerProps) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const flatListRef = useRef<FlatList>(null);

    // Sync internal state with props when modal opens
    useEffect(() => {
        if (visible) {
            setCurrentIndex(initialIndex);
            // Wait for layout to scroll
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                    index: initialIndex,
                    animated: false,
                });
            }, 0);
        }
    }, [visible, initialIndex]);

    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        const index = event.nativeEvent.contentOffset.x / slideSize;
        const roundIndex = Math.round(index);
        setCurrentIndex(roundIndex);
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <StatusBar hidden={true} />

                {/* Full Screen Slider */}
                <FlatList
                    ref={flatListRef}
                    data={images}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item, index) => `${item.url}-${index}`}
                    onScroll={onScroll}
                    getItemLayout={(_, index) => ({
                        length: width,
                        offset: width * index,
                        index,
                    })}
                    renderItem={({ item }) => (
                        <View style={styles.imageContainer}>
                            <Image
                                source={{ uri: item.url }}
                                style={styles.image}
                                contentFit="contain"
                                transition={200}
                            />
                        </View>
                    )}
                />

                {/* Close Button & Header */}
                <SafeAreaView style={styles.headerContainer}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color="white" />
                    </TouchableOpacity>
                    {images.length > 1 && (
                        <View style={styles.counterContainer}>
                            <Ionicons name="images" size={16} color="white" style={{ marginRight: 6 }} />
                            <View>
                                {/* Using a Text component from React Native directly for styling avoiding imports for now */}
                                <TouchableOpacity disabled>
                                    <View>
                                        <View>
                                            {/* Re-implementing simplified Text to avoid import issues or styling conflicts */}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </SafeAreaView>

                {/* Counter (Absolute Positioned Bottom or Top) */}
                {images.length > 1 && (
                    <View style={styles.pagination}>
                        {images.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    index === currentIndex ? styles.activeDot : styles.inactiveDot
                                ]}
                            />
                        ))}
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    headerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        justifyContent: 'space-between',
        zIndex: 10,
        // Add safe area padding manually if SafeAreaView doesn't handle absolute positioning effectively in all cases,
        // but SafeAreaView wrapper usually handles top notch.
    },
    closeButton: {
        padding: 15,
        marginTop: 10, // Additional logic might be needed for specific android status bars if translucent
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
        margin: 10,
    },
    imageContainer: {
        width: width,
        height: height,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    counterContainer: {
        flexDirection: 'row',
    },
    pagination: {
        position: 'absolute',
        bottom: 40,
        flexDirection: 'row',
        alignSelf: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: 'white',
    },
    inactiveDot: {
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    }
});

export default ImageViewer;

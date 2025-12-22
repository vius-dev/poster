
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';

interface MobileHeaderProps {
    onMenuPress: () => void;
}

export const MobileHeader = ({ onMenuPress }: MobileHeaderProps) => {
    const { theme } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.background, borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
            <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
                <Ionicons name="menu" size={32} color={theme.textPrimary} />
            </TouchableOpacity>
            <Image source={require('../../../assets/images/logo.png')} style={styles.logo} />
            <View style={{ width: 52 }} />{/* Spacer */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 60,
    },
    menuButton: {
        padding: 10,
    },
    logo: {
        width: 32,
        height: 32,
        resizeMode: 'contain',
    },
});

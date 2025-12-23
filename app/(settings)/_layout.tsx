
import { Stack } from 'expo-router';
import { useTheme } from '@/theme/theme';

export default function SettingsLayout() {
    const { theme } = useTheme();

    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: theme.background,
                },
                headerTintColor: theme.textPrimary,
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
                headerShadowVisible: true,
            }}
        >
            <Stack.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    headerBackTitle: 'Back',
                }}
            />
            <Stack.Screen
                name="username"
                options={{
                    title: 'Change Username',
                    headerBackTitle: 'Settings',
                }}
            />
        </Stack>
    );
}

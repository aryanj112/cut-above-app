import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';

type ColorMode = 'light' | 'dark';

type ThemeContextType = {
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
  colors: typeof Colors.light;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceColorScheme = useDeviceColorScheme();
  const [colorMode, setColorModeState] = useState<ColorMode>('light');
  const [isReady, setIsReady] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    (async () => {
      try {
        const savedMode = await AsyncStorage.getItem('colorMode');
        if (savedMode === 'light' || savedMode === 'dark') {
          setColorModeState(savedMode);
        } else {
          // Default to device color scheme
          setColorModeState(deviceColorScheme === 'dark' ? 'dark' : 'light');
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  const setColorMode = async (mode: ColorMode) => {
    try {
      await AsyncStorage.setItem('colorMode', mode);
      setColorModeState(mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const toggleColorMode = () => {
    setColorMode(colorMode === 'dark' ? 'light' : 'dark');
  };

  const colors = Colors[colorMode];

  if (!isReady) {
    return null; // Or a loading screen
  }

  return (
    <ThemeContext.Provider value={{ colorMode, setColorMode, toggleColorMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}


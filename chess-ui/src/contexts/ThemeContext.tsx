import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type BoardTheme = 'brown' | 'blue' | 'green' | 'purple' | 'night';

export const BOARD_THEMES: { id: BoardTheme; label: string; light: string; dark: string }[] = [
  { id: 'brown',  label: 'Classic',  light: '#f0d9b5', dark: '#b58863' },
  { id: 'blue',   label: 'Marine',   light: '#dee3e6', dark: '#8ca2ad' },
  { id: 'green',  label: 'Herbe',    light: '#ffffdd', dark: '#86a666' },
  { id: 'purple', label: 'Violet',   light: '#e8d8f0', dark: '#8855aa' },
  { id: 'night',  label: 'Nuit',     light: '#b0b4b8', dark: '#4a4f54' },
];

interface ThemeContextValue {
  boardTheme: BoardTheme;
  setBoardTheme: (t: BoardTheme) => void;
  analysisEnabled: boolean;
  setAnalysisEnabled: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  boardTheme: 'brown',
  setBoardTheme: () => {},
  analysisEnabled: false,
  setAnalysisEnabled: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [boardTheme, setBoardThemeState] = useState<BoardTheme>(
    () => (localStorage.getItem('boardTheme') as BoardTheme) ?? 'brown'
  );
  const [analysisEnabled, setAnalysisEnabled] = useState(false);

  const setBoardTheme = (t: BoardTheme) => {
    localStorage.setItem('boardTheme', t);
    setBoardThemeState(t);
  };

  // Apply theme class to document root
  useEffect(() => {
    const root = document.documentElement;
    BOARD_THEMES.forEach(t => root.classList.remove(`theme-${t.id}`));
    root.classList.add(`theme-${boardTheme}`);
  }, [boardTheme]);

  return (
    <ThemeContext.Provider value={{ boardTheme, setBoardTheme, analysisEnabled, setAnalysisEnabled }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

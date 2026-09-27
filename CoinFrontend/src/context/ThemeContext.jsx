import React, { createContext, useContext, useState, useEffect } from "react";
import sound from "../utils/audio";

const ThemeContext = createContext();

const THEME_STORAGE_KEY = "campusCoinTheme";

export function ThemeProvider({ children }) {
  // Whenever the website opens, it defaults to 'light' mode.
  // Within the active browsing session, user's preference is remembered in sessionStorage.
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = sessionStorage.getItem(THEME_STORAGE_KEY);
      return saved === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-theme", theme);
      document.body.setAttribute("data-theme", theme);
      sessionStorage.setItem(THEME_STORAGE_KEY, theme);
      window.dispatchEvent(
        new CustomEvent("campusCoinThemeChanged", { detail: theme })
      );
    } catch (e) {
      console.warn("Theme application warning:", e);
    }
  }, [theme]);

  const toggleTheme = () => {
    try {
      sound.playPop();
    } catch {
      // Ignore audio error
    }
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setTheme = (newTheme) => {
    if (newTheme !== "light" && newTheme !== "dark") return;
    try {
      sound.playPop();
    } catch {
      // Ignore audio error
    }
    setThemeState(newTheme);
  };

  const isDark = theme === "dark";
  const isLight = theme === "light";

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        isLight,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Graceful fallback if used outside provider
    return {
      theme: "light",
      isDark: false,
      isLight: true,
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return context;
}

export default ThemeContext;

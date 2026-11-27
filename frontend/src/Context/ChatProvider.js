import React, { createContext, useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { useColorMode } from "@chakra-ui/react";

const ChatContext = createContext();

const ChatProvider = ({ children }) => {
  const [selectedChat, setSelectedChat] = useState();
  const [user, setUser] = useState();
  const [notification, setNotification] = useState([]);
  const [chats, setChats] = useState();
  const [themeMode, setThemeModeState] = useState(
    localStorage.getItem("chat_theme_mode") || "system"
  );

  const history = useHistory();
  const { setColorMode } = useColorMode();

  // Handle Theme Switching (Light, Dark, System default)
  const changeThemeMode = (mode) => {
    setThemeModeState(mode);
    localStorage.setItem("chat_theme_mode", mode);

    if (mode === "system") {
      const isSystemDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setColorMode(isSystemDark ? "dark" : "light");
    } else {
      setColorMode(mode);
    }
  };

  useEffect(() => {
    const savedMode = localStorage.getItem("chat_theme_mode") || "system";
    setThemeModeState(savedMode);

    if (savedMode === "system") {
      const isSystemDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setColorMode(isSystemDark ? "dark" : "light");

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e) => setColorMode(e.matches ? "dark" : "light");
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
      }
    } else {
      setColorMode(savedMode);
    }
  }, [setColorMode]);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    setUser(userInfo);

    if (!userInfo) history.push("/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history]);

  return (
    <ChatContext.Provider
      value={{
        selectedChat,
        setSelectedChat,
        user,
        setUser,
        notification,
        setNotification,
        chats,
        setChats,
        themeMode,
        changeThemeMode,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const ChatState = () => {
  return useContext(ChatContext);
};

export default ChatProvider;

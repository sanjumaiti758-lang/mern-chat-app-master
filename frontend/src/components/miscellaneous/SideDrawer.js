import { Button } from "@chakra-ui/button";
import { useDisclosure } from "@chakra-ui/hooks";
import { Input } from "@chakra-ui/input";
import { Box, Text } from "@chakra-ui/layout";
import {
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
} from "@chakra-ui/menu";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
} from "@chakra-ui/modal";
import { Tooltip } from "@chakra-ui/tooltip";
import {
  BellIcon,
  ChevronDownIcon,
  MoonIcon,
  SunIcon,
  SettingsIcon,
} from "@chakra-ui/icons";
import { Avatar } from "@chakra-ui/avatar";
import { useHistory } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { useToast } from "@chakra-ui/toast";
import ChatLoading from "../ChatLoading";
import { Spinner } from "@chakra-ui/spinner";
import { IconButton, useColorMode } from "@chakra-ui/react";
import ProfileModal from "./ProfileModal";
import ThemeModal from "./ThemeModal";
import NotificationBadge from "react-notification-badge";
import { Effect } from "react-notification-badge";
import { getSender } from "../../config/ChatLogics";
import UserListItem from "../userAvatar/UserListItem";
import { ChatState } from "../../Context/ChatProvider";

function SideDrawer() {
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  const {
    setSelectedChat,
    user,
    notification,
    setNotification,
    chats,
    setChats,
    themeMode,
  } = ChatState();

  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isThemeOpen,
    onOpen: onThemeOpen,
    onClose: onThemeClose,
  } = useDisclosure();

  const history = useHistory();
  const { colorMode } = useColorMode();
  const isDark = colorMode === "dark";

  const logoutHandler = () => {
    localStorage.removeItem("userInfo");
    history.push("/");
  };

  const handleSearch = async () => {
    if (!search) {
      toast({
        title: "Please Enter something in search",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top-left",
      });
      return;
    }

    try {
      setLoading(true);

      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get(`/api/user?search=${search}`, config);

      setLoading(false);
      setSearchResult(data);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Search Results",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  const accessChat = async (userId) => {
    try {
      setLoadingChat(true);
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.post(`/api/chat`, { userId }, config);

      if (!chats.find((c) => c._id === data._id)) setChats([data, ...chats]);
      setSelectedChat(data);
      setLoadingChat(false);
      onClose();
    } catch (error) {
      toast({
        title: "Error fetching the chat",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  return (
    <>
      <Box
        d="flex"
        justifyContent="space-between"
        alignItems="center"
        bg={isDark ? "#202C33" : "white"}
        color={isDark ? "#E9EDEF" : "black"}
        w="100%"
        p="6px 14px"
        borderBottom="1px solid"
        borderColor={isDark ? "#2A3942" : "#E2E8F0"}
      >
        <Tooltip label="Search Users to chat" hasArrow placement="bottom-end">
          <Button
            variant="ghost"
            onClick={onOpen}
            colorScheme={isDark ? "whiteAlpha" : "gray"}
          >
            <i className="fas fa-search"></i>
            <Text d={{ base: "none", md: "flex" }} px={4}>
              Search User
            </Text>
          </Button>
        </Tooltip>

        <Text
          fontSize="2xl"
          fontFamily="Work sans"
          fontWeight="bold"
          letterSpacing="wide"
          color="#00A884"
        >
          Talk-A-Tive
        </Text>

        <Box d="flex" alignItems="center" gap={2}>
          {/* Theme Settings Icon Button */}
          <Tooltip label="Theme (Light / Dark / System)" hasArrow>
            <IconButton
              aria-label="Theme settings"
              variant="ghost"
              fontSize="lg"
              icon={
                themeMode === "dark" ? (
                  <MoonIcon />
                ) : themeMode === "light" ? (
                  <SunIcon />
                ) : (
                  <SettingsIcon />
                )
              }
              onClick={onThemeOpen}
            />
          </Tooltip>

          {/* Notifications Menu */}
          <Menu>
            <MenuButton p={1} position="relative">
              <NotificationBadge
                count={notification.length}
                effect={Effect.SCALE}
              />
              <BellIcon fontSize="2xl" m={1} />
            </MenuButton>
            <MenuList
              pl={2}
              bg={isDark ? "#202C33" : "white"}
              color={isDark ? "#E9EDEF" : "black"}
              borderColor={isDark ? "#2A3942" : "#E2E8F0"}
            >
              {!notification.length && "No New Messages"}
              {notification.map((notif) => (
                <MenuItem
                  key={notif._id}
                  _hover={{ bg: isDark ? "#2A3942" : "#F0F2F5" }}
                  onClick={() => {
                    setSelectedChat(notif.chat);
                    setNotification(notification.filter((n) => n !== notif));
                  }}
                >
                  {notif.chat.isGroupChat
                    ? `New Message in ${notif.chat.chatName}`
                    : `New Message from ${getSender(user, notif.chat.users)}`}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          {/* User Profile Avatar Menu */}
          <Menu>
            <MenuButton
              as={Button}
              bg={isDark ? "#202C33" : "white"}
              _hover={{ bg: isDark ? "#2A3942" : "#F0F2F5" }}
              rightIcon={<ChevronDownIcon />}
              p={1}
            >
              <Avatar
                size="sm"
                cursor="pointer"
                name={user.name}
                src={user.pic}
              />
            </MenuButton>
            <MenuList
              bg={isDark ? "#202C33" : "white"}
              color={isDark ? "#E9EDEF" : "black"}
              borderColor={isDark ? "#2A3942" : "#E2E8F0"}
              boxShadow="0 4px 16px rgba(0,0,0,0.2)"
            >
              <ProfileModal user={user}>
                <MenuItem _hover={{ bg: isDark ? "#2A3942" : "#F0F2F5" }}>
                  👤 My Profile & About
                </MenuItem>
              </ProfileModal>
              <MenuItem
                _hover={{ bg: isDark ? "#2A3942" : "#F0F2F5" }}
                onClick={onThemeOpen}
              >
                🌓 Theme (Light / Dark / System)
              </MenuItem>
              <MenuDivider borderColor={isDark ? "#2A3942" : "#E2E8F0"} />
              <MenuItem
                _hover={{ bg: isDark ? "#2A3942" : "#F0F2F5" }}
                onClick={logoutHandler}
                color="red.400"
              >
                🚪 Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </Box>
      </Box>

      {/* Search Drawer */}
      <Drawer placement="left" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent
          bg={isDark ? "#111B21" : "white"}
          color={isDark ? "#E9EDEF" : "black"}
        >
          <DrawerHeader
            borderBottomWidth="1px"
            borderColor={isDark ? "#2A3942" : "#E2E8F0"}
          >
            Search Users
          </DrawerHeader>
          <DrawerBody>
            <Box d="flex" pb={2}>
              <Input
                placeholder="Search by name or email"
                mr={2}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                focusBorderColor="#00A884"
                bg={isDark ? "#202C33" : "white"}
              />
              <Button colorScheme="whatsapp" bg="#00A884" onClick={handleSearch}>
                Go
              </Button>
            </Box>
            {loading ? (
              <ChatLoading />
            ) : searchResult && searchResult.length === 0 ? (
              <Text mt={4} textAlign="center" color="gray.500">
                No user found
              </Text>
            ) : (
              searchResult?.map((u) => (
                <UserListItem
                  key={u._id}
                  user={u}
                  handleFunction={() => accessChat(u._id)}
                />
              ))
            )}
            {loadingChat && <Spinner ml="auto" d="flex" />}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Theme Selection Modal */}
      <ThemeModal isOpen={isThemeOpen} onClose={onThemeClose} />
    </>
  );
}

export default SideDrawer;

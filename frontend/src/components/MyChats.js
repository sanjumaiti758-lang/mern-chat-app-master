import { AddIcon } from "@chakra-ui/icons";
import { Box, Stack, Text } from "@chakra-ui/layout";
import { useToast } from "@chakra-ui/toast";
import axios from "axios";
import { useEffect, useState } from "react";
import { getSender } from "../config/ChatLogics";
import ChatLoading from "./ChatLoading";
import GroupChatModal from "./miscellaneous/GroupChatModal";
import { Button, useColorMode } from "@chakra-ui/react";
import { ChatState } from "../Context/ChatProvider";

const MyChats = ({ fetchAgain }) => {
  const [loggedUser, setLoggedUser] = useState();

  const { selectedChat, setSelectedChat, user, chats, setChats } = ChatState();
  const { colorMode } = useColorMode();
  const isDark = colorMode === "dark";

  const toast = useToast();

  const fetchChats = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get("/api/chat", config);
      setChats(data);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the chats",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  useEffect(() => {
    setLoggedUser(JSON.parse(localStorage.getItem("userInfo")));
    fetchChats();
    // eslint-disable-next-line
  }, [fetchAgain]);

  return (
    <Box
      d={{ base: selectedChat ? "none" : "flex", md: "flex" }}
      flexDir="column"
      alignItems="center"
      p={3}
      bg={isDark ? "#111B21" : "white"}
      color={isDark ? "#E9EDEF" : "black"}
      w={{ base: "100%", md: "31%" }}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={isDark ? "#2A3942" : "#E2E8F0"}
      boxShadow="0 1px 3px rgba(0,0,0,0.08)"
    >
      <Box
        pb={3}
        px={3}
        fontSize={{ base: "24px", md: "28px" }}
        fontFamily="Work sans"
        fontWeight="bold"
        d="flex"
        w="100%"
        justifyContent="space-between"
        alignItems="center"
      >
        Chats
        <GroupChatModal>
          <Button
            d="flex"
            fontSize={{ base: "14px", md: "11px", lg: "14px" }}
            rightIcon={<AddIcon />}
            colorScheme="whatsapp"
            bg="#00A884"
            _hover={{ bg: "#008F6F" }}
            color="white"
            borderRadius="20px"
          >
            New Group
          </Button>
        </GroupChatModal>
      </Box>
      <Box
        d="flex"
        flexDir="column"
        p={2}
        bg={isDark ? "#111B21" : "#F8F9FA"}
        w="100%"
        h="100%"
        borderRadius="lg"
        overflowY="hidden"
      >
        {chats ? (
          <Stack overflowY="scroll" spacing={2}>
            {chats.map((chat) => (
              <Box
                onClick={() => setSelectedChat(chat)}
                cursor="pointer"
                bg={
                  selectedChat === chat
                    ? isDark
                      ? "#005C4B"
                      : "#E2F7CB"
                    : isDark
                    ? "#202C33"
                    : "#FFFFFF"
                }
                color={
                  selectedChat === chat
                    ? isDark
                      ? "#FFFFFF"
                      : "#111B21"
                    : isDark
                    ? "#E9EDEF"
                    : "#111B21"
                }
                px={3}
                py={2.5}
                borderRadius="lg"
                borderWidth="1px"
                borderColor={
                  selectedChat === chat
                    ? "#00A884"
                    : isDark
                    ? "#2A3942"
                    : "#E2E8F0"
                }
                key={chat._id}
                transition="all 0.15s ease"
              >
                <Text fontWeight="600" fontSize="15px">
                  {!chat.isGroupChat
                    ? getSender(loggedUser, chat.users)
                    : chat.chatName}
                </Text>
                {chat.latestMessage && (
                  <Text
                    fontSize="xs"
                    color={
                      selectedChat === chat
                        ? isDark
                          ? "#E2E8F0"
                          : "#4A5568"
                        : isDark
                        ? "#8696A0"
                        : "gray.500"
                    }
                    isTruncated
                  >
                    <b>{chat.latestMessage.sender?.name} : </b>
                    {chat.latestMessage.content}
                  </Text>
                )}
              </Box>
            ))}
          </Stack>
        ) : (
          <ChatLoading />
        )}
      </Box>
    </Box>
  );
};

export default MyChats;

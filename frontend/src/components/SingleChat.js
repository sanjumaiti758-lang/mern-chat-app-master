import { FormControl } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { Box, Text } from "@chakra-ui/layout";
import "./styles.css";
import {
  IconButton,
  Spinner,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useDisclosure,
  Checkbox,
  VStack,
  HStack,
  useColorMode,
} from "@chakra-ui/react";
import { getSender, getSenderFull } from "../config/ChatLogics";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { ArrowBackIcon, CloseIcon, AddIcon, DeleteIcon } from "@chakra-ui/icons";
import ProfileModal from "./miscellaneous/ProfileModal";
import ScrollableChat from "./ScrollableChat";
import Lottie from "react-lottie";
import animationData from "../animations/typing.json";

import io from "socket.io-client";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import { ChatState } from "../Context/ChatProvider";
import chatDoodle from "../chat-doodle.svg";

const ENDPOINT =
  process.env.REACT_APP_ENDPOINT ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000";
var socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [mediaLoading, setMediaLoading] = useState(false);

  // Poll state
  const {
    isOpen: isPollOpen,
    onOpen: onPollOpen,
    onClose: onPollClose,
  } = useDisclosure();
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [pollLoading, setPollLoading] = useState(false);

  const mediaInputRef = useRef(null);
  const docInputRef = useRef(null);

  const toast = useToast();
  const { colorMode } = useColorMode();
  const isDark = colorMode === "dark";

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };
  const { selectedChat, setSelectedChat, user, notification, setNotification, wallpaper } =
    ChatState();

  const getChatBackgroundStyles = () => {
    const wp = wallpaper || "doodle";
    if (wp === "minimal") {
      return {
        bg: isDark ? "#0B141A" : "#EFEAE2",
      };
    }
    if (wp === "emerald") {
      return {
        bg: isDark
          ? "linear-gradient(160deg, #062b22 0%, #031c16 100%)"
          : "linear-gradient(160deg, #dcf8c6 0%, #c5edd2 100%)",
        backgroundImage: `url(${chatDoodle})`,
        backgroundRepeat: "repeat",
        backgroundSize: "320px 320px",
      };
    }
    if (wp === "midnight") {
      return {
        bg: isDark
          ? "linear-gradient(160deg, #090e17 0%, #030712 100%)"
          : "linear-gradient(160deg, #1e293b 0%, #0f172a 100%)",
        backgroundImage: `url(${chatDoodle})`,
        backgroundRepeat: "repeat",
        backgroundSize: "320px 320px",
      };
    }
    if (wp === "sky") {
      return {
        bg: isDark
          ? "linear-gradient(160deg, #0d1e30 0%, #09131d 100%)"
          : "linear-gradient(160deg, #e0f2fe 0%, #bae6fd 100%)",
        backgroundImage: `url(${chatDoodle})`,
        backgroundRepeat: "repeat",
        backgroundSize: "320px 320px",
      };
    }
    if (wp === "warm") {
      return {
        bg: isDark
          ? "linear-gradient(160deg, #261e1b 0%, #171210 100%)"
          : "linear-gradient(160deg, #fef3c7 0%, #fde68a 100%)",
        backgroundImage: `url(${chatDoodle})`,
        backgroundRepeat: "repeat",
        backgroundSize: "320px 320px",
      };
    }
    // Default: WhatsApp Classic Doodle
    return {
      bg: isDark ? "#0B141A" : "#EFEAE2",
      backgroundImage: `url(${chatDoodle})`,
      backgroundRepeat: "repeat",
      backgroundSize: "320px 320px",
    };
  };

  const fetchMessages = async () => {
    if (!selectedChat) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      setLoading(true);

      const { data } = await axios.get(
        `/api/message/${selectedChat._id}`,
        config
      );
      setMessages(data);
      setLoading(false);

      if (socket) socket.emit("join chat", selectedChat._id);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  const sendMessage = async (event) => {
    if ((event && event.key && event.key !== "Enter") || !newMessage.trim()) {
      return;
    }

    if (event && event.preventDefault) {
      event.preventDefault();
    }

    if (socket) socket.emit("stop typing", selectedChat._id);
    try {
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };
      const messageContent = newMessage.trim();
      const currentReplyTo = replyingTo ? replyingTo._id : null;
      setNewMessage("");
      setReplyingTo(null);

      const { data } = await axios.post(
        "/api/message",
        {
          content: messageContent,
          chatId: selectedChat._id || selectedChat,
          replyTo: currentReplyTo,
        },
        config
      );
      if (socket) socket.emit("new message", data);
      setMessages((prev) => [...prev, data]);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description:
          error.response?.data?.message || "Failed to send the Message",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isImage && !isVideo) {
      toast({
        title: "Unsupported file type",
        description: "Please select an image or video file",
        status: "warning",
        duration: 4000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    try {
      setMediaLoading(true);
      toast({
        title: "Uploading media...",
        status: "info",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "chat-app");
      formData.append("cloud_name", "piyushproj");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/piyushproj/auto/upload",
        {
          method: "POST",
          body: formData,
        }
      );
      const cloudData = await res.json();
      const mediaUrl = cloudData.secure_url || cloudData.url;

      if (!mediaUrl) {
        throw new Error("Failed to upload media to cloud");
      }

      const mediaType =
        cloudData.resource_type === "video" || isVideo ? "video" : "image";
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const caption =
        newMessage.trim() || (mediaType === "video" ? "🎥 Video" : "📷 Photo");
      const currentReplyTo = replyingTo ? replyingTo._id : null;

      setNewMessage("");
      setReplyingTo(null);

      const { data } = await axios.post(
        "/api/message",
        {
          content: caption,
          chatId: selectedChat._id || selectedChat,
          mediaUrl: mediaUrl,
          mediaType: mediaType,
          replyTo: currentReplyTo,
        },
        config
      );

      if (socket) socket.emit("new message", data);
      setMessages((prev) => [...prev, data]);
      setMediaLoading(false);
      if (mediaInputRef.current) mediaInputRef.current.value = "";
    } catch (err) {
      toast({
        title: "Error Occured!",
        description:
          err.response?.data?.message || err.message || "Failed to upload media",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setMediaLoading(false);
      if (mediaInputRef.current) mediaInputRef.current.value = "";
    }
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setMediaLoading(true);
      toast({
        title: "Uploading document...",
        status: "info",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "chat-app");
      formData.append("cloud_name", "piyushproj");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/piyushproj/auto/upload",
        {
          method: "POST",
          body: formData,
        }
      );
      const cloudData = await res.json();
      const mediaUrl = cloudData.secure_url || cloudData.url;

      if (!mediaUrl) {
        throw new Error("Failed to upload document");
      }

      let sizeStr = "";
      if (file.size < 1024 * 1024) {
        sizeStr = `${Math.round(file.size / 1024)} KB`;
      } else {
        sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      }

      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const currentReplyTo = replyingTo ? replyingTo._id : null;
      setReplyingTo(null);

      const { data } = await axios.post(
        "/api/message",
        {
          content: file.name,
          chatId: selectedChat._id || selectedChat,
          mediaUrl: mediaUrl,
          mediaType: "document",
          fileName: file.name,
          fileSize: sizeStr,
          replyTo: currentReplyTo,
        },
        config
      );

      if (socket) socket.emit("new message", data);
      setMessages((prev) => [...prev, data]);
      setMediaLoading(false);
      if (docInputRef.current) docInputRef.current.value = "";
    } catch (err) {
      toast({
        title: "Error Occured!",
        description:
          err.response?.data?.message ||
          err.message ||
          "Failed to upload document",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setMediaLoading(false);
      if (docInputRef.current) docInputRef.current.value = "";
    }
  };

  // Poll handlers
  const handleAddPollOption = () => {
    if (pollOptions.length < 8) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const handleRemovePollOption = (index) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, idx) => idx !== index));
    }
  };

  const handlePollOptionChange = (value, index) => {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  };

  const handleCreatePoll = async () => {
    if (!pollQuestion.trim()) {
      toast({
        title: "Please ask a question",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    const validOptions = pollOptions.filter((opt) => opt.trim().length > 0);
    if (validOptions.length < 2) {
      toast({
        title: "Please provide at least 2 options",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    try {
      setPollLoading(true);
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const currentReplyTo = replyingTo ? replyingTo._id : null;
      setReplyingTo(null);

      const { data } = await axios.post(
        "/api/message",
        {
          content: `📊 Poll: ${pollQuestion.trim()}`,
          chatId: selectedChat._id || selectedChat,
          poll: {
            question: pollQuestion.trim(),
            options: validOptions,
            allowMultipleAnswers: allowMultiple,
          },
          replyTo: currentReplyTo,
        },
        config
      );

      if (socket) socket.emit("new message", data);
      setMessages((prev) => [...prev, data]);
      setPollLoading(false);
      setPollQuestion("");
      setPollOptions(["", ""]);
      setAllowMultiple(false);
      onPollClose();
    } catch (err) {
      toast({
        title: "Error Occured!",
        description:
          err.response?.data?.message || err.message || "Failed to create poll",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setPollLoading(false);
    }
  };

  const handleVotePoll = async (messageId, optionIndex) => {
    try {
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.put(
        "/api/message/poll/vote",
        {
          messageId,
          optionIndex,
        },
        config
      );

      setMessages((prev) =>
        prev.map((m) => (m._id === data._id ? data : m))
      );

      if (socket) socket.emit("poll vote", data);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description:
          error.response?.data?.message || "Failed to record vote",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.put(
        "/api/message/reaction",
        {
          messageId,
          emoji,
        },
        config
      );

      setMessages((prev) =>
        prev.map((m) => (m._id === data._id ? data : m))
      );

      if (socket) socket.emit("message reaction", data);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description:
          error.response?.data?.message || "Failed to update reaction",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;

    // Optimistically remove from state immediately
    setMessages((prev) => prev.filter((m) => m._id !== messageId));

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      await axios.delete(`/api/message/${messageId}`, config);

      if (socket) {
        socket.emit("delete message", {
          messageId,
          chatId: selectedChat._id,
        });
      }

      toast({
        title: "Message deleted",
        status: "info",
        duration: 2500,
        isClosable: true,
        position: "bottom-right",
      });
    } catch (error) {
      if (error.response?.status !== 404) {
        toast({
          title: "Error Occured!",
          description:
            error.response?.data?.message || "Failed to delete message",
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "bottom-right",
        });
      }
    }
  };

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));

    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchMessages();

    selectedChatCompare = selectedChat;
    setReplyingTo(null);
    // eslint-disable-next-line
  }, [selectedChat]);

  useEffect(() => {
    const handleMessageReceived = (newMessageRecieved) => {
      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== newMessageRecieved.chat._id
      ) {
        if (!notification.some((n) => n._id === newMessageRecieved._id)) {
          setNotification([newMessageRecieved, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages((prev) => [...prev, newMessageRecieved]);
      }
    };

    const handleReactionUpdate = (updatedMessage) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m))
      );
    };

    const handlePollUpdate = (updatedMessage) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m))
      );
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    };

    if (socket) {
      socket.on("message recieved", handleMessageReceived);
      socket.on("message reaction updated", handleReactionUpdate);
      socket.on("poll updated", handlePollUpdate);
      socket.on("message deleted", handleMessageDeleted);
    }

    return () => {
      if (socket) {
        socket.off("message recieved", handleMessageReceived);
        socket.off("message reaction updated", handleReactionUpdate);
        socket.off("poll updated", handlePollUpdate);
        socket.off("message deleted", handleMessageDeleted);
      }
    };
  });

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  return (
    <>
      {selectedChat ? (
        <>
          <Text
            fontSize={{ base: "26px", md: "28px" }}
            pb={3}
            px={2}
            w="100%"
            fontFamily="Work sans"
            fontWeight="600"
            color={isDark ? "#E9EDEF" : "#111B21"}
            d="flex"
            justifyContent={{ base: "space-between" }}
            alignItems="center"
          >
            <IconButton
              d={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />
            {messages &&
              (!selectedChat.isGroupChat ? (
                <>
                  {getSender(user, selectedChat.users)}
                  <ProfileModal
                    user={getSenderFull(user, selectedChat.users)}
                  />
                </>
              ) : (
                <>
                  {selectedChat.chatName.toUpperCase()}
                  <UpdateGroupChatModal
                    fetchMessages={fetchMessages}
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                  />
                </>
              ))}
          </Text>
          <Box
            d="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            {...getChatBackgroundStyles()}
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
            transition="all 0.2s ease"
          >
            {loading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
                color="#00A884"
              />
            ) : (
              <div className="messages">
                <ScrollableChat
                  messages={messages}
                  onReaction={handleReaction}
                  onReply={setReplyingTo}
                  onDelete={handleDeleteMessage}
                  onVotePoll={handleVotePoll}
                />
              </div>
            )}

            {/* Replying Banner */}
            {replyingTo && (
              <Box
                bg={isDark ? "#202C33" : "#FFFFFF"}
                color={isDark ? "#E9EDEF" : "#111B21"}
                p={2}
                px={3}
                mt={2}
                borderRadius="md"
                borderLeft="4px solid #00A884"
                boxShadow="0 1px 3px rgba(0,0,0,0.2)"
                d="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box overflow="hidden">
                  <Text fontWeight="bold" fontSize="xs" color="#00A884">
                    Replying to {replyingTo.sender?.name || "User"}
                  </Text>
                  <Text
                    fontSize="sm"
                    color={isDark ? "#8696A0" : "gray.600"}
                    isTruncated
                    maxW={{ base: "220px", md: "500px" }}
                  >
                    {replyingTo.mediaUrl
                      ? replyingTo.mediaType === "video"
                        ? "🎥 Video"
                        : replyingTo.mediaType === "document"
                        ? `📄 ${replyingTo.fileName || "Document"}`
                        : "📷 Photo"
                      : replyingTo.content}
                  </Text>
                </Box>
                <IconButton
                  size="xs"
                  variant="ghost"
                  icon={<CloseIcon boxSize={2.5} />}
                  onClick={() => setReplyingTo(null)}
                />
              </Box>
            )}

            <FormControl
              id="first-name"
              isRequired
              mt={replyingTo ? 2 : 3}
            >
              {istyping ? (
                <div>
                  <Lottie
                    options={defaultOptions}
                    width={70}
                    style={{ marginBottom: 10, marginLeft: 0 }}
                  />
                </div>
              ) : (
                <></>
              )}
              <Box d="flex" alignItems="center" gap={2}>
                {/* Hidden File Input for Image/Video */}
                <input
                  type="file"
                  ref={mediaInputRef}
                  accept="image/*,video/*"
                  style={{ display: "none" }}
                  onChange={handleMediaUpload}
                />

                {/* Hidden File Input for Documents */}
                <input
                  type="file"
                  ref={docInputRef}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.csv"
                  style={{ display: "none" }}
                  onChange={handleDocumentUpload}
                />

                {/* Attachment Menu (Photos/Videos, Document, Poll) */}
                <Menu placement="top-start">
                  <MenuButton
                    as={IconButton}
                    aria-label="Attach file or poll"
                    title="Attach file or poll"
                    bg={isDark ? "#2A3942" : "#FFFFFF"}
                    _hover={{ bg: isDark ? "#374248" : "#F0F2F5" }}
                    color={isDark ? "#A0AEC0" : "gray.600"}
                    borderRadius="full"
                    isLoading={mediaLoading}
                    icon={
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>
                    }
                  />
                  <MenuList
                    p={2}
                    minW="200px"
                    borderRadius="14px"
                    bg={isDark ? "#202C33" : "#FFFFFF"}
                    color={isDark ? "#E9EDEF" : "#111B21"}
                    borderColor={isDark ? "#2A3942" : "#E2E8F0"}
                    boxShadow="0 6px 20px rgba(0,0,0,0.25)"
                  >
                    <MenuItem
                      icon={<span style={{ fontSize: "18px" }}>📷</span>}
                      _hover={{ bg: isDark ? "#2A3942" : "#F0F2F5" }}
                      onClick={() =>
                        mediaInputRef.current && mediaInputRef.current.click()
                      }
                      fontWeight="500"
                      py={2}
                    >
                      Photos & Videos
                    </MenuItem>
                    <MenuItem
                      icon={<span style={{ fontSize: "18px" }}>📄</span>}
                      _hover={{ bg: isDark ? "#2A3942" : "#F0F2F5" }}
                      onClick={() =>
                        docInputRef.current && docInputRef.current.click()
                      }
                      fontWeight="500"
                      py={2}
                    >
                      Document
                    </MenuItem>
                    <MenuItem
                      icon={<span style={{ fontSize: "18px" }}>📊</span>}
                      _hover={{ bg: isDark ? "#2A3942" : "#F0F2F5" }}
                      onClick={onPollOpen}
                      fontWeight="500"
                      py={2}
                    >
                      Poll
                    </MenuItem>
                  </MenuList>
                </Menu>

                <Input
                  variant="filled"
                  bg={isDark ? "#2A3942" : "#FFFFFF"}
                  _hover={{ bg: isDark ? "#323F46" : "#FFFFFF" }}
                  _focus={{
                    bg: isDark ? "#2A3942" : "#FFFFFF",
                    borderColor: "#00A884",
                  }}
                  color={isDark ? "#E9EDEF" : "#111B21"}
                  _placeholder={{ color: isDark ? "#8696A0" : "gray.500" }}
                  borderRadius="24px"
                  placeholder={
                    replyingTo ? "Type your reply..." : "Type a message..."
                  }
                  value={newMessage}
                  onChange={typingHandler}
                  onKeyDown={sendMessage}
                  py={2}
                  px={4}
                />

                <IconButton
                  aria-label="Send message"
                  bg="#00A884"
                  _hover={{ bg: "#008F6F" }}
                  color="white"
                  borderRadius="full"
                  onClick={() => sendMessage()}
                  icon={
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  }
                />
              </Box>
            </FormControl>
          </Box>

          {/* Poll Creation Modal */}
          <Modal isOpen={isPollOpen} onClose={onPollClose} isCentered size="md">
            <ModalOverlay />
            <ModalContent
              borderRadius="16px"
              bg={isDark ? "#202C33" : "#FFFFFF"}
              color={isDark ? "#E9EDEF" : "#111B21"}
            >
              <ModalHeader fontSize="20px" fontWeight="bold">
                Create a Poll 📊
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text fontWeight="600" mb={1} fontSize="14px">
                      Question
                    </Text>
                    <Input
                      placeholder="Ask a question..."
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      focusBorderColor="#00A884"
                      bg={isDark ? "#111B21" : "#FFFFFF"}
                    />
                  </Box>

                  <Box>
                    <Text fontWeight="600" mb={1} fontSize="14px">
                      Options
                    </Text>
                    <VStack spacing={2} align="stretch">
                      {pollOptions.map((opt, idx) => (
                        <HStack key={idx} spacing={2}>
                          <Input
                            placeholder={`Option ${idx + 1}`}
                            value={opt}
                            onChange={(e) =>
                              handlePollOptionChange(e.target.value, idx)
                            }
                            focusBorderColor="#00A884"
                            bg={isDark ? "#111B21" : "#FFFFFF"}
                          />
                          {pollOptions.length > 2 && (
                            <IconButton
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              icon={<DeleteIcon />}
                              onClick={() => handleRemovePollOption(idx)}
                              aria-label="Remove option"
                            />
                          )}
                        </HStack>
                      ))}
                    </VStack>

                    {pollOptions.length < 8 && (
                      <Button
                        leftIcon={<AddIcon boxSize={2.5} />}
                        size="sm"
                        variant="ghost"
                        colorScheme="teal"
                        color="#00A884"
                        mt={2}
                        onClick={handleAddPollOption}
                      >
                        Add Option
                      </Button>
                    )}
                  </Box>

                  <Checkbox
                    isChecked={allowMultiple}
                    onChange={(e) => setAllowMultiple(e.target.checked)}
                    colorScheme="whatsapp"
                  >
                    Allow multiple answers
                  </Checkbox>
                </VStack>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={onPollClose}>
                  Cancel
                </Button>
                <Button
                  colorScheme="whatsapp"
                  bg="#00A884"
                  _hover={{ bg: "#008F6F" }}
                  color="white"
                  isLoading={pollLoading}
                  onClick={handleCreatePoll}
                >
                  Create Poll
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </>
      ) : (
        <Box d="flex" alignItems="center" justifyContent="center" h="100%">
          <Text
            fontSize="3xl"
            pb={3}
            fontFamily="Work sans"
            color={isDark ? "#8696A0" : "gray.600"}
          >
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;

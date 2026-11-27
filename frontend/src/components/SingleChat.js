import { FormControl } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { Box, Text } from "@chakra-ui/layout";
import "./styles.css";
import { IconButton, Spinner, useToast } from "@chakra-ui/react";
import { getSender, getSenderFull } from "../config/ChatLogics";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { ArrowBackIcon, CloseIcon } from "@chakra-ui/icons";
import ProfileModal from "./miscellaneous/ProfileModal";
import ScrollableChat from "./ScrollableChat";
import Lottie from "react-lottie";
import animationData from "../animations/typing.json";

import io from "socket.io-client";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import { ChatState } from "../Context/ChatProvider";

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
  const mediaInputRef = useRef(null);

  const toast = useToast();

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };
  const { selectedChat, setSelectedChat, user, notification, setNotification } =
    ChatState();

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

      const mediaType = cloudData.resource_type === "video" || isVideo ? "video" : "image";
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const caption = newMessage.trim() || (mediaType === "video" ? "🎥 Video" : "📷 Photo");
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
        description: err.response?.data?.message || err.message || "Failed to upload media",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setMediaLoading(false);
      if (mediaInputRef.current) mediaInputRef.current.value = "";
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

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      await axios.delete(`/api/message/${messageId}`, config);
      setMessages((prev) => prev.filter((m) => m._id !== messageId));

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

    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    };

    if (socket) {
      socket.on("message recieved", handleMessageReceived);
      socket.on("message reaction updated", handleReactionUpdate);
      socket.on("message deleted", handleMessageDeleted);
    }

    return () => {
      if (socket) {
        socket.off("message recieved", handleMessageReceived);
        socket.off("message reaction updated", handleReactionUpdate);
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
            fontSize={{ base: "28px", md: "30px" }}
            pb={3}
            px={2}
            w="100%"
            fontFamily="Work sans"
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
            bg="#EFEAE2"
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {loading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <div className="messages">
                <ScrollableChat
                  messages={messages}
                  onReaction={handleReaction}
                  onReply={setReplyingTo}
                  onDelete={handleDeleteMessage}
                />
              </div>
            )}

            {/* Replying Banner */}
            {replyingTo && (
              <Box
                bg="#FFFFFF"
                p={2}
                px={3}
                mt={2}
                borderRadius="md"
                borderLeft="4px solid #00A884"
                boxShadow="0 1px 3px rgba(0,0,0,0.1)"
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
                    color="gray.600"
                    isTruncated
                    maxW={{ base: "220px", md: "500px" }}
                  >
                    {replyingTo.mediaUrl
                      ? replyingTo.mediaType === "video"
                        ? "🎥 Video"
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

                {/* Attachment Button */}
                <IconButton
                  aria-label="Send photo or video"
                  title="Send photo or video"
                  bg="#FFFFFF"
                  _hover={{ bg: "#F0F2F5" }}
                  color="gray.600"
                  borderRadius="full"
                  isLoading={mediaLoading}
                  onClick={() => mediaInputRef.current && mediaInputRef.current.click()}
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

                <Input
                  variant="filled"
                  bg="#FFFFFF"
                  _focus={{ bg: "#FFFFFF", borderColor: "#00A884" }}
                  borderRadius="24px"
                  placeholder={replyingTo ? "Type your reply..." : "Type a message..."}
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
        </>
      ) : (
        <Box d="flex" alignItems="center" justifyContent="center" h="100%">
          <Text fontSize="3xl" pb={3} fontFamily="Work sans">
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;

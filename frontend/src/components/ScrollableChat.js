import React, { useState } from "react";
import { Avatar } from "@chakra-ui/avatar";
import { Tooltip } from "@chakra-ui/tooltip";
import ScrollableFeed from "react-scrollable-feed";
import { ChatState } from "../Context/ChatProvider";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const ScrollableChat = ({ messages, onReaction }) => {
  const { user, selectedChat } = ChatState();
  const [activePickerId, setActivePickerId] = useState(null);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);

  const formatTime = (dateString) => {
    if (!dateString) return "";
    try {
      const d = new Date(dateString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  };

  const getSenderId = (m) => {
    if (!m) return "";
    if (m.sender && typeof m.sender === "object") return m.sender._id || "";
    return m.sender || "";
  };

  const currentUserId = user?._id || user?.id || "";

  return (
    <ScrollableFeed>
      {messages &&
        messages.map((m, i) => {
          const senderId = getSenderId(m);
          const isMyMessage = String(senderId) === String(currentUserId);

          const prevSenderId =
            i > 0 ? getSenderId(messages[i - 1]) : null;
          const nextSenderId =
            i < messages.length - 1 ? getSenderId(messages[i + 1]) : null;

          const isFirstInCluster =
            i === 0 || String(prevSenderId) !== String(senderId);
          const isLastInCluster =
            i === messages.length - 1 || String(nextSenderId) !== String(senderId);

          const senderName =
            m.sender && typeof m.sender === "object"
              ? m.sender.name || "User"
              : "User";
          const senderPic =
            m.sender && typeof m.sender === "object" ? m.sender.pic : "";

          // Group reactions by emoji: { "👍": { count: 2, reactedByMe: true }, ... }
          const reactionGroups = {};
          if (Array.isArray(m.reactions)) {
            m.reactions.forEach((r) => {
              if (!r || !r.emoji) return;
              if (!reactionGroups[r.emoji]) {
                reactionGroups[r.emoji] = { count: 0, reactedByMe: false };
              }
              reactionGroups[r.emoji].count += 1;
              const reactionUserId =
                r.user && typeof r.user === "object" ? r.user._id : r.user;
              if (String(reactionUserId) === String(currentUserId)) {
                reactionGroups[r.emoji].reactedByMe = true;
              }
            });
          }

          const hasReactions = Object.keys(reactionGroups).length > 0;
          const isPickerOpen = activePickerId === m._id;
          const isHovered = hoveredMessageId === m._id;

          return (
            <div
              key={m._id || i}
              style={{
                display: "flex",
                width: "100%",
                justifyContent: isMyMessage ? "flex-end" : "flex-start",
                alignItems: "flex-end",
                marginTop: isFirstInCluster ? "8px" : "3px",
                marginBottom: isLastInCluster ? "6px" : "2px",
                padding: "0 8px",
                boxSizing: "border-box",
                position: "relative",
              }}
              onMouseEnter={() => setHoveredMessageId(m._id)}
              onMouseLeave={() => {
                setHoveredMessageId(null);
                if (isPickerOpen) setActivePickerId(null);
              }}
            >
              {/* Left Avatar for other contacts */}
              {!isMyMessage && (
                <div
                  style={{
                    width: "32px",
                    marginRight: "8px",
                    flexShrink: 0,
                  }}
                >
                  {isLastInCluster ? (
                    <Tooltip
                      label={senderName}
                      placement="bottom-start"
                      hasArrow
                    >
                      <Avatar
                        size="xs"
                        cursor="pointer"
                        name={senderName}
                        src={senderPic}
                      />
                    </Tooltip>
                  ) : (
                    <div style={{ width: "32px", height: "32px" }} />
                  )}
                </div>
              )}

              {/* Reaction Trigger Button (Left of bubble for My messages) */}
              {isMyMessage && (
                <div
                  style={{
                    position: "relative",
                    alignSelf: "center",
                    marginRight: "4px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setActivePickerId(isPickerOpen ? null : m._id)
                    }
                    title="Add reaction"
                    style={{
                      opacity: isHovered || isPickerOpen ? 1 : 0,
                      transition: "opacity 0.15s ease",
                      background: "rgba(255, 255, 255, 0.8)",
                      border: "none",
                      borderRadius: "50%",
                      width: "26px",
                      height: "26px",
                      cursor: "pointer",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  >
                    😊
                  </button>

                  {/* Reaction Emoji Picker Popup */}
                  {isPickerOpen && (
                    <div
                      className="reaction-popover"
                      style={{
                        position: "absolute",
                        bottom: "32px",
                        right: "0",
                        backgroundColor: "#FFFFFF",
                        borderRadius: "24px",
                        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.18)",
                        padding: "4px 8px",
                        display: "flex",
                        gap: "6px",
                        zIndex: 100,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {QUICK_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            if (onReaction) onReaction(m._id, emoji);
                            setActivePickerId(null);
                          }}
                          style={{
                            fontSize: "18px",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "2px 4px",
                            borderRadius: "50%",
                            lineHeight: "1",
                            transition: "transform 0.1s ease",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.transform = "scale(1.3)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.transform = "scale(1)")
                          }
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Message Bubble Container */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isMyMessage ? "flex-end" : "flex-start",
                  maxWidth: "75%",
                }}
              >
                <div
                  style={{
                    backgroundColor: isMyMessage ? "#D9FDD3" : "#FFFFFF",
                    color: "#111B21",
                    borderRadius: isMyMessage
                      ? isFirstInCluster
                        ? "16px 4px 16px 16px"
                        : "16px 16px 4px 16px"
                      : isFirstInCluster
                      ? "4px 16px 16px 16px"
                      : "16px 16px 16px 4px",
                    padding: "6px 10px 5px 12px",
                    boxShadow: "0 1px 1px rgba(11,20,26,.12)",
                    wordBreak: "break-word",
                    fontSize: "14.5px",
                    lineHeight: "1.4",
                    position: "relative",
                  }}
                >
                  {/* Sender name for group chats on incoming messages */}
                  {!isMyMessage &&
                    selectedChat?.isGroupChat &&
                    isFirstInCluster && (
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: "bold",
                          color: "#128C7E",
                          marginBottom: "2px",
                        }}
                      >
                        {senderName}
                      </div>
                    )}

                  {/* Message Text */}
                  <span style={{ marginRight: "4px" }}>{m.content}</span>

                  {/* Timestamp & Read Tick (WhatsApp style inline bottom-right) */}
                  <span
                    style={{
                      fontSize: "10.5px",
                      color: "#667781",
                      marginLeft: "8px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "2px",
                      verticalAlign: "bottom",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatTime(m.createdAt)}
                    {isMyMessage && (
                      <span style={{ color: "#53BDEB", fontWeight: "bold" }}>
                        ✓✓
                      </span>
                    )}
                  </span>
                </div>

                {/* Reaction Badges Below Bubble */}
                {hasReactions && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "4px",
                      marginTop: "-6px",
                      zIndex: 1,
                      padding: isMyMessage ? "0 4px 0 0" : "0 0 0 4px",
                    }}
                  >
                    {Object.entries(reactionGroups).map(([emoji, data]) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => onReaction && onReaction(m._id, emoji)}
                        title={
                          data.reactedByMe
                            ? "Click to remove reaction"
                            : "Click to react"
                        }
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          backgroundColor: data.reactedByMe
                            ? "#E7F8EF"
                            : "#FFFFFF",
                          border: data.reactedByMe
                            ? "1px solid #25D366"
                            : "1px solid #E2E8F0",
                          borderRadius: "12px",
                          padding: "1px 6px",
                          fontSize: "11.5px",
                          cursor: "pointer",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                          lineHeight: "1.4",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span>{emoji}</span>
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: "11px",
                            color: data.reactedByMe ? "#075E54" : "#4A5568",
                          }}
                        >
                          {data.count}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reaction Trigger Button (Right of bubble for Other contacts) */}
              {!isMyMessage && (
                <div
                  style={{
                    position: "relative",
                    alignSelf: "center",
                    marginLeft: "4px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setActivePickerId(isPickerOpen ? null : m._id)
                    }
                    title="Add reaction"
                    style={{
                      opacity: isHovered || isPickerOpen ? 1 : 0,
                      transition: "opacity 0.15s ease",
                      background: "rgba(255, 255, 255, 0.8)",
                      border: "none",
                      borderRadius: "50%",
                      width: "26px",
                      height: "26px",
                      cursor: "pointer",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  >
                    😊
                  </button>

                  {/* Reaction Emoji Picker Popup */}
                  {isPickerOpen && (
                    <div
                      className="reaction-popover"
                      style={{
                        position: "absolute",
                        bottom: "32px",
                        left: "0",
                        backgroundColor: "#FFFFFF",
                        borderRadius: "24px",
                        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.18)",
                        padding: "4px 8px",
                        display: "flex",
                        gap: "6px",
                        zIndex: 100,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {QUICK_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            if (onReaction) onReaction(m._id, emoji);
                            setActivePickerId(null);
                          }}
                          style={{
                            fontSize: "18px",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "2px 4px",
                            borderRadius: "50%",
                            lineHeight: "1",
                            transition: "transform 0.1s ease",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.transform = "scale(1.3)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.transform = "scale(1)")
                          }
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
    </ScrollableFeed>
  );
};

export default ScrollableChat;

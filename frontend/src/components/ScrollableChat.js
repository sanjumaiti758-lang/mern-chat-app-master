import React, { useState } from "react";
import { Avatar } from "@chakra-ui/avatar";
import { Tooltip } from "@chakra-ui/tooltip";
import ScrollableFeed from "react-scrollable-feed";
import { ChatState } from "../Context/ChatProvider";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const ScrollableChat = ({
  messages,
  onReaction,
  onReply,
  onDelete,
  onVotePoll,
}) => {
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

          // Group reactions by emoji
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

          const isImage =
            m.mediaType === "image" ||
            (m.mediaUrl &&
              m.mediaType !== "video" &&
              m.mediaType !== "document" &&
              m.mediaUrl.match(/\.(jpeg|jpg|gif|png|webp)/i));

          const isVideo =
            m.mediaType === "video" ||
            (m.mediaUrl && m.mediaUrl.match(/\.(mp4|webm|mov|ogg)/i));

          const isDocument = m.mediaType === "document";
          const isPoll = m.poll && m.poll.question && Array.isArray(m.poll.options);

          // Calculate total poll votes
          const totalPollVotes = isPoll
            ? m.poll.options.reduce(
                (sum, opt) => sum + (opt.votes ? opt.votes.length : 0),
                0
              )
            : 0;

          const showCaption =
            m.content &&
            m.content !== "📷 Photo" &&
            m.content !== "🎥 Video" &&
            !m.content.startsWith("📊 Poll:");

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

              {/* Action Buttons (Left of bubble for My messages) */}
              {isMyMessage && (
                <div
                  style={{
                    position: "relative",
                    alignSelf: "center",
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                    marginRight: "6px",
                    opacity: isHovered || isPickerOpen ? 1 : 0,
                    transition: "opacity 0.15s ease",
                  }}
                >
                  {/* Reaction trigger */}
                  <button
                    type="button"
                    onClick={() =>
                      setActivePickerId(isPickerOpen ? null : m._id)
                    }
                    title="Add reaction"
                    style={{
                      background: "rgba(255, 255, 255, 0.85)",
                      border: "none",
                      borderRadius: "50%",
                      width: "26px",
                      height: "26px",
                      cursor: "pointer",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  >
                    😊
                  </button>

                  {/* Reply button */}
                  <button
                    type="button"
                    onClick={() => onReply && onReply(m)}
                    title="Reply to message"
                    style={{
                      background: "rgba(255, 255, 255, 0.85)",
                      border: "none",
                      borderRadius: "50%",
                      width: "26px",
                      height: "26px",
                      cursor: "pointer",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  >
                    ↩️
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => onDelete && onDelete(m._id)}
                    title="Delete message"
                    style={{
                      background: "rgba(255, 255, 255, 0.85)",
                      border: "none",
                      borderRadius: "50%",
                      width: "26px",
                      height: "26px",
                      cursor: "pointer",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      color: "#E53E3E",
                    }}
                  >
                    🗑️
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
                  maxWidth: isPoll ? "85%" : "75%",
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
                    minWidth: isPoll ? "260px" : isDocument ? "240px" : "60px",
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
                          marginBottom: "3px",
                        }}
                      >
                        {senderName}
                      </div>
                    )}

                  {/* Quoted Reply Preview */}
                  {m.replyTo && (
                    <div
                      style={{
                        backgroundColor: isMyMessage
                          ? "rgba(0, 0, 0, 0.06)"
                          : "rgba(0, 0, 0, 0.04)",
                        borderLeft: isMyMessage
                          ? "3px solid #00A884"
                          : "3px solid #128C7E",
                        borderRadius: "6px",
                        padding: "3px 8px",
                        marginBottom: "6px",
                        fontSize: "12px",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "bold",
                          color: isMyMessage ? "#00A884" : "#128C7E",
                          fontSize: "11px",
                        }}
                      >
                        {m.replyTo.sender?.name || "User"}
                      </div>
                      <div
                        style={{
                          color: "#4A5568",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "240px",
                          fontSize: "12px",
                        }}
                      >
                        {m.replyTo.mediaUrl
                          ? m.replyTo.mediaType === "video"
                            ? "🎥 Video"
                            : m.replyTo.mediaType === "document"
                            ? `📄 ${m.replyTo.fileName || "Document"}`
                            : "📷 Photo"
                          : m.replyTo.content}
                      </div>
                    </div>
                  )}

                  {/* 1. Photo Media */}
                  {m.mediaUrl && isImage && (
                    <a
                      href={m.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "block",
                        marginBottom: showCaption ? "4px" : "2px",
                      }}
                    >
                      <img
                        src={m.mediaUrl}
                        alt="Shared in chat"
                        style={{
                          borderRadius: "8px",
                          maxWidth: "100%",
                          maxHeight: "260px",
                          objectFit: "cover",
                          display: "block",
                          cursor: "pointer",
                        }}
                      />
                    </a>
                  )}

                  {/* 2. Video Media */}
                  {m.mediaUrl && isVideo && (
                    <div style={{ marginBottom: showCaption ? "4px" : "2px" }}>
                      <video
                        controls
                        src={m.mediaUrl}
                        style={{
                          borderRadius: "8px",
                          maxWidth: "100%",
                          maxHeight: "260px",
                          display: "block",
                        }}
                      />
                    </div>
                  )}

                  {/* 3. Document Media */}
                  {isDocument && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        backgroundColor: isMyMessage
                          ? "rgba(0, 0, 0, 0.05)"
                          : "rgba(0, 0, 0, 0.03)",
                        border: "1px solid rgba(0, 0, 0, 0.08)",
                        borderRadius: "8px",
                        padding: "8px 10px",
                        marginBottom: "4px",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          width: "36px",
                          height: "40px",
                          borderRadius: "6px",
                          backgroundColor: "#E53E3E",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px",
                          flexShrink: 0,
                        }}
                      >
                        📄
                      </div>
                      <div style={{ overflow: "hidden", flex: 1 }}>
                        <div
                          style={{
                            fontWeight: "600",
                            fontSize: "13.5px",
                            color: "#111B21",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={m.fileName || m.content}
                        >
                          {m.fileName || m.content}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#667781",
                            marginTop: "1px",
                          }}
                        >
                          {m.fileSize ? `Document • ${m.fileSize}` : "Document"}
                        </div>
                      </div>
                      <a
                        href={m.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={m.fileName || "document"}
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid #E2E8F0",
                          borderRadius: "50%",
                          width: "30px",
                          height: "30px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                          cursor: "pointer",
                          textDecoration: "none",
                          fontSize: "14px",
                          color: "#00A884",
                          flexShrink: 0,
                        }}
                        title="Download Document"
                      >
                        ⬇️
                      </a>
                    </div>
                  )}

                  {/* 4. Poll Card */}
                  {isPoll && (
                    <div style={{ marginBottom: "6px", width: "100%" }}>
                      <div
                        style={{
                          fontWeight: "bold",
                          fontSize: "15px",
                          color: "#111B21",
                          marginBottom: "4px",
                        }}
                      >
                        {m.poll.question}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#667781",
                          marginBottom: "8px",
                        }}
                      >
                        {m.poll.allowMultipleAnswers
                          ? "Select one or more"
                          : "Select one"}
                      </div>

                      {/* Poll Options */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        {m.poll.options.map((opt, optIdx) => {
                          const votes = Array.isArray(opt.votes)
                            ? opt.votes
                            : [];
                          const isVoted = votes.some((v) => {
                            const vId = typeof v === "object" ? v._id : v;
                            return String(vId) === String(currentUserId);
                          });

                          const percentage =
                            totalPollVotes > 0
                              ? Math.round(
                                  (votes.length / totalPollVotes) * 100
                                )
                              : 0;

                          return (
                            <div
                              key={optIdx}
                              onClick={() =>
                                onVotePoll && onVotePoll(m._id, optIdx)
                              }
                              style={{
                                border: isVoted
                                  ? "1.5px solid #00A884"
                                  : "1px solid #E2E8F0",
                                backgroundColor: isVoted
                                  ? "#E7F8EF"
                                  : "rgba(0, 0, 0, 0.02)",
                                borderRadius: "8px",
                                padding: "7px 10px",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                position: "relative",
                                overflow: "hidden",
                              }}
                            >
                              {/* Background vote progress bar */}
                              <div
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  bottom: 0,
                                  width: `${percentage}%`,
                                  backgroundColor: isVoted
                                    ? "rgba(0, 168, 132, 0.15)"
                                    : "rgba(0, 0, 0, 0.04)",
                                  zIndex: 0,
                                  transition: "width 0.3s ease",
                                }}
                              />

                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  position: "relative",
                                  zIndex: 1,
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                  }}
                                >
                                  {/* Radio / Check indicator */}
                                  <span
                                    style={{
                                      width: "16px",
                                      height: "16px",
                                      borderRadius: m.poll.allowMultipleAnswers
                                        ? "3px"
                                        : "50%",
                                      border: isVoted
                                        ? "2px solid #00A884"
                                        : "2px solid #A0AEC0",
                                      backgroundColor: isVoted
                                        ? "#00A884"
                                        : "transparent",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: "white",
                                      fontSize: "10px",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    {isVoted && "✓"}
                                  </span>
                                  <span
                                    style={{
                                      fontWeight: isVoted ? "600" : "500",
                                      color: "#111B21",
                                      fontSize: "13.5px",
                                    }}
                                  >
                                    {opt.text}
                                  </span>
                                </div>

                                <div
                                  style={{
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    color: isVoted ? "#00A884" : "#718096",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  {votes.length > 0 && (
                                    <span>{percentage}%</span>
                                  )}
                                  <span style={{ fontSize: "11px" }}>
                                    ({votes.length})
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div
                        style={{
                          fontSize: "11px",
                          color: "#718096",
                          marginTop: "6px",
                          textAlign: "right",
                        }}
                      >
                        {totalPollVotes}{" "}
                        {totalPollVotes === 1 ? "vote" : "votes"}
                      </div>
                    </div>
                  )}

                  {/* Text Message Content */}
                  {!isPoll && (!m.mediaUrl || showCaption) && (
                    <span style={{ marginRight: "4px" }}>{m.content}</span>
                  )}

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

              {/* Action Buttons (Right of bubble for Other contacts) */}
              {!isMyMessage && (
                <div
                  style={{
                    position: "relative",
                    alignSelf: "center",
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                    marginLeft: "6px",
                    opacity: isHovered || isPickerOpen ? 1 : 0,
                    transition: "opacity 0.15s ease",
                  }}
                >
                  {/* Reaction trigger */}
                  <button
                    type="button"
                    onClick={() =>
                      setActivePickerId(isPickerOpen ? null : m._id)
                    }
                    title="Add reaction"
                    style={{
                      background: "rgba(255, 255, 255, 0.85)",
                      border: "none",
                      borderRadius: "50%",
                      width: "26px",
                      height: "26px",
                      cursor: "pointer",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  >
                    😊
                  </button>

                  {/* Reply button */}
                  <button
                    type="button"
                    onClick={() => onReply && onReply(m)}
                    title="Reply to message"
                    style={{
                      background: "rgba(255, 255, 255, 0.85)",
                      border: "none",
                      borderRadius: "50%",
                      width: "26px",
                      height: "26px",
                      cursor: "pointer",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  >
                    ↩️
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => onDelete && onDelete(m._id)}
                    title="Delete message"
                    style={{
                      background: "rgba(255, 255, 255, 0.85)",
                      border: "none",
                      borderRadius: "50%",
                      width: "26px",
                      height: "26px",
                      cursor: "pointer",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      color: "#E53E3E",
                    }}
                  >
                    🗑️
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

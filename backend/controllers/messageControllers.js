const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");

//@description     Get all Messages
//@route           GET /api/Message/:chatId
//@access          Protected
const allMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email about")
      .populate("chat")
      .populate("reactions.user", "name pic")
      .populate("poll.options.votes", "name pic")
      .populate({
        path: "replyTo",
        populate: { path: "sender", select: "name pic" },
      });
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected
const sendMessage = asyncHandler(async (req, res) => {
  const {
    content,
    chatId,
    replyTo,
    mediaUrl,
    mediaType,
    fileName,
    fileSize,
    poll,
  } = req.body;

  if ((!content && !mediaUrl && !poll) || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  const targetChatId =
    typeof chatId === "object" && chatId._id ? chatId._id : chatId;

  var formattedPoll = undefined;
  if (poll && poll.question && Array.isArray(poll.options)) {
    formattedPoll = {
      question: poll.question.trim(),
      options: poll.options
        .map((opt) =>
          (typeof opt === "string"
            ? opt
            : opt?.text || opt?.optionText || opt?.option || ""
          ).trim()
        )
        .filter(Boolean)
        .map((text) => ({ text, votes: [] })),
      allowMultipleAnswers: !!poll.allowMultipleAnswers,
    };
  }

  var newMessage = {
    sender: req.user._id,
    content: content || (formattedPoll ? `📊 Poll: ${formattedPoll.question}` : ""),
    chat: targetChatId,
    replyTo: replyTo || null,
    mediaUrl: mediaUrl || "",
    mediaType: mediaType || "",
    fileName: fileName || "",
    fileSize: fileSize || "",
    poll: formattedPoll,
    reactions: [],
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "name pic email about");
    message = await message.populate("chat");
    message = await message.populate("poll.options.votes", "name pic");
    message = await message.populate({
      path: "replyTo",
      populate: { path: "sender", select: "name pic" },
    });
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email about",
    });

    await Chat.findByIdAndUpdate(targetChatId, { latestMessage: message });

    res.json(message);
  } catch (error) {
    console.error("Error in sendMessage:", error.message);
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Delete Message
//@route           DELETE /api/Message/:messageId
//@access          Protected
const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
    return res.json({ message: "Message deleted successfully", messageId });
  }

  const message = await Message.findById(messageId);
  if (!message) {
    // If message is already deleted or not in DB, return success so frontend clears cleanly
    return res.json({ message: "Message deleted successfully", messageId });
  }

  const chatId = message.chat;
  await Message.findByIdAndDelete(messageId);

  // Update latestMessage in chat if needed
  const latest = await Message.findOne({ chat: chatId }).sort({ createdAt: -1 });
  await Chat.findByIdAndUpdate(chatId, { latestMessage: latest || null });

  res.json({ message: "Message deleted successfully", messageId, chatId });
});

//@description     Vote on a Poll in Message
//@route           PUT /api/Message/poll/vote
//@access          Protected
const votePoll = asyncHandler(async (req, res) => {
  const { messageId, optionIndex } = req.body;

  if (!messageId || optionIndex === undefined) {
    res.status(400);
    throw new Error("messageId and optionIndex are required");
  }

  const message = await Message.findById(messageId);
  if (!message || !message.poll || !message.poll.options) {
    res.status(404);
    throw new Error("Poll not found");
  }

  const userIdStr = req.user._id.toString();
  // Clone options array cleanly
  const options = message.poll.options.map((opt) => ({
    text: opt.text,
    votes: Array.isArray(opt.votes) ? [...opt.votes] : [],
  }));

  const targetOption = options[optionIndex];

  if (!targetOption) {
    res.status(400);
    throw new Error("Invalid option index");
  }

  const hasVotedForThis = targetOption.votes.some(
    (v) => (v._id ? v._id.toString() : v.toString()) === userIdStr
  );

  if (hasVotedForThis) {
    // Toggle off (unvote)
    targetOption.votes = targetOption.votes.filter(
      (v) => (v._id ? v._id.toString() : v.toString()) !== userIdStr
    );
  } else {
    if (!message.poll.allowMultipleAnswers) {
      // Single answer allowed: remove vote from all other options first
      options.forEach((opt) => {
        opt.votes = opt.votes.filter(
          (v) => (v._id ? v._id.toString() : v.toString()) !== userIdStr
        );
      });
    }
    // Add vote to target option
    targetOption.votes.push(req.user._id);
  }

  // Atomic update to avoid Mongoose VersionError
  await Message.findByIdAndUpdate(
    messageId,
    { $set: { "poll.options": options } },
    { new: true }
  );

  let updatedMessage = await Message.findById(messageId)
    .populate("sender", "name pic email about")
    .populate("chat")
    .populate("reactions.user", "name pic")
    .populate("poll.options.votes", "name pic")
    .populate({
      path: "replyTo",
      populate: { path: "sender", select: "name pic" },
    });

  updatedMessage = await User.populate(updatedMessage, {
    path: "chat.users",
    select: "name pic email about",
  });

  res.json(updatedMessage);
});

//@description     Add or Toggle Reaction on Message
//@route           PUT /api/Message/reaction
//@access          Protected
const toggleReaction = asyncHandler(async (req, res) => {
  const { messageId, emoji } = req.body;

  if (!messageId || !emoji) {
    res.status(400);
    throw new Error("messageId and emoji are required");
  }

  const message = await Message.findById(messageId);
  if (!message) {
    res.status(404);
    throw new Error("Message not found");
  }

  const reactions = Array.isArray(message.reactions) ? [...message.reactions] : [];
  const currentUserIdStr = req.user._id.toString();
  const existingReactionIndex = reactions.findIndex(
    (r) => r.user && (r.user._id ? r.user._id.toString() : r.user.toString()) === currentUserIdStr
  );

  if (existingReactionIndex > -1) {
    if (reactions[existingReactionIndex].emoji === emoji) {
      // Toggle off when clicking same emoji
      reactions.splice(existingReactionIndex, 1);
    } else {
      // Switch emoji
      reactions[existingReactionIndex].emoji = emoji;
    }
  } else {
    // Add new reaction
    reactions.push({ emoji, user: req.user._id });
  }

  // Atomic update to prevent VersionError
  await Message.findByIdAndUpdate(
    messageId,
    { $set: { reactions: reactions } },
    { new: true }
  );

  let updatedMessage = await Message.findById(messageId)
    .populate("sender", "name pic email about")
    .populate("chat")
    .populate("reactions.user", "name pic")
    .populate("poll.options.votes", "name pic")
    .populate({
      path: "replyTo",
      populate: { path: "sender", select: "name pic" },
    });

  updatedMessage = await User.populate(updatedMessage, {
    path: "chat.users",
    select: "name pic email about",
  });

  res.json(updatedMessage);
});

module.exports = {
  allMessages,
  sendMessage,
  deleteMessage,
  votePoll,
  toggleReaction,
};

const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");

//@description     Get all Messages
//@route           GET /api/Message/:chatId
//@access          Protected
const allMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat")
      .populate("reactions.user", "name pic");
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
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  const targetChatId =
    typeof chatId === "object" && chatId._id ? chatId._id : chatId;

  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: targetChatId,
    reactions: [],
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(targetChatId, { latestMessage: message });

    res.json(message);
  } catch (error) {
    console.error("Error in sendMessage:", error.message);
    res.status(400);
    throw new Error(error.message);
  }
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

  if (!message.reactions) {
    message.reactions = [];
  }

  const currentUserIdStr = req.user._id.toString();
  const existingReactionIndex = message.reactions.findIndex(
    (r) => r.user && r.user.toString() === currentUserIdStr
  );

  if (existingReactionIndex > -1) {
    if (message.reactions[existingReactionIndex].emoji === emoji) {
      // Toggle off when clicking same emoji
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Switch emoji
      message.reactions[existingReactionIndex].emoji = emoji;
    }
  } else {
    // Add new reaction
    message.reactions.push({ emoji, user: req.user._id });
  }

  await message.save();

  let updatedMessage = await Message.findById(messageId)
    .populate("sender", "name pic email")
    .populate("chat")
    .populate("reactions.user", "name pic");

  updatedMessage = await User.populate(updatedMessage, {
    path: "chat.users",
    select: "name pic email",
  });

  res.json(updatedMessage);
});

module.exports = { allMessages, sendMessage, toggleReaction };

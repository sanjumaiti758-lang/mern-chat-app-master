const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, trim: true },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    mediaUrl: { type: String, default: "" },
    mediaType: {
      type: String,
      enum: ["image", "video", "document", ""],
      default: "",
    },
    fileName: { type: String, default: "" },
    fileSize: { type: String, default: "" },
    poll: {
      question: { type: String, default: "" },
      options: [
        {
          text: { type: String, required: true },
          votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        },
      ],
      allowMultipleAnswers: { type: Boolean, default: false },
    },
    reactions: [
      {
        emoji: { type: String, required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      },
    ],
  },
  { timestamps: true, versionKey: false }
);

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;

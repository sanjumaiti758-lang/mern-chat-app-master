const express = require("express");
const {
  allMessages,
  sendMessage,
  deleteMessage,
  votePoll,
  toggleReaction,
} = require("../controllers/messageControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/:chatId").get(protect, allMessages);
router.route("/").post(protect, sendMessage);
router.route("/reaction").put(protect, toggleReaction);
router.route("/poll/vote").put(protect, votePoll);
router.route("/:messageId").delete(protect, deleteMessage);

module.exports = router;

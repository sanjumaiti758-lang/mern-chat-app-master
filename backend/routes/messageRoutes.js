const express = require("express");
const {
  allMessages,
  sendMessage,
  toggleReaction,
} = require("../controllers/messageControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/:chatId").get(protect, allMessages);
router.route("/").post(protect, sendMessage);
router.route("/reaction").put(protect, toggleReaction);

module.exports = router;

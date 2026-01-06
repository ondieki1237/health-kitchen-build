import express from "express";
import Comment from "../../models/Comment.js";
import { verifyToken, optionalAuth } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";

const router = express.Router();

// Get comments for a recipe
router.get("/", optionalAuth, asyncHandler(async (req, res) => {
  const { recipeId, page = 1, limit = 20 } = req.query;

  if (!recipeId) {
    return res.status(400).json({ message: "recipeId is required" });
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [comments, total] = await Promise.all([
    Comment.find({ recipeId, parentCommentId: null })
      .sort("-createdAt")
      .skip(skip)
      .limit(parseInt(limit))
      .populate("userId", "displayName avatar username")
      .populate({
        path: "replies",
        populate: { path: "userId", select: "displayName avatar username" }
      })
      .lean(),
    Comment.countDocuments({ recipeId, parentCommentId: null })
  ]);

  res.json({
    comments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// Create comment
router.post("/", verifyToken, asyncHandler(async (req, res) => {
  const { recipeId, content, parentCommentId, rating } = req.body;

  if (!recipeId || !content) {
    return res.status(400).json({ message: "recipeId and content are required" });
  }

  const comment = new Comment({
    recipeId,
    userId: req.userId,
    content,
    parentCommentId,
    rating
  });

  await comment.save();

  const populatedComment = await Comment.findById(comment._id)
    .populate("userId", "displayName avatar username");

  res.status(201).json(populatedComment);
}));

// Update comment
router.put("/:id", verifyToken, asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return res.status(404).json({ message: "Comment not found" });
  }

  if (comment.userId.toString() !== req.userId.toString()) {
    return res.status(403).json({ message: "Not authorized to update this comment" });
  }

  comment.content = req.body.content || comment.content;
  comment.rating = req.body.rating ?? comment.rating;
  await comment.save();

  const updatedComment = await Comment.findById(comment._id)
    .populate("userId", "displayName avatar username");

  res.json(updatedComment);
}));

// Delete comment
router.delete("/:id", verifyToken, asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return res.status(404).json({ message: "Comment not found" });
  }

  if (comment.userId.toString() !== req.userId.toString()) {
    return res.status(403).json({ message: "Not authorized to delete this comment" });
  }

  await comment.deleteOne();
  res.json({ message: "Comment deleted successfully" });
}));

// Like/Unlike comment
router.post("/:id/like", verifyToken, asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return res.status(404).json({ message: "Comment not found" });
  }

  const userIdStr = req.userId.toString();
  const likedByIndex = comment.likedBy.findIndex(id => id.toString() === userIdStr);

  if (likedByIndex > -1) {
    comment.likedBy.splice(likedByIndex, 1);
    comment.likes = Math.max(0, comment.likes - 1);
  } else {
    comment.likedBy.push(req.userId);
    comment.likes++;
  }

  await comment.save();

  res.json({ 
    likes: comment.likes, 
    isLiked: likedByIndex === -1 
  });
}));

export default router;

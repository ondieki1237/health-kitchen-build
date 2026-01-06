import express from "express";
import Comment from "../../models/Comment.js";
import Recipe from "../../models/Recipe.js";
import Menu from "../../models/Menu.js";
import Notification from "../../models/Notification.js";
import { verifyToken, optionalAuth } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";

const router = express.Router();

// Get comments for a recipe or menu
router.get("/", optionalAuth, asyncHandler(async (req, res) => {
  const { targetId, targetType = "Recipe", page = 1, limit = 20 } = req.query;

  if (!targetId) {
    return res.status(400).json({ message: "targetId is required" });
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [comments, total] = await Promise.all([
    Comment.find({ targetId, targetType, parentComment: null })
      .sort("-createdAt")
      .skip(skip)
      .limit(parseInt(limit))
      .populate("user", "displayName avatar username")
      .lean(),
    Comment.countDocuments({ targetId, targetType, parentComment: null })
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
  const { targetId, targetType, content, parentComment, rating, modifications, cookingTips, userPhoto } = req.body;

  if (!targetId || !content) {
    return res.status(400).json({ message: "targetId and content are required" });
  }

  const comment = new Comment({
    targetId,
    targetType: targetType || "Recipe",
    user: req.userId,
    content,
    parentComment,
    rating,
    modifications,
    cookingTips,
    userPhoto
  });

  await comment.save();

  // Update comment count on target
  const Model = targetType === "Menu" ? Menu : Recipe;
  await Model.findByIdAndUpdate(targetId, {
    $inc: { "stats.commentsCount": 1 }
  });

  // If rating provided, update average rating
  if (rating) {
    const target = await Model.findById(targetId);
    const newTotalRatings = target.stats.totalRatings + 1;
    const newAverageRating = 
      (target.stats.averageRating * target.stats.totalRatings + rating) / newTotalRatings;
    
    await Model.findByIdAndUpdate(targetId, {
      $set: {
        "stats.averageRating": newAverageRating,
        "stats.totalRatings": newTotalRatings
      }
    });
  }

  // If it's a reply, update parent comment
  if (parentComment) {
    await Comment.findByIdAndUpdate(parentComment, {
      $inc: { repliesCount: 1 },
      $set: { hasReplies: true }
    });
    
    // Create notification for parent comment author
    const parentCommentDoc = await Comment.findById(parentComment);
    if (parentCommentDoc && parentCommentDoc.user.toString() !== req.userId.toString()) {
      await Notification.create({
        recipient: parentCommentDoc.user,
        sender: req.userId,
        type: "reply",
        targetType: "Comment",
        targetId: comment._id,
        message: "replied to your comment"
      });
    }
  }

  const populatedComment = await Comment.findById(comment._id)
    .populate("user", "displayName avatar username");

  res.status(201).json(populatedComment);
}));

// Get replies for a comment
router.get("/:id/replies", optionalAuth, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [replies, total] = await Promise.all([
    Comment.find({ parentComment: req.params.id })
      .sort("createdAt")
      .skip(skip)
      .limit(parseInt(limit))
      .populate("user", "displayName avatar username")
      .lean(),
    Comment.countDocuments({ parentComment: req.params.id })
  ]);

  res.json({
    replies,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// Update comment
router.put("/:id", verifyToken, asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return res.status(404).json({ message: "Comment not found" });
  }

  if (comment.user.toString() !== req.userId.toString()) {
    return res.status(403).json({ message: "Not authorized to update this comment" });
  }

  comment.content = req.body.content || comment.content;
  comment.rating = req.body.rating ?? comment.rating;
  comment.modifications = req.body.modifications || comment.modifications;
  comment.cookingTips = req.body.cookingTips || comment.cookingTips;
  comment.isEdited = true;
  comment.editedAt = new Date();
  
  await comment.save();

  const updatedComment = await Comment.findById(comment._id)
    .populate("user", "displayName avatar username");

  res.json(updatedComment);
}));

// Delete comment
router.delete("/:id", verifyToken, asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return res.status(404).json({ message: "Comment not found" });
  }

  if (comment.user.toString() !== req.userId.toString()) {
    return res.status(403).json({ message: "Not authorized to delete this comment" });
  }

  // Update target's comment count
  const Model = comment.targetType === "Menu" ? Menu : Recipe;
  await Model.findByIdAndUpdate(comment.targetId, {
    $inc: { "stats.commentsCount": -1 }
  });

  // If it had a parent, update parent's reply count
  if (comment.parentComment) {
    await Comment.findByIdAndUpdate(comment.parentComment, {
      $inc: { repliesCount: -1 }
    });
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
    
    // Create notification for comment author
    if (comment.user.toString() !== req.userId.toString()) {
      await Notification.create({
        recipient: comment.user,
        sender: req.userId,
        type: "like",
        targetType: "Comment",
        targetId: comment._id,
        message: "liked your comment"
      });
    }
  }

  await comment.save();

  res.json({ 
    likes: comment.likes, 
    isLiked: likedByIndex === -1 
  });
}));

export default router;

const mongoose = require("mongoose");

async function getCollaborativeScores(BookActivity, bookId, { maxUsers = 400, maxCandidates = 500 } = {}) {
  if (!bookId) return [];
  const bookObjectId = new mongoose.Types.ObjectId(String(bookId));

  const users = await BookActivity.find({
    book: bookObjectId,
    $or: [{ readAt: { $ne: null } }, { viewedAt: { $ne: null } }],
  })
    .select("user")
    .limit(maxUsers)
    .lean();

  const userIds = users.map((u) => u.user).filter(Boolean);
  if (userIds.length === 0) return [];

  return BookActivity.aggregate([
    {
      $match: {
        user: { $in: userIds },
        book: { $ne: bookObjectId },
        $or: [{ readAt: { $ne: null } }, { viewedAt: { $ne: null } }],
      },
    },
    {
      $project: {
        book: 1,
        score: {
          $cond: [{ $ne: ["$readAt", null] }, 2, 1],
        },
        readers: { $literal: 1 },
      },
    },
    {
      $group: {
        _id: "$book",
        score: { $sum: "$score" },
        readers: { $sum: "$readers" },
      },
    },
    { $sort: { score: -1, readers: -1 } },
    { $limit: maxCandidates },
  ]);
}

module.exports = {
  getCollaborativeScores,
};

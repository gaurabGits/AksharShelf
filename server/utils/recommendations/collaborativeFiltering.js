const mongoose = require("mongoose");

async function getCollaborativeScores(BookActivity, bookId, { maxUsers = 400, maxCandidates = 500 } = {}) {
  if (!bookId) return [];
  const bookObjectId = new mongoose.Types.ObjectId(String(bookId));

  const users = await BookActivity.find({
    book: bookObjectId,
    $or: [{ viewedAt: { $ne: null } }, { readAt: { $ne: null } }],
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
        $or: [{ viewedAt: { $ne: null } }, { readAt: { $ne: null } }],
      },
    },
    {
      $project: {
        book: 1,
        score: {
          $add: [
            { $cond: [{ $ne: ["$readAt", null] }, 2, 0] },
            { $cond: [{ $ne: ["$viewedAt", null] }, 1, 0] },
          ],
        },
        readers: { $cond: [{ $ne: ["$readAt", null] }, 1, 0] },
        viewers: { $cond: [{ $ne: ["$viewedAt", null] }, 1, 0] },
      },
    },
    {
      $group: {
        _id: "$book",
        score: { $sum: "$score" },
        readers: { $sum: "$readers" },
        viewers: { $sum: "$viewers" },
      },
    },
    { $sort: { score: -1, readers: -1, viewers: -1 } },
    { $limit: maxCandidates },
  ]);
}

module.exports = {
  getCollaborativeScores,
};


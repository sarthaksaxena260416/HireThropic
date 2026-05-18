import Session from '../models/Session.model.js';

export const getStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [
      totalSessions,
      completedSessions,
      avgScoreResult,
      topicBreakdown,
      recentSessions,
      scoreOverTime,
    ] = await Promise.all([
      Session.countDocuments({ user: userId }),
      Session.countDocuments({ user: userId, status: 'completed' }),
      Session.aggregate([
        { $match: { user: userId, status: 'completed', score: { $ne: null } } },
        { $group: { _id: null, avg: { $avg: '$score' } } },
      ]),
      Session.aggregate([
        { $match: { user: userId, status: 'completed' } },
        {
          $group: {
            _id: '$topic',
            count: { $sum: 1 },
            avgScore: { $avg: '$score' },
          },
        },
      ]),
      Session.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('topic difficulty score status createdAt duration'),
      Session.find({ user: userId, status: 'completed', score: { $ne: null } })
        .sort({ createdAt: 1 })
        .limit(20)
        .select('topic score createdAt'),
    ]);

    res.json({
      overview: {
        totalSessions,
        completedSessions,
        avgScore: avgScoreResult[0]?.avg ? Math.round(avgScoreResult[0].avg) : null,
        completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
      },
      topicBreakdown: topicBreakdown.map((t) => ({
        topic: t._id,
        count: t.count,
        avgScore: t.avgScore ? Math.round(t.avgScore) : null,
      })),
      recentSessions,
      scoreOverTime: scoreOverTime.map((s) => ({
        date: s.createdAt.toISOString().split('T')[0],
        score: s.score,
        topic: s.topic,
      })),
    });
  } catch (err) {
    next(err);
  }
};
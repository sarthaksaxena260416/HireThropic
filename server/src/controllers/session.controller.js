import Session from '../models/Session.model.js';

export const createSession = async (req, res, next) => {
  try {
    const { topic, difficulty = 'medium' } = req.body;

    if (!['dsa', 'hr', 'system-design'].includes(topic)) {
      return res.status(400).json({ error: 'Invalid topic.' });
    }

    const session = await Session.create({
      user: req.user._id,
      topic,
      difficulty,
      messages: [],
    });

    res.status(201).json({ session });
  } catch (err) {
    next(err);
  }
};

export const getSession = async (req, res, next) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    res.json({ session });
  } catch (err) {
    next(err);
  }
};

export const addMessage = async (req, res, next) => {
  try {
    const { role, content } = req.body;

    const session = await Session.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!session) return res.status(404).json({ error: 'Session not found.' });
    if (session.status !== 'active') {
      return res.status(400).json({ error: 'Session is already completed.' });
    }

    session.messages.push({ role, content });
    if (role === 'user') session.questionCount += 1;
    await session.save();

    res.json({ session });
  } catch (err) {
    next(err);
  }
};

export const completeSession = async (req, res, next) => {
  try {
    const { score, feedback, strengths, improvements, duration } = req.body;

    const session = await Session.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!session) return res.status(404).json({ error: 'Session not found.' });

    session.status = 'completed';
    session.score = score ?? null;
    session.feedback = feedback ?? null;
    session.strengths = strengths ?? [];
    session.improvements = improvements ?? [];
    session.duration = duration ?? 0;
    await session.save();

    res.json({ session });
  } catch (err) {
    next(err);
  }
};

export const getUserSessions = async (req, res, next) => {
  try {
    const { topic, status, limit = 20, page = 1 } = req.query;
    const filter = { user: req.user._id };
    if (topic) filter.topic = topic;
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [sessions, total] = await Promise.all([
      Session.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-messages'),
      Session.countDocuments(filter),
    ]);

    res.json({
      sessions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};
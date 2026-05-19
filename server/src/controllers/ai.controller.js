import Groq from 'groq-sdk';
import Session from '../models/Session.model.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPTS = {
  dsa: `You are a senior software engineer conducting a Data Structures & Algorithms interview.
Your role:
- Ask one DSA question at a time based on the chosen difficulty
- Listen to the candidate's answer carefully
- Ask follow-up questions to probe deeper understanding
- Give hints if the candidate is completely stuck (after 2 attempts)
- After 5-6 exchanges, wrap up and evaluate

Difficulty context:
- Easy: arrays, strings, hash maps, basic sorting
- Medium: trees, graphs, dynamic programming, sliding window
- Hard: advanced DP, segment trees, complex graph algorithms

Keep responses concise. Be encouraging but rigorous.`,

  hr: `You are an experienced HR professional conducting a behavioral interview.
Your role:
- Ask behavioral questions using the STAR framework
- Probe for specifics when answers are vague
- Cover topics like: teamwork, conflict resolution, leadership, failure/growth
- After each answer, ask a thoughtful follow-up
- After 5-6 exchanges, wrap up naturally

Be warm, professional, and conversational.`,

  'system-design': `You are a principal engineer conducting a system design interview.
Your role:
- Present a real-world system design problem
- Guide the candidate through: requirements clarification, high-level design, deep dives
- Ask about: scalability, database choices, caching, load balancing, API design
- Challenge assumptions and probe trade-off reasoning

Focus on thought process over memorized answers.`,
};

export const chat = async (req, res, next) => {
  try {
    const { sessionId, userMessage } = req.body;

    if (!sessionId || !userMessage?.trim()) {
      return res.status(400).json({ error: 'sessionId and userMessage are required.' });
    }

    const session = await Session.findOne({
      _id: sessionId,
      user: req.user._id,
    });

    if (!session) return res.status(404).json({ error: 'Session not found.' });
    if (session.status !== 'active') {
      return res.status(400).json({ error: 'Session is completed.' });
    }

    session.messages.push({ role: 'user', content: userMessage });

    const recentMessages = session.messages.slice(-20).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let fullResponse = '';

    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS[session.topic] + `\n\nDifficulty: ${session.difficulty}.` },
        ...recentMessages,
      ],
      stream: true,
      max_tokens: 1024,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    session.messages.push({ role: 'assistant', content: fullResponse });
    await session.save();

    res.write(`data: ${JSON.stringify({ done: true, messageCount: session.messages.length })}\n\n`);
    res.end();
  } catch (err) {
    console.error('[AI chat error]', err.message);
    if (!res.headersSent) {
      next(err);
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
};

export const evaluateSession = async (req, res, next) => {
  try {
    const { sessionId } = req.body;

    const session = await Session.findOne({
      _id: sessionId,
      user: req.user._id,
    });

    if (!session) return res.status(404).json({ error: 'Session not found.' });
    if (session.messages.length < 4) {
      return res.status(400).json({ error: 'Session too short to evaluate.' });
    }

    const transcript = session.messages
      .map((m) => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`)
      .join('\n\n');

    const result = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You evaluated a ${session.topic} interview (difficulty: ${session.difficulty}).

Transcript:
${transcript}

Provide a JSON evaluation with ONLY these fields (no other text, no markdown):
{
  "score": <0-100 integer>,
  "feedback": "<2-3 sentence overall summary>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<area 1>", "<area 2>", "<area 3>"]
}`,
        },
      ],
    });

    const raw = result.choices[0].message.content;
    let evaluation;
    try {
      evaluation = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      evaluation = { score: 70, feedback: raw, strengths: [], improvements: [] };
    }

    session.score = evaluation.score;
    session.feedback = evaluation.feedback;
    session.strengths = evaluation.strengths;
    session.improvements = evaluation.improvements;
    session.status = 'completed';
    await session.save();

    res.json({ evaluation, session });
  } catch (err) {
    next(err);
  }
};
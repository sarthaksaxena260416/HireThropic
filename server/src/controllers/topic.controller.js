export const getTopics = async (req, res) => {
  res.json({
    topics: [
      {
        id: 'dsa',
        name: 'Data Structures & Algorithms',
        description: 'Arrays, trees, graphs, dynamic programming, and more.',
        difficulties: ['easy', 'medium', 'hard'],
        estimatedTime: '20-40 min',
      },
      {
        id: 'hr',
        name: 'Behavioral (HR)',
        description: 'STAR-method questions on teamwork, leadership, and growth.',
        difficulties: ['easy', 'medium', 'hard'],
        estimatedTime: '15-30 min',
      },
      {
        id: 'system-design',
        name: 'System Design',
        description: 'Design scalable systems like Twitter, Uber, and URL shorteners.',
        difficulties: ['medium', 'hard'],
        estimatedTime: '30-60 min',
      },
    ],
  });
};
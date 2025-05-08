import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface LeaderboardEntry {
  email: string;
  quizzes_completed: number;
  average_score: number | string;
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const data = await api.quizzes.getLeaderboard();
        setLeaderboard(data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  if (loading) {
    return <div>Loading leaderboard...</div>;
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Leaderboard</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">Top 10 quiz takers</p>
      </div>
      <div className="border-t border-gray-200">
        <ul role="list" className="divide-y divide-gray-200">
          {leaderboard.map((entry, index) => (
            <li key={index} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{index + 1}</span>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{entry.email}</div>
                    <div className="text-sm text-gray-500">{entry.quizzes_completed} quizzes completed</div>
                  </div>
                </div>
                <div className="text-sm text-gray-900">
                  {typeof entry.average_score === 'number' ? entry.average_score.toFixed(2) : entry.average_score}% average score
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
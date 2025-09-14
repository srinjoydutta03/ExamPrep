import { useEffect, useState } from 'react';
import { leaderboardAPI, userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface LeaderboardEntry {
  _id: string;
  username: string;
  isAdmin: boolean;
  metric: number;
}

export default function LeaderboardPage() {
  const [verifiedLeaderboard, setVerifiedLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [upvotesLeaderboard, setUpvotesLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch verified leaderboard IDs
        const verifiedRes = await leaderboardAPI.getVerified();
        const verifiedIds: string[] = verifiedRes.data;

        // Fetch total upvotes leaderboard IDs
        const upvotesRes = await leaderboardAPI.getTotalUpvotes();
        const upvoteIds: string[] = upvotesRes.data;

        // Fetch user info for each ID (combine unique IDs)
        const uniqueIds = Array.from(new Set([...verifiedIds, ...upvoteIds]));
        const userPromises = uniqueIds.map((id) => userAPI.getById(id).then((res) => res.data));
        const users = await Promise.all(userPromises);

        // Map ID to user details
        const userMap: Record<string, { username: string; isAdmin: boolean }> = {};
        users.forEach((u) => {
          userMap[u._id] = { username: u.name, isAdmin: !!u.isAdmin };
        });

        // Build leaderboard arrays with metrics
        const verifiedLB: LeaderboardEntry[] = verifiedIds.map((id) => ({
          _id: id,
          username: userMap[id]?.username || 'Unknown',
          isAdmin: userMap[id]?.isAdmin || false,
          metric: 0, // backend doesn't provide metric count in simple list; optional future improvement
        }));

        const upvotesLB: LeaderboardEntry[] = upvoteIds.map((id) => ({
          _id: id,
          username: userMap[id]?.username || 'Unknown',
          isAdmin: userMap[id]?.isAdmin || false,
          metric: 0,
        }));

        setVerifiedLeaderboard(verifiedLB);
        setUpvotesLeaderboard(upvotesLB);
      } catch (err) {
        console.error('Failed to fetch leaderboard data:', err);
        setError('Failed to load leaderboard. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  const renderLeaderboard = (title: string, data: LeaderboardEntry[]) => (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-lg w-full md:w-1/2">
      <h2 className="text-xl font-semibold text-blue-200 mb-4 text-center">{title}</h2>
      <table className="w-full text-left text-blue-100">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="py-2 px-3">Rank</th>
            <th className="py-2 px-3">User</th>
            <th className="py-2 px-3">Admin</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry, index) => (
            <tr
              key={entry._id}
              className={`border-b border-gray-700 ${index % 2 === 0 ? 'bg-gray-900/50' : 'bg-gray-900/10'}`}
            >
              <td className="py-2 px-3 font-semibold text-blue-300">#{index + 1}</td>
              <td className="py-2 px-3 font-medium text-blue-50">{entry.username}</td>
              <td className="py-2 px-3">
                {entry.isAdmin ? (
                  <span className="inline-block bg-yellow-700 text-yellow-100 text-xs px-2 py-0.5 rounded-full">Admin</span>
                ) : (
                  <span className="inline-block bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">User</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-200">Leaderboard</h1>
      <div className="flex flex-col md:flex-row gap-6">
        {renderLeaderboard('Most Verified Questions', verifiedLeaderboard)}
        {renderLeaderboard('Most Upvotes on Verified Questions', upvotesLeaderboard)}
      </div>
    </div>
  );
} 
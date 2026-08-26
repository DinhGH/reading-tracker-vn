import React, { useState } from "react";
import SessionEventTimeline from "./SessionEventTimeline";

const SessionList = ({ sessions }) => {
  const [expanded, setExpanded] = useState({});

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.start_time) - new Date(a.start_time),
  );

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Sessions</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto shadow-sm border border-gray-100 rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold">
                  Session ID
                </th>
                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold">
                  Article
                </th>
                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold">
                  Start Time
                </th>
                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold">
                  Active Time
                </th>
                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold">
                  URL
                </th>
                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sortedSessions.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-8 text-center text-gray-500 italic"
                  >
                    No sessions found
                  </td>
                </tr>
              ) : (
                sortedSessions.map((session) => (
                  <React.Fragment key={session.id}>
                    <tr className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-gray-500 bg-gray-50/50">
                        {session.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        <div
                          className="max-w-xs truncate"
                          title={session.article?.title}
                        >
                          {session.article?.title || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(session.start_time)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-indigo-600">
                        {formatTime(session.total_active_time)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {session.articleUrl ? (
                          <a
                            href={session.articleUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline transition-all"
                          >
                            Visit Link
                          </a>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <button
                          className="px-4 py-2 bg-white border border-gray-300 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-sm transition-all"
                          onClick={() => toggleExpand(session.id)}
                        >
                          {expanded[session.id] ? "Collapse" : "Expand"}
                        </button>
                      </td>
                    </tr>
                    {expanded[session.id] && (
                      <tr>
                        <td colSpan={6} className="p-4 bg-gray-50">
                          <SessionEventTimeline events={session.events || []} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SessionList;

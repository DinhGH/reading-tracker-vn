/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import ChartSkeleton from "./ChartSkeleton";
import {
  BarChart3,
  Clock,
  FileText,
  Eye,
  CheckCircle,
  Activity,
} from "lucide-react";
import MetricCard from "./MetricCard";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const TopicDomainChart = ({ articles, sessions, stats }) => {
  const totalArticles = articles.length;
  const totalSessions = sessions.length;
  const activeSessions = sessions.filter((s) => s.status === "ACTIVE").length;
  const completedSessions = sessions.filter(
    (s) => s.status === "COMPLETED",
  ).length;
  const totalReadTime = sessions.reduce(
    (sum, s) =>
      sum + (typeof s.total_active_time === "number" ? s.total_active_time : 0),
    0,
  );
  const avgReadTime =
    totalSessions > 0 ? Math.round(totalReadTime / totalSessions) : 0;

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} min ${s} sec`;
  };

  const articleSummary = stats?.articleSessionStats?.summary || {
    totalArticles,
    totalSessions,
    activeSessions,
    completedSessions,
    totalReadTime: totalReadTime,
    avgReadTimePerSession: Math.round(
      totalReadTime / Math.max(totalSessions, 1),
    ),
  };

  // FIX: Always use Array.isArray + fallback empty array to prevent falsy, undefined, null issues!
  const weeklyData = Array.isArray(stats?.weeklyStats)
    ? stats.weeklyStats.map((s) => ({
        day: s.day ? s.day.substring(0, 3) : "",
        topics: typeof s.topics === "number" ? s.topics : 0,
        readingTime: typeof s.readingTime === "number" ? s.readingTime : 0,
      }))
    : [];

  // Professional color palette inspired by modern dashboards
  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  // FIX: Defensive: eventActivity có thể null/undefined
  const eventPieData =
    stats?.articleSessionStats?.eventActivity &&
    typeof stats.articleSessionStats.eventActivity === "object"
      ? Object.entries(stats.articleSessionStats.eventActivity).map(
          ([name, value]) => ({
            name,
            value,
          }),
        )
      : [];

  const sessionStatusData = [
    { name: "Active", value: activeSessions },
    { name: "Completed", value: completedSessions },
  ];

  return (
    <div className="w-full min-h-[600px]">
      <div className="space-y-8">
        {/* Article Session Summary Stats */}
        {articleSummary && (
          <div className="bg-[#ffffff] rounded-lg p-6 shadow-md">
            <h3 className="text-xl font-bold mb-6 text-gray-900">
              Overall Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MetricCard
                title="Total Articles"
                value={articleSummary.totalArticles}
                icon={FileText}
              />
              <MetricCard
                title="Total Sessions"
                value={articleSummary.totalSessions}
                icon={Activity}
              />
              <MetricCard
                title="Active Sessions"
                value={articleSummary.activeSessions}
                icon={Eye}
              />
              <MetricCard
                title="Completed Sessions"
                value={articleSummary.completedSessions}
                icon={CheckCircle}
              />
              <MetricCard
                title="Total Read Time"
                value={formatDuration(articleSummary.totalReadTime)}
                icon={Clock}
              />
              <MetricCard
                title="Avg Read Time/Session"
                value={formatDuration(
                  Math.round(articleSummary.avgReadTimePerSession),
                )}
                icon={BarChart3}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weekly Stats Chart */}
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
            <h3 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
              Weekly Activity Trends
            </h3>
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend />
                  <Bar
                    radius={[4, 4, 0, 0]}
                    dataKey="topics"
                    fill="#6366f1"
                    name="Topics/Domains"
                  />
                  <Bar
                    radius={[4, 4, 0, 0]}
                    dataKey="readingTime"
                    fill="#10b981"
                    name="Reading Time (min)"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartSkeleton height={300} />
            )}
          </div>

          {/* Interaction Patterns Pie Chart */}
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
            <h3 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
              User Interaction Patterns
            </h3>
            {eventPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={eventPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={false}
                  >
                    {eventPieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <ChartSkeleton height={300} />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Session Status Doughnut */}
          <div className="lg:col-span-1 bg-white rounded-lg p-6 shadow-md border border-gray-100">
            <h3 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
              Session Lifecycle
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={sessionStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#10b981" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Articles (Moved inside the grid) */}
          <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-md border border-gray-100">
            <h3 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
              Most Engaging Articles
            </h3>
            {stats && stats.topArticles?.length > 0 ? (
              <div className="space-y-3">
                {stats.topArticles.slice(0, 4).map((article, idx) => (
                  <div
                    key={article.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="font-semibold text-gray-800 truncate">
                        {idx + 1}. {article.title}
                      </p>
                      <p className="text-sm text-gray-500">{article.domain}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {article.read_count} reads
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ChartSkeleton height={200} />
            )}
          </div>
        </div>

        {/* Detailed metrics section removed from here as it's now integrated above */}
      </div>
    </div>
  );
};

export default TopicDomainChart;

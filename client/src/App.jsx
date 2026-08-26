import { useEffect, useState } from "react";
import TopicDomainChart from "./components/TopicDomainChart";
import { io } from "socket.io-client";
import axios from "axios";
import ArticleList from "./components/ArticleList";
import SessionList from "./components/SessionList";
import "./App.css";

function App() {
  const [articles, setArticles] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch data from API
  const fetchData = async () => {
    try {
      const [articlesResponse, sessionsResponse, statsResponse] =
        await Promise.all([
          axios.get("http://localhost:5000/api/articles"),
          axios.get("http://localhost:5000/api/sessions"),
          axios.get("http://localhost:5000/api/stats"),
        ]);

      setArticles(articlesResponse.data.data || []);
      setSessions(sessionsResponse.data.data || []);
      setStats(statsResponse.data.data || null);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize Socket.io connection and fetch initial data
  useEffect(() => {
    const newSocket = io("http://localhost:5000");

    newSocket.on("connect", () => {
      console.log("Connected to server");
      fetchData();
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    // Listen for real-time dashboard updates with data
    newSocket.on("dashboard_update", (data) => {
      console.log("Dashboard update event received:", data);

      // Destructure received data
      const { updatedArticles, updatedSessions, updatedStats } = data;

      // Update states with validated data
      if (updatedArticles) {
        setArticles(updatedArticles);
      }
      if (updatedSessions) {
        setSessions(updatedSessions);
      }
      if (updatedStats) {
        setStats(updatedStats);
      }
    });

    // Cleanup Socket.io connection
    return () => {
      newSocket.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Reading Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Track your news reading behavior and statistics
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Grid */}
        <div className="mb-8">
          <TopicDomainChart
            articles={articles}
            sessions={sessions}
            stats={stats}
          />
        </div>

        {/* Articles Table */}
        <ArticleList articles={articles} />

        {/* Sessions Table */}
        <SessionList sessions={sessions} />
      </div>
    </div>
  );
}

export default App;

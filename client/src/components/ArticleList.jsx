import React, { useState } from "react";

const ArticleList = ({ articles }) => {
  const [expandedArticleId, setExpandedArticleId] = useState(null);

  const handleExpandClick = (id) => {
    setExpandedArticleId(expandedArticleId === id ? null : id);
  };

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return "0m 0s";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  // DEBUG LOG START
  if (articles && articles.length > 0) {
    // eslint-disable-next-line no-console
    console.log("DEBUG ArticleList DATA >>>", articles);
  }
  // DEBUG LOG END

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Articles Read</h2>
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold">
                  Title
                </th>
                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold">
                  Domain
                </th>
                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold">
                  Reads
                </th>
                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold">
                  Total Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {articles.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-8 text-center text-gray-500 italic"
                  >
                    No articles found
                  </td>
                </tr>
              ) : (
                articles.map((article) => (
                  <React.Fragment key={article.id}>
                    <tr
                      className={
                        "hover:bg-blue-50/50 transition-colors cursor-pointer" +
                        (expandedArticleId === article.id ? " bg-blue-50" : "")
                      }
                      onClick={() => handleExpandClick(article.id)}
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {article.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                        {article.domain}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                        {article.read_count}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-indigo-600">
                        {formatTime(
                          Number.isFinite(article.total_read_time)
                            ? article.total_read_time
                            : Number.isFinite(article.totalReadTime)
                              ? article.totalReadTime
                              : 0,
                        )}
                      </td>
                    </tr>
                    {expandedArticleId === article.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={4} className="px-8 py-4">
                          <div>
                            <div className="font-semibold mb-2 text-gray-700">
                              Tóm tắt nội dung
                            </div>
                            <div className="text-gray-900 mb-2">
                              {article.summary || (
                                <span className="italic text-gray-400">
                                  (Chưa có tóm tắt)
                                </span>
                              )}
                            </div>
                            <div className="font-semibold mb-1 text-gray-700">
                              Đề tài / Chủ đề
                            </div>
                            <div className="text-gray-900">
                              {article.topic || (
                                <span className="italic text-gray-400">
                                  (Chưa xác định đề tài)
                                </span>
                              )}
                            </div>
                          </div>
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

export default ArticleList;

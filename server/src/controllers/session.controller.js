import sessionService from "../services/session.service.js";

const getSessions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await sessionService.getSessions(
      parseInt(page),
      parseInt(limit),
    );
    res.status(200).json({
      success: true,
      data: result.data.map((session) => ({
        ...session,
        articleUrl: session.articleUrl,
      })),
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export default {
  getSessions,
};

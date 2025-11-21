import supabase from "../supabaseClient.js";

export const getRecentActivity = async (req, res, next) => {
  const { limit = 10 } = req.query;
  try {
    const { data, error } = await supabase
      .from("activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(parseInt(limit, 10));

    if (error) return next(error);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const getAllActivity = async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    // Get total count
    const { count, error: countError } = await supabase
      .from("activity_log")
      .select("*", { count: "exact", head: true });

    if (countError) return next(countError);

    // Get paginated data
    const { data, error } = await supabase
      .from("activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) return next(error);

    res.status(200).json({
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

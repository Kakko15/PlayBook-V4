import jwt from "jsonwebtoken";
import supabase from "../supabaseClient.js";
const JWT_SECRET = process.env.JWT_SECRET;

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "No token provided, authorization denied." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, role, status")
      .eq("id", decoded.userId)
      .single();

    if (userError || !user) {
      return res
        .status(401)
        .json({ message: "User not found for this token." });
    }

    if (user.status === "suspended") {
      return res.status(403).json({ message: "Account has been suspended." });
    }

    if (user.status !== "active") {
      return res.status(403).json({ message: "Account is not active." });
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired." });
    }
    return res.status(401).json({ message: "Token is not valid." });
  }
};

export const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === "super_admin") {
    next();
  } else {
    return res
      .status(403)
      .json({ message: "Access denied. Requires Super Admin privileges." });
  }
};

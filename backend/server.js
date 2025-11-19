import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import csurf from "csurf";
import authRoutes from "./routes/authRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import tournamentRoutes from "./routes/tournamentRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import predictionRoutes from "./routes/predictionRoutes.js";
import dataScienceRoutes from "./routes/dataScienceRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "./.env") });

const app = express();
const port = process.env.PORT || 3001;

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

const csrfProtection = csurf({
  cookie: {
    key: "_csrf",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
  ignoreMethods: ["GET", "HEAD", "OPTIONS"],
  value: (req) => {
    return (
      req.headers["x-xsrf-token"] ||
      req.headers["x-csrf-token"] ||
      req.body._csrf
    );
  },
});

app.use(csrfProtection);

app.get("/api", (req, res) => {
  res.cookie("XSRF-TOKEN", req.csrfToken(), {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  res.status(200).json({
    message: "PlayBook API is running successfully!",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/predictions", predictionRoutes);
app.use("/api/ds", dataScienceRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/departments", departmentRoutes);

app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    console.error("CSRF Token Error:", {
      headers: req.headers,
      cookies: req.cookies,
      body: req.body,
    });
    return res.status(403).json({
      message: "Invalid CSRF token.",
      debug:
        process.env.NODE_ENV === "development"
          ? {
              receivedHeader: req.headers["x-xsrf-token"],
              hasCookie: !!req.cookies._csrf,
            }
          : undefined,
    });
  }
  next(err);
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "An internal server error occurred." });
});

app.listen(port, () => {
  console.log(
    `[PlayBook] Backend server is running at http://localhost:${port}`
  );
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.warn(
      "\x1b[33m%s\x1b[0m",
      "[WARNING] Supabase keys are not set. Please create a .env file based on .env.example"
    );
  } else {
    console.log("\x1b[32m%s\x1b[0m", "[PlayBook] Supabase client connected.");
  }
});

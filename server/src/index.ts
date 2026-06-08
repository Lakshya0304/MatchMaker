import "dotenv/config";

import express from "express";
import cors from "cors";
import authRoutes from "./auth/login";
import customerRoutes from "./customers/customers.routes";
import matchingRoutes from "./Matching/matching";
import { protectRoute } from "./middlewares/authMiddleware";

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "TDC API is running 🚀" });
});

// Global error handler
// app.use(
//   (
//     err: any,
//     _req: express.Request,
//     res: express.Response,
//     _next: express.NextFunction,
//   ) => {
//     console.error(err.stack);
//     res.status(500).json({
//       success: false,
//       message: "Something went wrong",
//       error: process.env.NODE_ENV === "development" ? err.message : undefined,
//     });
//   },
// );

app.use("/api/auth", authRoutes);
app.use("/api/customers", protectRoute, customerRoutes);
app.use("/api/matching", protectRoute, matchingRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(process.env.DATABASE_URL);
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;

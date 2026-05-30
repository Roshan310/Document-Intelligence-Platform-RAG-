import express from "express";
import authRoutes from "./routes/auth.route";
import ragRoutes from "./routes/rag.route";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/api/auth", authRoutes);
app.use("/api/rag", ragRoutes);

export default app;

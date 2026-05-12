import express from "express";
import authRoutes from "./routes/auth.route";
import cors from "cors";


const app = express();
app.use(cors());
app.use(express.json())


app.use("/api/auth", authRoutes)

export default app;

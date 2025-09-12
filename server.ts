import express, { Application } from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";  

import chequeRoutes from "./route/cheque.routes";
import authRoutes from "./route/auth.routes";
import planRoutes from "./route/plan.routes";
import paymentRoutes from "./route/paymentRoutes";
import { connectDB } from "./database";
import gstRoutes from "./route/gstRoutes";
import dashboard from "./route/dashboard";


dotenv.config();

const app: Application = express();
app.use(cors({
  origin: true,
  credentials: true,                    
}));
app.use(bodyParser.json());

app.use("/api/cheques", chequeRoutes);
app.use("/api/cheques", authRoutes)
app.use("/api/cheques",planRoutes)
app.use("/api/cheques",paymentRoutes)
app.use("/api/cheques", gstRoutes);
app.use("/api/dashboard", dashboard);
connectDB();

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

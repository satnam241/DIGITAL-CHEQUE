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
import wizardform from "./route/wizard.routes";
import admin from "./route/admin.routes"
import cookieParser from "cookie-parser";
dotenv.config();

const app: Application = express();
app.use(cors({
  origin: true,
  credentials: true,                    
}));
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS)
app.get("/", (_req, res) => {
  res.send("🚀 Facebook Webhook API Live!");
});

app.use(bodyParser.json());
app.use(cookieParser());
app.use("/api/cheques", chequeRoutes);
app.use("/api/cheques", authRoutes)
app.use("/api/cheques",planRoutes)
app.use("/api/payment",paymentRoutes)
app.use("/api/cheques", gstRoutes);
app.use("/api/dashboard", dashboard);
app.use("/api/wizard-form", wizardform);
app.use("/api/admin",admin)
connectDB();

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

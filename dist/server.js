"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const cheque_routes_1 = __importDefault(require("./route/cheque.routes"));
const auth_routes_1 = __importDefault(require("./route/auth.routes"));
const plan_routes_1 = __importDefault(require("./route/plan.routes"));
const paymentRoutes_1 = __importDefault(require("./route/paymentRoutes"));
const database_1 = require("./database");
const gstRoutes_1 = __importDefault(require("./route/gstRoutes"));
const dashboard_1 = __importDefault(require("./route/dashboard"));
const wizard_routes_1 = __importDefault(require("./route/wizard.routes"));
const admin_routes_1 = __importDefault(require("./route/admin.routes"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
}));
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);
app.use(body_parser_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use("/api/cheques", cheque_routes_1.default);
app.use("/api/cheques", auth_routes_1.default);
app.use("/api/cheques", plan_routes_1.default);
app.use("/api/payment", paymentRoutes_1.default);
app.use("/api/cheques", gstRoutes_1.default);
app.use("/api/dashboard", dashboard_1.default);
app.use("/api/wizard-form", wizard_routes_1.default);
app.use("/api/admin", admin_routes_1.default);
(0, database_1.connectDB)();
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

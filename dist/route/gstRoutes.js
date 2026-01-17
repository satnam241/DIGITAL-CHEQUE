"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const gstController_1 = require("../controllers/gstController");
const router = express_1.default.Router();
router.post("/validate-gst", gstController_1.validateGST);
router.post("/calculate-gst", gstController_1.calculateGSTAmount);
exports.default = router;

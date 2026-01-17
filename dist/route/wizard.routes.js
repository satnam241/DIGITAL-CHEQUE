"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const wizard_controller_1 = require("../controllers/wizard.controller");
const router = express_1.default.Router();
router.post("/step2", wizard_controller_1.saveStep2);
router.post("/order-details", wizard_controller_1.saveOrderDetails);
router.get("/review", wizard_controller_1.reviewDetails);
router.post("/finalize", wizard_controller_1.finalizeWizard);
exports.default = router;

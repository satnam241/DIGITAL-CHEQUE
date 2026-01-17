"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const chequeSchema = new mongoose_1.Schema({
    payee: { type: String, required: true },
    amount: { type: Number, required: true },
    amountInWords: { type: String, required: true }, // controller will handle conversion
    date: { type: Date, required: true },
    total: { type: Number, default: 0 },
    used: { type: Number, default: 0 },
    history: {
        type: [mongoose_1.Schema.Types.Mixed],
        default: [],
    },
}, { timestamps: true } // createdAt & updatedAt
);
// Export the model
const Cheque = (0, mongoose_1.model)("Cheque", chequeSchema);
exports.default = Cheque;

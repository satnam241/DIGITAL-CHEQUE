"use strict";
// // utils/gstCalculator.ts
// export function calculateGST(price: number, quantity: number = 1, gstRate: number = 0.18) {
//     const taxableAmount = price * quantity;
//     const gst = +(taxableAmount * gstRate).toFixed(2);
//     const payableAmount = +(taxableAmount + gst).toFixed(2);
Object.defineProperty(exports, "__esModule", { value: true });
exports.GST_RATE = void 0;
exports.calculateGST = calculateGST;
//     return {
//       taxableAmount,
//       gst,
//       payableAmount,
//     };
//   }
exports.GST_RATE = 0.18;
async function calculateGST(price, quantity = 1) {
    try {
        const taxableAmount = Number(price) * Number(quantity);
        const gst = Number((taxableAmount * 0.18).toFixed(2));
        const payableAmount = Number((taxableAmount + gst).toFixed(2));
        return { success: true, data: { taxableAmount, gst, payableAmount } };
    }
    catch (err) {
        return { success: false, error: err.message || "Error calculating GST" };
    }
}

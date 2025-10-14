// // utils/gstCalculator.ts
// export function calculateGST(price: number, quantity: number = 1, gstRate: number = 0.18) {
//     const taxableAmount = price * quantity;
//     const gst = +(taxableAmount * gstRate).toFixed(2);
//     const payableAmount = +(taxableAmount + gst).toFixed(2);
  
//     return {
//       taxableAmount,
//       gst,
//       payableAmount,
//     };
//   }
export const GST_RATE = 0.18;

export function calculateGstForAmount(amount: number) {
  const taxableAmount = Number(amount);
  const gst = Number((taxableAmount * GST_RATE).toFixed(2));
  const payableAmount = Number((taxableAmount + gst).toFixed(2));
  return { taxableAmount, gst, payableAmount };
}

// utils/gstCalculator.ts
export function calculateGST(price: number, quantity: number = 1, gstRate: number = 0.18) {
    const taxableAmount = price * quantity;
    const gst = +(taxableAmount * gstRate).toFixed(2);
    const payableAmount = +(taxableAmount + gst).toFixed(2);
  
    return {
      taxableAmount,
      gst,
      payableAmount,
    };
  }
  
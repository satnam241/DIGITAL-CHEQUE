// // // config/razorpay.ts
// // import Razorpay from "razorpay";
// // import dotenv from "dotenv";

// // dotenv.config();
// // const razorpay = new Razorpay({
// //   key_id: process.env.RAZORPAY_KEY_ID as string,
// //   key_secret: process.env.RAZORPAY_KEY_SECRET as string,
// // });

// // export default razorpay;
// import Razorpay from "razorpay";
// import dotenv from "dotenv";

// dotenv.config();
// if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
//   throw new Error("❌ Razorpay Key ID or Secret is missing in environment variables");
// }

// export const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

import Razorpay from "razorpay";
import dotenv from "dotenv";
import path from "path";

// ✅ Ensure dotenv loads from the project root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error("❌ Razorpay env keys missing");
  console.error("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID);
  console.error("RAZORPAY_KEY_SECRET:", process.env.RAZORPAY_KEY_SECRET ? "Loaded ✅" : "❌ Missing");
  throw new Error("❌ Razorpay Key ID or Secret missing in environment variables");
}

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

console.log("✅ Razorpay initialized successfully");

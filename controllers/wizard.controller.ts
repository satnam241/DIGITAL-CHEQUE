import { Request, Response } from "express";
import User from "../model/user.model";
import Transaction from "../model/transaction.model";
import Plan from "../model/plan.model";
// ---------------- Save Step2 (Address + Company Details) ----------------
export const saveStep2 = async (req: Request, res: Response) => {
  try {
    const {
      salutation,
      fullName,
      email,
      phone,
      companyName,
      gstNo,
      address,
      pinCode,
      city,
      state,
      planId, // frontend optional
    } = req.body;

    // 1️⃣ Find user by email or create new
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ fullName, email, phone });
    }

    // 2️⃣ Update basic details
    user.salutation = salutation;
    user.fullName = fullName;
    user.phone = phone;
    user.companyName = companyName;
    user.gstNo = gstNo;
    user.address = address;
    user.pinCode = pinCode;
    user.city = city;
    user.state = state;

    // 3️⃣ Assign plan
    let plan;
    if (planId) {
      plan = await Plan.findById(planId);
    }
    if (!plan) {
      // agar planId missing ya invalid hai → assign default plan
      plan = await Plan.findOne({ isDefault: true }); 
      // Note: Plan model me isDefault: boolean field hona chahiye
    }
    if (!plan) return res.status(400).json({ message: "No plan available" });
    user.plan = plan._id;

    await user.save();

    return res.json({ message: "Step 2 saved successfully", user });
  } catch (error) {
    console.error("Save Step2 error:", error);
    return res.status(500).json({ message: "Error saving step2", error });
  }
};
// ---------------- Save Order Details (Step 3 before payment) ----------------
export const saveOrderDetails = async (req: Request, res: Response) => {
  try {
    const { email, planId, quantity, payableAmount } = req.body;

    // guest user find or create
    let user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.plan = planId;
    await user.save();

    return res.json({
      message: "Order details saved",
      orderSummary: { planId, quantity, payableAmount },
    });
  } catch (error) {
    console.error("Save order details error:", error);
    return res.status(500).json({ message: "Error saving order details", error });
  }
};

// ---------------- Review Step ----------------
export const reviewDetails = async (req: Request, res: Response) => {
  try {
    const { email } = req.query; // guest email
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await User.findOne({ email }).populate("plan");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({ message: "Review fetched", user });
  } catch (error) {
    console.error("Review details error:", error);
    return res.status(500).json({ message: "Error fetching review details", error });
  }
};

// ---------------- Finalize after Payment ----------------
export const finalizeWizard = async (req: Request, res: Response) => {
  try {
    const { email, transactionId } = req.body;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    if (transaction.status !== "SUCCESS") {
      return res.status(400).json({ message: "Payment not successful" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const planDurationDays = 30; // TODO: get from Plan model
    user.planExpiry = new Date(Date.now() + planDurationDays * 24 * 60 * 60 * 1000);

    await user.save();

    return res.json({ message: "Wizard completed successfully", user });
  } catch (error) {
    console.error("Finalize wizard error:", error);
    return res.status(500).json({ message: "Error finalizing wizard", error });
  }
};

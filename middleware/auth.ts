// import { Request, Response, NextFunction } from "express";
// import jwt, { JwtPayload } from "jsonwebtoken";
// import User from "../model/user.model";

// const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// export interface AuthRequest extends Request {
//   user?: any;
// }

// export const authMiddleware = async (
//   req: AuthRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     // Token from cookie or Authorization header
//     const token =
//       req.cookies?.token || req.headers["authorization"]?.split(" ")[1];

//     if (!token) {
//       return res.status(401).json({ message: "No token provided" });
//     }

//     // Decode token
//     const payload = jwt.verify(token, JWT_SECRET) as JwtPayload & {
//       userId: string;
//     };

//     // Find user
//     const user = await User.findById(payload.userId);

//     if (!user) {
//       return res.status(401).json({ message: "User not found" });
//     }

//     // Match with currentToken if you are using session-based single login
//     if (user.currentToken && user.currentToken !== token) {
//       return res
//         .status(401)
//         .json({ message: "Session expired or logged in elsewhere" });
//     }

//     // Attach user object to req
//     req.user = user;
//     next();
//   } catch (err) {
//     console.error("Auth error:", err);
//     return res.status(401).json({ message: "Invalid or expired token" });
//   }
// };
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../model/user.model";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Token from cookie or Authorization header
    const token =
      req.cookies?.token || req.headers["authorization"]?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify token
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload & { userId: string };

    const user = await User.findById(payload.userId);
    if (!user) return res.status(401).json({ message: "User not found" });

    // Check single-session token (optional)
    if (user.currentToken && user.currentToken !== token) {
      return res.status(401).json({ message: "Session expired or logged in elsewhere" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

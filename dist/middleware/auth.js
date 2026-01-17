"use strict";
// import { Request, Response, NextFunction } from "express";
// import jwt, { JwtPayload } from "jsonwebtoken";
// import User from "../model/user.model";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../model/user.model"));
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const authMiddleware = async (req, res, next) => {
    try {
        // Token from cookie or Authorization header
        const token = req.cookies?.token || req.headers["authorization"]?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }
        // Verify token
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await user_model_1.default.findById(payload.userId);
        if (!user)
            return res.status(401).json({ message: "User not found" });
        // Check single-session token (optional)
        if (user.currentToken && user.currentToken !== token) {
            return res.status(401).json({ message: "Session expired or logged in elsewhere" });
        }
        req.user = user;
        next();
    }
    catch (err) {
        console.error("Auth error:", err);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
exports.authMiddleware = authMiddleware;

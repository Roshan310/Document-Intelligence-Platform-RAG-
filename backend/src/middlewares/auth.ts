import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { AuthRole, JwtUser } from "../types/auth";
import * as userRepo from "../repositories/user.repo";

export type AuthenticatedRequest = Request & {
  user?: JwtUser;
};

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.header("authorization");

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Missing authorization token",
    });
  }

  const token = header.slice(7);

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JwtUser;

    const user = await userRepo.findUserById(decoded.id);

    if (!user) {
      return res.status(403).json({
        message: "Account not found",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: "Account is blocked",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Email not verified",
      });
    }

    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}

export function requireRole(...allowedRoles: AuthRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;

    if (!user) {
      return res.status(401).json({
        message: "Missing authorization token",
      });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    next();
  };
}
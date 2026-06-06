import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as repo from "../repositories/user.repo";
import { AuthRole, AuthUser } from "../types/auth";
import { sendVerificationEmail } from "./email.service";
import { generateGravatarUrl, generateVerificationToken, buildVerificationUrl } from "../utils/user.utils";

export const APP_URL = process.env.APP_URL ?? `http://localhost:${process.env.PORT ?? 8000}`;
const JWT_SECRET = process.env.JWT_SECRET!;
const VERIFICATION_SUCCESS_URL =
    process.env.VERIFICATION_SUCCESS_URL ?? `${APP_URL}/api/auth/verification-success`;

const generateToken = (user: { id: number; role: AuthRole }) =>
    jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
        expiresIn: "24h",
    });

const toAuthUser = (user: {
    id: number;
    email: string;
    role: AuthRole;
    isBlocked: boolean;
    avatarUrl?: string | null;
}): AuthUser => ({
    id: user.id,
    email: user.email,
    role: user.role,
    isBlocked: user.isBlocked,
    avatarUrl: user.avatarUrl ?? generateGravatarUrl(user.email),
});

export const register = async (
    email: string,
    password: string,
    role?: AuthRole
) => {
    const existing = await repo.findUserByEmail(email);

    if (existing) {
        throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole: AuthRole = role || "user";
    const avatarUrl = generateGravatarUrl(email);
    const verificationToken = generateVerificationToken();
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await repo.createUser(
        email,
        hashedPassword,
        userRole,
        avatarUrl,
        verificationToken,
        verificationExpiresAt
    );
    const token = generateToken(user);

    await sendVerificationEmail(
        email,
        buildVerificationUrl(verificationToken)
    );

    return {
        user: toAuthUser(user),
        token,
        verificationRequired: true,
        verificationEmailSent: true,
    };

}

export const login = async (email: string, password: string) => {
    const user = await repo.findUserByEmail(email);

    if (!user) {
        throw new Error("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error("Invalid credentials");
    }

    if (user.isBlocked) {
        throw new Error("Account is blocked");
    }

    if (!user.isVerified) {
        throw new Error("Email not verified");
    }

    const token = generateToken(user);

    return { user: toAuthUser(user), token };
};

export const verifyEmail = async (token: string) => {
    if (!token) {
        throw new Error("Verification token is required");
    }

    const user = await repo.findUserByVerificationToken(token);

    if (!user) {
        throw new Error("Invalid or expired verification token");
    }

    if (!user.verificationExpiresAt || user.verificationExpiresAt.getTime() < Date.now()) {
        throw new Error("Invalid or expired verification token");
    }

    const verifiedUser = await repo.markUserAsVerified(user.id);

    return {
        user: verifiedUser
            ? toAuthUser(verifiedUser)
            : toAuthUser(user),
        redirectUrl: VERIFICATION_SUCCESS_URL,
    };
};

export const blockUser = async (targetUserId: number, actorUserId: number) => {
    const targetUser = await repo.findUserById(targetUserId);

    if (!targetUser) {
        throw new Error("User not found");
    }

    if (targetUser.role === "admin") {
        throw new Error("Cannot modify admin users");
    }

    if (targetUser.id === actorUserId) {
        throw new Error("Cannot modify your own account");
    }

    const updatedUser = await repo.setUserBlockedStatus(targetUser.id, true);

    return updatedUser ? toAuthUser(updatedUser) : toAuthUser(targetUser);
};

export const unblockUser = async (targetUserId: number, actorUserId: number) => {
    const targetUser = await repo.findUserById(targetUserId);

    if (!targetUser) {
        throw new Error("User not found");
    }

    if (targetUser.role === "admin") {
        throw new Error("Cannot modify admin users");
    }

    if (targetUser.id === actorUserId) {
        throw new Error("Cannot modify your own account");
    }

    const updatedUser = await repo.setUserBlockedStatus(targetUser.id, false);

    return updatedUser ? toAuthUser(updatedUser) : toAuthUser(targetUser);
};

export const updatePassword = async (
    userId: number,
    currentPassword: string,
    newPassword: string
) => {
    if (!currentPassword || !newPassword) {
        throw new Error("Current password and new password are required");
    }

    if (newPassword.length < 8) {
        throw new Error("New password must be at least 8 characters");
    }

    if (currentPassword === newPassword) {
        throw new Error("New password must be different from current password");
    }

    const user = await repo.findUserById(userId);

    if (!user) {
        throw new Error("User not found");
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
        throw new Error("Current password is incorrect");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = await repo.updateUserPassword(user.id, hashedPassword);

    return updatedUser ? toAuthUser(updatedUser) : toAuthUser(user);
};

export const listUsers = async (excludedUserId: number) => {
    const users = await repo.listUsersExceptId(excludedUserId);

    return users.map((user) => toAuthUser(user));
};

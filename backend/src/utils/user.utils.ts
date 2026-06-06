import crypto from "crypto";
import { APP_URL } from "../services/auth.service";

export const generateGravatarUrl = (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const hash = crypto.createHash("md5").update(normalizedEmail).digest("hex");

    return `https://www.gravatar.com/avatar/${hash}?s=200&d=identicon&r=g`;
};

export const generateVerificationToken = () => crypto.randomBytes(32).toString("hex");

export const buildVerificationUrl = (token: string) =>
    `${APP_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
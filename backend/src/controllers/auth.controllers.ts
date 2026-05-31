import * as authService from "../services/auth.service";

export const register = async (req: any, res: any) => {
    try {
    const {email, password, role} = req.body ?? {};

    if (!email || !password) {
        return res.status(400).json({
            message: "email and password are required",
        });
    }

    const result = await authService.register(email, password, role);
    res.status(201).json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Registration failed";
        const status = message === "User already exists" ? 409 : 500;

        res.status(status).json({ message });
    }
}

export const login = async (req: any , res: any) => {
    try {
    const {email, password} = req.body ?? {};

    if (!email || !password) {
        return res.status(400).json({
            message: "email and password are required",
        });
    }

    const result = await authService.login(email, password);
    res.json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Login failed";
        const status = message === "Invalid credentials"
            ? 401
            : message === "Email not verified" || message === "Account is blocked"
                ? 403
                : 500;

        res.status(status).json({ message });
    }
}

export const verifyEmail = async (req: any, res: any) => {
    try {
        const token = String(req.query?.token ?? "");
        const result = await authService.verifyEmail(token);

        return res.redirect(result.redirectUrl);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Verification failed";
        const status = message === "Invalid or expired verification token" || message === "Verification token is required" ? 400 : 500;

        res.status(status).json({ message });
    }
}

export const blockUser = async (req: any, res: any) => {
    try {
        const targetUserId = Number(req.params?.id);
        const actorUserId = Number(req.user?.id);

        if (!Number.isFinite(targetUserId)) {
            return res.status(400).json({
                message: "Valid user id is required",
            });
        }

        const result = await authService.blockUser(targetUserId, actorUserId);

        return res.json({
            message: "User blocked",
            user: result,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Block failed";
        const status = message === "User not found"
            ? 404
            : message === "Cannot modify admin users" || message === "Cannot modify your own account"
                ? 403
                : 500;

        res.status(status).json({ message });
    }
}

export const unblockUser = async (req: any, res: any) => {
    try {
        const targetUserId = Number(req.params?.id);
        const actorUserId = Number(req.user?.id);

        if (!Number.isFinite(targetUserId)) {
            return res.status(400).json({
                message: "Valid user id is required",
            });
        }

        const result = await authService.unblockUser(targetUserId, actorUserId);

        return res.json({
            message: "User unblocked",
            user: result,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unblock failed";
        const status = message === "User not found"
            ? 404
            : message === "Cannot modify admin users" || message === "Cannot modify your own account"
                ? 403
                : 500;

        res.status(status).json({ message });
    }
}

export const verificationSuccess = (req: any, res: any) => {
    res.status(200).send(`
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Email verified</title>
          </head>
          <body style="font-family: Arial, sans-serif; margin: 40px; color: #111827;">
            <h1>Email verified successfully</h1>
            <p>Your account is now active. You can sign in and continue using the app.</p>
          </body>
        </html>
    `);
}
import nodemailer from "nodemailer";

const hasSmtpConfig = Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
);

const transporter = hasSmtpConfig
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    })
    : null;

const fromAddress = process.env.SMTP_USER ?? "no-reply@localhost";

export const sendVerificationEmail = async (
    recipientEmail: string,
    verificationUrl: string
) => {
    const subject = "Verify your email address";
    const text = [
        "Welcome!",
        "",
        "Please verify your email address by opening this link:",
        verificationUrl,
        "",
        "This link expires in 24 hours.",
    ].join("\n");

    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
            <h2>Verify your email address</h2>
            <p>Welcome! Please verify your email address by clicking the link below.</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p>This link expires in 24 hours.</p>
        </div>
    `;

    if (!transporter) {
        console.log("Verification email not sent because SMTP is not configured.");
        console.log("To:", recipientEmail);
        console.log("Verification link:", verificationUrl);
        return;
    }

    await transporter.sendMail({
        from: fromAddress,
        to: recipientEmail,
        subject,
        text,
        html,
    });
};
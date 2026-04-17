"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOtpEmail = sendOtpEmail;
exports.sendWelcomeEmail = sendWelcomeEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
async function sendOtpEmail(to, otp, name) {
    await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject: "Your Dispatch password reset code",
        html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7c3aed">Dispatch</h2>
        <p>Hi ${name},</p>
        <p>Use this code to reset your password. It expires in <strong>10 minutes</strong>.</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#7c3aed;margin:24px 0">
          ${otp}
        </div>
        <p style="color:#666;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
    });
}
async function sendWelcomeEmail(to, name, userId) {
    await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject: "Welcome to Dispatch!",
        html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7c3aed">Welcome to Dispatch, ${name}!</h2>
        <p>Your account has been created successfully.</p>
        <p>Your user ID is: <strong>${userId}</strong></p>
        <p>Start riding or driving today.</p>
      </div>
    `,
    });
}
//# sourceMappingURL=mailer.js.map
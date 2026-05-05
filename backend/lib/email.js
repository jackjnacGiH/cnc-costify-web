/**
 * Email module — sends transactional emails via SMTP (Hostinger by default).
 *
 * Required env vars:
 *   SMTP_HOST     e.g. smtp.hostinger.com
 *   SMTP_PORT     465 (SSL) | 587 (TLS)
 *   SMTP_USER     info@cnccostify.cloud
 *   SMTP_PASS     <password>
 *   SMTP_FROM     "CNC Costify AI <info@cnccostify.cloud>"  (optional, defaults to SMTP_USER)
 *   APP_BASE_URL  https://www.cnccostify.cloud  (for verify/reset links)
 *
 * Public API:
 *   sendVerifyEmail({ to, token, locale, name? })
 *   sendResetEmail({ to, token, locale, name? })
 *   sendWelcomeEmail({ to, locale, name? })
 *
 * Falls back to console.log if SMTP not configured (dev mode).
 */
const nodemailer = require('nodemailer');

let _transporter = null;

function _isConfigured() {
    return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function _getTransporter() {
    if (_transporter) return _transporter;
    if (!_isConfigured()) return null;
    _transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '465', 10),
        secure: parseInt(process.env.SMTP_PORT || '465', 10) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
    return _transporter;
}

function _from() {
    return process.env.SMTP_FROM || `CNC Costify AI <${process.env.SMTP_USER || 'info@cnccostify.cloud'}>`;
}

function _baseUrl() {
    return (process.env.APP_BASE_URL || 'https://www.cnccostify.cloud').replace(/\/+$/, '');
}

async function _send({ to, subject, html, text }) {
    const transport = _getTransporter();
    if (!transport) {
        console.warn('[email] SMTP not configured — logging instead:');
        console.warn(`  TO: ${to}`);
        console.warn(`  SUBJECT: ${subject}`);
        console.warn(`  TEXT: ${text}`);
        return { mocked: true };
    }
    const info = await transport.sendMail({
        from: _from(),
        to,
        subject,
        html,
        text,
    });
    console.log(`[email] sent to ${to}: ${info.messageId}`);
    return info;
}

// ─── Templates ─────────────────────────────────────────────────────────────

function _wrapTemplate(bodyHtml, locale = 'th') {
    return `<!DOCTYPE html>
<html lang="${locale}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, sans-serif; background: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
    .container { max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #2563eb 0%, #9333ea 100%); padding: 32px 24px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 900; }
    .header .tagline { color: rgba(255,255,255,0.85); margin-top: 8px; font-size: 14px; }
    .body { padding: 32px 24px; }
    .body h2 { color: #0f172a; font-size: 22px; margin: 0 0 16px; }
    .body p { color: #475569; line-height: 1.6; font-size: 15px; }
    .btn { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #2563eb 0%, #9333ea 100%); color: white !important; text-decoration: none; font-weight: bold; border-radius: 10px; margin: 24px 0; }
    .footer { padding: 24px; background: #f1f5f9; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .footer a { color: #2563eb; text-decoration: none; }
    .code { background: #f1f5f9; padding: 8px 12px; border-radius: 6px; font-family: monospace; font-size: 13px; word-break: break-all; }
</style></head><body>
<div class="container">
    <div class="header">
        <h1>CNC Costify AI</h1>
        <div class="tagline">${locale === 'th' ? 'คำนวณราคา CNC ด้วย AI' : 'AI-Powered CNC Pricing'}</div>
    </div>
    <div class="body">${bodyHtml}</div>
    <div class="footer">
        ${locale === 'th'
          ? '© 2026 บริษัท เจ แนค (ประเทศไทย) จำกัด<br><a href="https://www.cnccostify.cloud">www.cnccostify.cloud</a> · info@cnccostify.cloud · 08 1144 2000'
          : '© 2026 J Nac (Thailand) Co., Ltd.<br><a href="https://www.cnccostify.cloud">www.cnccostify.cloud</a> · info@cnccostify.cloud · +66 8 1144 2000'}
    </div>
</div></body></html>`;
}

function verifyEmailTemplate({ token, locale = 'th', name }) {
    const link = `${_baseUrl()}/${locale}/verify-email?token=${encodeURIComponent(token)}`;
    if (locale === 'th') {
        return {
            subject: '✅ ยืนยันอีเมลของคุณ — CNC Costify AI',
            html: _wrapTemplate(`
                <h2>ยินดีต้อนรับ${name ? ' ' + name : ''}! 👋</h2>
                <p>ขอบคุณที่สมัครสมาชิก CNC Costify AI กรุณายืนยันอีเมลของคุณเพื่อเริ่มใช้งาน</p>
                <p style="text-align:center;"><a href="${link}" class="btn">ยืนยันอีเมล →</a></p>
                <p style="font-size: 13px; color: #94a3b8;">หรือคัดลอกลิงก์นี้ไปที่ browser:</p>
                <p class="code">${link}</p>
                <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">ลิงก์นี้จะใช้ได้ตลอดจนกว่าจะยืนยัน หากไม่ได้สมัคร กรุณาเพิกเฉยอีเมลนี้</p>
            `, 'th'),
            text: `ยินดีต้อนรับ${name ? ' ' + name : ''}!\n\nกรุณายืนยันอีเมลโดยเปิดลิงก์:\n${link}\n\nหากไม่ได้สมัคร กรุณาเพิกเฉย`,
        };
    }
    return {
        subject: '✅ Verify your email — CNC Costify AI',
        html: _wrapTemplate(`
            <h2>Welcome${name ? ' ' + name : ''}! 👋</h2>
            <p>Thanks for signing up for CNC Costify AI. Please verify your email to start using the service.</p>
            <p style="text-align:center;"><a href="${link}" class="btn">Verify Email →</a></p>
            <p style="font-size: 13px; color: #94a3b8;">Or copy this link to your browser:</p>
            <p class="code">${link}</p>
            <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">This link is valid until verified. If you didn't sign up, please ignore this email.</p>
        `, 'en'),
        text: `Welcome${name ? ' ' + name : ''}!\n\nVerify your email:\n${link}\n\nIf you didn't sign up, please ignore.`,
    };
}

function resetPasswordTemplate({ token, locale = 'th', name }) {
    const link = `${_baseUrl()}/${locale}/reset-password?token=${encodeURIComponent(token)}`;
    if (locale === 'th') {
        return {
            subject: '🔑 รีเซ็ตรหัสผ่าน — CNC Costify AI',
            html: _wrapTemplate(`
                <h2>ขอรีเซ็ตรหัสผ่าน 🔑</h2>
                <p>${name ? `สวัสดี ${name},` : 'สวัสดี'}</p>
                <p>เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ คลิกปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่:</p>
                <p style="text-align:center;"><a href="${link}" class="btn">รีเซ็ตรหัสผ่าน →</a></p>
                <p style="font-size: 13px; color: #94a3b8;">หรือคัดลอกลิงก์นี้:</p>
                <p class="code">${link}</p>
                <p style="font-size: 12px; color: #dc2626; margin-top: 24px;"><strong>⏰ ลิงก์นี้หมดอายุใน 1 ชั่วโมง</strong></p>
                <p style="font-size: 12px; color: #94a3b8;">หากไม่ได้ขอรีเซ็ต กรุณาเพิกเฉยอีเมลนี้ — รหัสผ่านเดิมยังใช้งานได้</p>
            `, 'th'),
            text: `ขอรีเซ็ตรหัสผ่าน\n\nคลิกลิงก์เพื่อตั้งรหัสผ่านใหม่:\n${link}\n\nลิงก์หมดอายุใน 1 ชั่วโมง`,
        };
    }
    return {
        subject: '🔑 Reset your password — CNC Costify AI',
        html: _wrapTemplate(`
            <h2>Password Reset Request 🔑</h2>
            <p>${name ? `Hi ${name},` : 'Hi,'}</p>
            <p>We received a request to reset your password. Click the button below to set a new password:</p>
            <p style="text-align:center;"><a href="${link}" class="btn">Reset Password →</a></p>
            <p style="font-size: 13px; color: #94a3b8;">Or copy this link:</p>
            <p class="code">${link}</p>
            <p style="font-size: 12px; color: #dc2626; margin-top: 24px;"><strong>⏰ This link expires in 1 hour</strong></p>
            <p style="font-size: 12px; color: #94a3b8;">If you didn't request a reset, please ignore this email — your current password remains active.</p>
        `, 'en'),
        text: `Password Reset Request\n\nReset link (expires in 1 hour):\n${link}`,
    };
}

function welcomeTemplate({ locale = 'th', name }) {
    if (locale === 'th') {
        return {
            subject: '🎉 ยินดีต้อนรับสู่ CNC Costify AI',
            html: _wrapTemplate(`
                <h2>ยินดีต้อนรับ${name ? ' ' + name : ''}! 🎉</h2>
                <p>อีเมลของคุณยืนยันเรียบร้อยแล้ว — ขอบคุณที่ร่วมเป็นส่วนหนึ่งของ CNC Costify AI</p>
                <p>ตอนนี้คุณสามารถ:</p>
                <ul style="line-height: 1.8;">
                    <li>📐 อัปโหลดไฟล์ STEP คำนวณปริมาตร + Stock Size อัตโนมัติ</li>
                    <li>💰 คำนวณราคาวัสดุ + CNC + Coating + Surface ครบครัน</li>
                    <li>📊 ใช้ฐานข้อมูลวัสดุ 100+ รายการ</li>
                    <li>📑 บันทึกผลลัพธ์ลง Excel ทันที</li>
                </ul>
                <p style="text-align:center;"><a href="${_baseUrl()}/${locale}/account" class="btn">เข้าสู่บัญชี →</a></p>
                <p>มีคำถาม? ติดต่อเราที่ <a href="mailto:info@cnccostify.cloud">info@cnccostify.cloud</a></p>
            `, 'th'),
            text: `ยินดีต้อนรับ${name ? ' ' + name : ''}!\n\nอีเมลยืนยันแล้ว เข้าสู่บัญชี: ${_baseUrl()}/${locale}/account`,
        };
    }
    return {
        subject: '🎉 Welcome to CNC Costify AI',
        html: _wrapTemplate(`
            <h2>Welcome${name ? ' ' + name : ''}! 🎉</h2>
            <p>Your email is verified — thanks for joining CNC Costify AI.</p>
            <p>You can now:</p>
            <ul style="line-height: 1.8;">
                <li>📐 Upload STEP files for auto volume + stock size analysis</li>
                <li>💰 Calculate Material + CNC + Coating + Surface costs</li>
                <li>📊 Use 100+ materials database</li>
                <li>📑 Save results to Excel instantly</li>
            </ul>
            <p style="text-align:center;"><a href="${_baseUrl()}/${locale}/account" class="btn">Go to Account →</a></p>
            <p>Questions? Email us at <a href="mailto:info@cnccostify.cloud">info@cnccostify.cloud</a></p>
        `, 'en'),
        text: `Welcome${name ? ' ' + name : ''}!\n\nEmail verified. Go to: ${_baseUrl()}/${locale}/account`,
    };
}

// ─── Public API ─────────────────────────────────────────────────────────────

async function sendVerifyEmail({ to, token, locale = 'th', name }) {
    const tpl = verifyEmailTemplate({ token, locale, name });
    return _send({ to, subject: tpl.subject, html: tpl.html, text: tpl.text });
}

async function sendResetEmail({ to, token, locale = 'th', name }) {
    const tpl = resetPasswordTemplate({ token, locale, name });
    return _send({ to, subject: tpl.subject, html: tpl.html, text: tpl.text });
}

async function sendWelcomeEmail({ to, locale = 'th', name }) {
    const tpl = welcomeTemplate({ locale, name });
    return _send({ to, subject: tpl.subject, html: tpl.html, text: tpl.text });
}

module.exports = {
    sendVerifyEmail,
    sendResetEmail,
    sendWelcomeEmail,
    isConfigured: _isConfigured,
};

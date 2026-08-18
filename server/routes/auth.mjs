import express from 'express';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { dataDir } from '../config/env.mjs';
import { loadJsonProfiles } from '../services/personalRag.mjs';

const router = express.Router();
const userAccountsFilePath = path.join(dataDir, 'users_accounts.json');
export const verificationCodesMap = new Map();

export const loadUserAccounts = () => {
    if (!fs.existsSync(userAccountsFilePath)) {
        const initialUsers = [
            {
                username: 'admin',
                passwordHash: bcrypt.hashSync('admin123', 10),
                role: 'admin',
                phone: '13800138000',
                email: 'admin@gzhu.edu.cn',
                createdAt: new Date().toISOString()
            }
        ];
        try {
            fs.writeFileSync(userAccountsFilePath, JSON.stringify(initialUsers, null, 2), 'utf8');
        } catch (e) { }
        return initialUsers;
    }
    try {
        return JSON.parse(fs.readFileSync(userAccountsFilePath, 'utf8'));
    } catch {
        return [];
    }
};

export const saveUserAccounts = (accounts) => {
    try {
        fs.writeFileSync(userAccountsFilePath, JSON.stringify(accounts, null, 2), 'utf8');
    } catch (e) {
        console.error('Failed to save user accounts:', e);
    }
};

export const hashPassword = (password) => {
    return bcrypt.hashSync(password, 10);
};

export const verifyPassword = (password, storedHashOrPlain) => {
    if (!storedHashOrPlain) return false;
    if (storedHashOrPlain.startsWith('$2a$') || storedHashOrPlain.startsWith('$2b$')) {
        return bcrypt.compareSync(password, storedHashOrPlain);
    }
    return password === storedHashOrPlain;
};

// --- Authentication & Verification Code APIs ---
router.post('/send-code', async (req, res) => {
    const { target, type } = req.body || {};
    if (!target || !type) {
        return res.status(400).json({ ok: false, error: 'Target (phone/email) and type required' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expireAt = Date.now() + 5 * 60 * 1000;
    verificationCodesMap.set(target, { code, expireAt, type });

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 465);
    const smtpUser = process.env.SMTP_USER || process.env.MAIL_FROM;
    const smtpPass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
    const smtpSecure = process.env.SMTP_SECURE_ENABLED === '1' || (process.env.SMTP_SECURE_ENABLED !== '0' && smtpPort === 465);
    const mailFromName = process.env.MAIL_FROM_NAME || '广州大学招生问答平台';
    const mailFrom = process.env.MAIL_FROM || smtpUser;

    if (type === 'email' && smtpHost && smtpUser && smtpPass) {
        try {
            const transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpSecure,
                auth: { user: smtpUser, pass: smtpPass }
            });
            await transporter.sendMail({
                from: `"${mailFromName}" <${mailFrom}>`,
                to: target,
                subject: '【广州大学招生问答平台】您的注册验证码',
                text: `您的验证码是 ${code}，有效期 5 分钟。如非本人操作请忽略。`
            });
            console.log(`✉️ [SMTP Email Sent] Successfully sent verification code ${code} to ${target}`);
        } catch (e) {
            console.error('SMTP Email Send Error:', e.message);
        }
    }

    console.log(`🔑 [Verification Code] ${type} target: ${target} -> Code: ${code}`);
    res.json({
        ok: true,
        message: `验证码已发送至您的${type === 'phone' ? '手机' : '邮箱'}，5分钟内有效！`,
        debugCode: code
    });
});

router.post('/register-advanced', (req, res) => {
    const { username, password, target, type, code } = req.body || {};
    if (!username || !password || !target || !code) {
        return res.status(400).json({ ok: false, error: '所有注册字段均为必填' });
    }

    const stored = verificationCodesMap.get(target);
    if (!stored) {
        return res.status(400).json({ ok: false, error: '请先点击获取验证码' });
    }
    if (Date.now() > stored.expireAt) {
        verificationCodesMap.delete(target);
        return res.status(400).json({ ok: false, error: '验证码已过期，请重新获取' });
    }
    if (stored.code !== code.trim()) {
        return res.status(400).json({ ok: false, error: '验证码输入错误' });
    }

    const users = loadUserAccounts();
    if (users.some(u => u.username === username.trim())) {
        return res.status(400).json({ ok: false, error: '该账号名已被注册' });
    }

    const newUser = {
        username: username.trim(),
        passwordHash: hashPassword(password),
        role: 'user',
        phone: type === 'phone' ? target.trim() : '',
        email: type === 'email' ? target.trim() : '',
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUserAccounts(users);
    verificationCodesMap.delete(target);

    res.json({ ok: true, user: { username: newUser.username, role: newUser.role, phone: newUser.phone, email: newUser.email } });
});

router.post('/register', (req, res) => {
    const { username, password, phone, email } = req.body || {};
    if (!username || !password) {
        return res.status(400).json({ ok: false, error: '账号和密码均为必填' });
    }

    const users = loadUserAccounts();
    if (users.some(u => u.username === username.trim())) {
        return res.status(400).json({ ok: false, error: '该账号名已被注册' });
    }

    const newUser = {
        username: username.trim(),
        passwordHash: hashPassword(password),
        role: 'user',
        phone: phone || '',
        email: email || '',
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUserAccounts(users);

    res.json({ ok: true, user: { username: newUser.username, role: newUser.role, phone: newUser.phone, email: newUser.email } });
});

router.post('/login', (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
        return res.status(400).json({ ok: false, error: '账号和密码不能为空' });
    }

    const users = loadUserAccounts();
    const userIdx = users.findIndex(u => u.username === username.trim());

    if (userIdx === -1 && username.trim() === 'admin' && password === 'admin123') {
        const adminUser = {
            username: 'admin',
            passwordHash: hashPassword('admin123'),
            role: 'admin',
            phone: '13800138000',
            email: 'admin@gzhu.edu.cn',
            createdAt: new Date().toISOString()
        };
        users.push(adminUser);
        saveUserAccounts(users);
        return res.json({ ok: true, user: adminUser });
    }

    if (userIdx === -1) {
        return res.status(401).json({ ok: false, error: '账号不存在或密码错误' });
    }

    const user = users[userIdx];
    const isValid = verifyPassword(password, user.passwordHash || user.password);
    if (!isValid) {
        return res.status(401).json({ ok: false, error: '账号不存在或密码错误' });
    }

    if (user.password || (user.passwordHash && !user.passwordHash.startsWith('$2a$') && !user.passwordHash.startsWith('$2b$'))) {
        user.passwordHash = hashPassword(password);
        delete user.password;
        saveUserAccounts(users);
        console.log(`🔒 [Bcrypt Upgrade] Upgraded password hash for user: ${username}`);
    }

    const profiles = loadJsonProfiles();
    const profile = profiles[user.username] || {};

    res.json({
        ok: true,
        user: {
            username: user.username,
            role: user.role || 'user',
            phone: user.phone || '',
            email: user.email || '',
            profile
        }
    });
});

export default router;

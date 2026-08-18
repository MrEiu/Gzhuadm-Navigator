import express from 'express';
import fs from 'fs';
import path from 'path';
import { dataDir, uploadsDir } from '../config/env.mjs';
import { pgPool, usePostgres } from '../services/postgres.mjs';
import {
    loadJsonProfiles, saveJsonProfiles,
    loadJsonPersonalRag, getUserProfile,
    saveUserPersonalMemory
} from '../services/personalRag.mjs';
import { loadUserAccounts, saveUserAccounts, hashPassword, verifyPassword } from './auth.mjs';

const router = express.Router();

// --- User Sessions Persistence & Cache APIs ---
const sessionsFilePath = path.join(dataDir, 'user_sessions.json');

export const loadJsonSessions = () => {
    if (!fs.existsSync(sessionsFilePath)) return {};
    try {
        return JSON.parse(fs.readFileSync(sessionsFilePath, 'utf8'));
    } catch {
        return {};
    }
};

export const saveJsonSessions = (data) => {
    try {
        fs.writeFileSync(sessionsFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error('Failed to save user sessions JSON:', e);
    }
};

router.get('/sessions', async (req, res) => {
    const username = req.query.username;
    if (!username) return res.status(400).json({ ok: false, error: 'Username is required' });

    if (usePostgres) {
        try {
            const dbRes = await pgPool.query(
                'SELECT id, title, messages, created_at AS "createdAt", updated_at AS "updatedAt" FROM chat_sessions WHERE username = $1 ORDER BY updated_at DESC',
                [username]
            );
            return res.json({ ok: true, sessions: dbRes.rows });
        } catch (e) {
            console.error('PostgreSQL session fetch error, fallback to JSON:', e);
        }
    }

    const allJson = loadJsonSessions();
    const userSessions = allJson[username] || [];
    res.json({ ok: true, sessions: userSessions });
});

router.post('/sessions', async (req, res) => {
    const { username, sessions } = req.body || {};
    if (!username || !Array.isArray(sessions)) {
        return res.status(400).json({ ok: false, error: 'Username and sessions array required' });
    }

    if (usePostgres) {
        try {
            for (const s of sessions) {
                await pgPool.query(
                    `INSERT INTO chat_sessions (id, username, title, messages, updated_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE
           SET title = EXCLUDED.title, messages = EXCLUDED.messages, updated_at = EXCLUDED.updated_at`,
                    [s.id, username, s.title, JSON.stringify(s.messages), s.updatedAt || new Date().toISOString()]
                );
            }
        } catch (e) {
            console.error('PostgreSQL session save error:', e);
        }
    }

    const allJson = loadJsonSessions();
    allJson[username] = sessions;
    saveJsonSessions(allJson);

    res.json({ ok: true, count: sessions.length });
});

router.delete('/sessions/:sessionId', async (req, res) => {
    const sessionId = req.params.sessionId;
    const username = req.query.username;
    if (!username || !sessionId) {
        return res.status(400).json({ ok: false, error: 'Username and sessionId are required' });
    }

    if (usePostgres) {
        try {
            await pgPool.query('DELETE FROM chat_sessions WHERE id = $1 AND username = $2', [sessionId, username]);
        } catch (e) {
            console.error('PostgreSQL session delete error:', e);
        }
    }

    const allJson = loadJsonSessions();
    if (allJson[username]) {
        allJson[username] = allJson[username].filter(s => s.id !== sessionId);
        saveJsonSessions(allJson);
    }

    res.json({ ok: true });
});

// --- Profile APIs ---
router.get('/profile', async (req, res) => {
    const username = req.query.username;
    if (!username) return res.status(400).json({ ok: false, error: 'Username required' });
    const profile = await getUserProfile(username);
    res.json({ ok: true, profile });
});

router.post('/profile', async (req, res) => {
    const { username, profile } = req.body || {};
    if (!username || !profile) return res.status(400).json({ ok: false, error: 'Username and profile required' });

    const scoreNum = Number(profile.score) || 0;
    const rankNum = Number(profile.rank) || 0;
    const isVip = scoreNum > 580;

    const updatedProfile = {
        ...profile,
        score: scoreNum,
        rank: rankNum,
        isVip,
        updatedAt: new Date().toISOString()
    };

    if (usePostgres) {
        try {
            await pgPool.query(
                `UPDATE users SET profile = $1 WHERE username = $2`,
                [JSON.stringify(updatedProfile), username]
            );
        } catch (e) {
            console.error('PG profile update err:', e);
        }
    }

    const profiles = loadJsonProfiles();
    profiles[username] = updatedProfile;
    saveJsonProfiles(profiles);

    // If VIP (>580), auto create initial background memory snippet in personal RAG
    if (isVip) {
        saveUserPersonalMemory(
            username,
            `学生个人基础背景资料：昵称【${updatedProfile.name || username}】，省份【${updatedProfile.province}】，高考成绩【${updatedProfile.score}分】，全省排名【第${updatedProfile.rank}名】，选科【${updatedProfile.subjects}】，特殊情况说明【${updatedProfile.specialConditions || '无'}】`,
            '个人基础背景档案',
            'VIP基本资料'
        ).catch(() => { });
    }

    res.json({ ok: true, profile: updatedProfile });
});

// --- Change Password API ---
router.post('/change-password', (req, res) => {
    const { username, currentPassword, newPassword } = req.body || {};
    if (!username || !currentPassword || !newPassword) {
        return res.status(400).json({ ok: false, error: '所有字段均为必填' });
    }

    const users = loadUserAccounts();
    const userIdx = users.findIndex(u => u.username === username);
    if (userIdx === -1) {
        return res.status(404).json({ ok: false, error: '账号不存在' });
    }

    const user = users[userIdx];
    const isValid = verifyPassword(currentPassword, user.passwordHash || user.password);
    if (!isValid) {
        return res.status(400).json({ ok: false, error: '原密码输入错误' });
    }

    user.passwordHash = hashPassword(newPassword.trim());
    delete user.password;
    saveUserAccounts(users);

    res.json({ ok: true, message: '密码修改成功，新密码已通过 Bcrypt 加密保存！' });
});

// --- Personal RAG API ---
router.get('/personal-rag', async (req, res) => {
    const username = req.query.username;
    if (!username) return res.status(400).json({ ok: false, error: 'Username required' });
    let items = [];
    if (usePostgres) {
        try {
            const dbRes = await pgPool.query('SELECT * FROM user_personal_rag WHERE username = $1 ORDER BY created_at DESC', [username]);
            items = dbRes.rows;
        } catch {
            items = (loadJsonPersonalRag()[username]) || [];
        }
    } else {
        items = (loadJsonPersonalRag()[username]) || [];
    }
    res.json({ ok: true, items });
});

// --- Avatar Upload API (Supports User & Admin) ---
const avatarsDir = path.join(uploadsDir, 'avatars');
if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
}

router.post('/upload-avatar', (req, res) => {
    try {
        const { imageBase64 } = req.body || {};
        if (!imageBase64 || typeof imageBase64 !== 'string') {
            return res.status(400).json({ ok: false, error: '缺少图片数据 (imageBase64 必须为有效 base64 字符串)' });
        }

        const matches = imageBase64.match(/^data:image\/([a-zA-Z0-9\+\.]+);base64,(.+)$/);
        let ext = 'png';
        let buffer;
        if (matches && matches.length === 3) {
            ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
            buffer = Buffer.from(matches[2], 'base64');
        } else {
            buffer = Buffer.from(imageBase64, 'base64');
        }

        if (buffer.length > 5 * 1024 * 1024) {
            return res.status(400).json({ ok: false, error: '头像图片大小不能超过 5MB' });
        }

        const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext.toLowerCase()) ? ext.toLowerCase() : 'png';
        const newFileName = `avatar_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
        const targetPath = path.join(avatarsDir, newFileName);

        fs.writeFileSync(targetPath, buffer);
        const fileUrl = `/uploads/avatars/${newFileName}`;

        res.json({ ok: true, url: fileUrl, filename: newFileName });
    } catch (err) {
        console.error('Avatar upload error:', err);
        res.status(500).json({ ok: false, error: err.message || '上传头像失败' });
    }
});

export default router;

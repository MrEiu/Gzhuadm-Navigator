#!/usr/bin/env node
import { execSync } from 'child_process';
import os from 'os';

/**
 * 强杀占用指定端口的残留进程 (跨平台支持 Windows, Linux, macOS)
 * @param {number|string} port
 * @returns {boolean} true if killed, false if clean
 */
export function freePortProcess(port) {
    const portNum = Number(port);
    if (isNaN(portNum) || portNum <= 0) return false;

    const isWin = os.platform() === 'win32';
    const currentPid = process.pid;

    try {
        if (isWin) {
            // Windows: netstat -ano -p tcp | findstr :<port>
            const stdout = execSync(`netstat -ano -p tcp | findstr :${portNum}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
            const lines = stdout.split('\n');
            const pidsToKill = new Set();

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                // Match LISTENING lines
                if (trimmed.includes('LISTENING') || trimmed.includes(`:${portNum}`)) {
                    const parts = trimmed.split(/\s+/);
                    const pid = parts[parts.length - 1];
                    if (pid && /^\d+$/.test(pid) && Number(pid) !== currentPid && Number(pid) !== 0) {
                        pidsToKill.add(pid);
                    }
                }
            }

            if (pidsToKill.size > 0) {
                for (const pid of pidsToKill) {
                    try {
                        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
                        console.log(`🧹 [Port Cleaner] 成功强制清理占用端口 ${portNum} 的残留进程 (PID: ${pid})`);
                    } catch { }
                }
                return true;
            }
        } else {
            // Linux / macOS: lsof -ti :<port>
            const stdout = execSync(`lsof -ti :${portNum}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
            const pids = stdout.trim().split('\n').filter(Boolean);
            let killed = false;

            for (const pid of pids) {
                if (Number(pid) !== currentPid && Number(pid) !== 0) {
                    try {
                        execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
                        console.log(`🧹 [Port Cleaner] 成功强制清理占用端口 ${portNum} 的残留进程 (PID: ${pid})`);
                        killed = true;
                    } catch { }
                }
            }
            return killed;
        }
    } catch {
        // No process was listening on the port
        return false;
    }

    return false;
}

// If executed directly from CLI: node scripts/free-port.mjs 3001 4173
const args = process.argv.slice(2);
if (args.length > 0) {
    for (const arg of args) {
        const port = parseInt(arg, 10);
        if (!isNaN(port)) {
            const killed = freePortProcess(port);
            if (!killed) {
                // Port was clean
            }
        }
    }
}

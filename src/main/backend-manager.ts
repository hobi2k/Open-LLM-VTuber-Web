import { spawn, type ChildProcess } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { createConnection } from "node:net";
import { homedir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { app } from "electron";

const BACKEND_HOST = "127.0.0.1";
const BACKEND_PORT = 12393;
const STARTUP_TIMEOUT_MS = 30_000;

let backendProcess: ChildProcess | null = null;

function isBackendListening(): Promise<boolean> {
  return new Promise((resolveListening) => {
    const socket = createConnection({ host: BACKEND_HOST, port: BACKEND_PORT });
    const finish = (listening: boolean) => {
      socket.destroy();
      resolveListening(listening);
    };
    socket.setTimeout(300);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

function findBackendDirectory(): string | null {
  const starts = [
    process.env.OPEN_LLM_VTUBER_BACKEND_DIR,
    dirname(process.execPath),
    dirname(app.getAppPath()),
    process.cwd(),
    join(homedir(), "Desktop", "personal", "Open-LLM-VTuber"),
  ].filter((value): value is string => Boolean(value));

  const candidates = starts.flatMap((start) => {
    const directories = [];
    let current = resolve(start);
    for (let depth = 0; depth < 12; depth += 1) {
      directories.push(current);
      const parent = dirname(current);
      if (parent === current) break;
      current = parent;
    }
    return directories;
  });

  return [...new Set(candidates)].find(
    (directory) => existsSync(join(directory, "run_server.py")),
  ) ?? null;
}

async function waitForBackend(deadline: number): Promise<boolean> {
  if (await isBackendListening()) return true;
  if (!backendProcess || Date.now() >= deadline) return false;
  await new Promise<void>((resolveDelay) => {
    setTimeout(resolveDelay, 250);
  });
  return waitForBackend(deadline);
}

export async function startLocalBackend(): Promise<boolean> {
  if (process.env.OPEN_LLM_VTUBER_NO_AUTO_BACKEND === "1") return false;
  if (await isBackendListening()) return true;

  const directory = findBackendDirectory();
  if (!directory) {
    console.error(
      "Open-LLM-VTuber backend was not found. Set OPEN_LLM_VTUBER_BACKEND_DIR.",
    );
    return false;
  }

  const python = [
    join(directory, ".venv", "bin", "python"),
    join(directory, "venv", "bin", "python"),
    join(directory, ".venv", "Scripts", "python.exe"),
    join(directory, "venv", "Scripts", "python.exe"),
  ].find(existsSync);
  if (!python) {
    console.error(`Python environment was not found in ${directory}`);
    return false;
  }

  const logDirectory = app.getPath("logs");
  mkdirSync(logDirectory, { recursive: true });
  const log = createWriteStream(join(logDirectory, "backend.log"), { flags: "a" });
  const executablePath = [
    "/opt/homebrew/bin",
    "/usr/local/bin",
    "/opt/local/bin",
    join(homedir(), ".local", "bin"),
    join(homedir(), ".bun", "bin"),
    join(homedir(), "Library", "pnpm", "bin"),
    join(homedir(), ".cargo", "bin"),
    process.env.PATH,
  ].filter((value): value is string => Boolean(value)).join(delimiter);

  backendProcess = spawn(python, [join(directory, "run_server.py")], {
    cwd: directory,
    env: {
      ...process.env,
      PATH: executablePath,
      PYTHONUNBUFFERED: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  backendProcess.stdout?.pipe(log);
  backendProcess.stderr?.pipe(log);
  backendProcess.once("error", (error) => {
    console.error("Failed to start the Open-LLM-VTuber backend:", error);
    backendProcess = null;
    log.end();
  });
  backendProcess.once("exit", (code, signal) => {
    console.log(`Open-LLM-VTuber backend stopped (${code ?? signal ?? "unknown"})`);
    backendProcess = null;
    log.end();
  });

  if (await waitForBackend(Date.now() + STARTUP_TIMEOUT_MS)) {
    console.log(`Open-LLM-VTuber backend started from ${directory}`);
    return true;
  }

  console.error("Open-LLM-VTuber backend did not become ready in time");
  return false;
}

export function stopLocalBackend(): void {
  if (!backendProcess || backendProcess.killed) return;
  backendProcess.kill("SIGTERM");
}

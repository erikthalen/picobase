import { cpSync, mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

export interface BackupEntry {
	name: string;
	path: string;
	size: number;
	createdAt: Date;
	type: "backup" | "upload";
}

export function createBackup(dbPath: string, backupsDir: string): string {
	mkdirSync(backupsDir, { recursive: true });
	const ts = new Date().toISOString().replace(/[:.]/g, "-");
	const nano = process.hrtime.bigint().toString().slice(-6);
	const dbName = basename(dbPath);
	const name = `${dbName}.${ts}-${nano}.bak`;
	cpSync(dbPath, join(backupsDir, name));
	return name;
}

export function listBackups(backupsDir: string): BackupEntry[] {
	let files: string[];
	try {
		files = readdirSync(backupsDir).filter(
			(f) => f.endsWith(".bak") || f.endsWith(".db") || f.endsWith(".sqlite"),
		);
	} catch {
		return [];
	}
	return files
		.map((name) => {
			const filePath = join(backupsDir, name);
			const stat = statSync(filePath);
			const type: BackupEntry["type"] = name.endsWith(".bak") ? "backup" : "upload";
			return { name, path: filePath, size: stat.size, createdAt: stat.birthtime, type };
		})
		.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function saveUploadedDb(backupsDir: string, filename: string, data: Buffer): void {
	mkdirSync(backupsDir, { recursive: true });
	writeFileSync(join(backupsDir, filename), data);
}

export function deleteBackup(backupsDir: string, name: string): void {
	unlinkSync(join(backupsDir, name));
}

export function restoreBackup(
	dbPath: string,
	backupsDir: string,
	backupName: string,
	backup = true,
): string | null {
	const safetyName = backup ? createBackup(dbPath, backupsDir) : null;
	cpSync(join(backupsDir, backupName), dbPath);
	return safetyName;
}

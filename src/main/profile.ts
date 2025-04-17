import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface Profile {
  name: string;
  lifeStage: string;
  goals: string;
}

const filePath = path.join(app.getPath('userData'), 'profile.json');

async function ensureFile() {
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, 'null', 'utf-8');
  }
}

export async function loadProfile(): Promise<Profile | null> {
  await ensureFile();
  const raw = await fs.readFile(filePath, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveProfile(profile: Profile): Promise<Profile> {
  await fs.writeFile(filePath, JSON.stringify(profile, null, 2), 'utf-8');
  return profile;
}
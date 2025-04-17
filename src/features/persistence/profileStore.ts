import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getLogger } from '../../core/logger';
import type { Profile } from '../../shared/types/domain';

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
  } catch (error) {
    getLogger('profileStore').error('Failed to parse profile.json', error as Error);
    return null;
  }
}

export async function saveProfile(profile: Profile): Promise<Profile> {
  await fs.writeFile(filePath, JSON.stringify(profile, null, 2), 'utf-8');
  getLogger('profileStore').info(`Saved profile for user "${profile.name}"`);
  return profile;
}
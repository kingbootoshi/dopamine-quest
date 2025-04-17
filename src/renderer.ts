import './index.css';
import addTaskSrc from './assets/sfx/add_task_placeholder.mp3';
import levelUpSrc from './assets/sfx/level_up_placeholder.mp3';

import { calcStreak } from './renderer/utils/streak';
import { LevelRing } from './renderer/components/LevelRing';
import { TaskList } from './renderer/components/TaskList';
import { QUICK_MODAL_HTML } from './renderer/components/QuickAddModal';
import { PROFILE_MODAL_HTML } from './renderer/components/ProfileModal';

import type { Task, Profile } from './shared/types/domain';

// --- Augment Window interface ---
export interface IElectronAPI {
  addTask: (title: string) => Promise<void>;
  getTasks: () => Promise<Task[]>;
  getProfile: () => Promise<Profile | null>;
  setProfile: (profile: Profile) => Promise<void>;
  openQuick: () => Promise<void>;
  onTaskAdded: (handler: (task: Task) => void) => void;
  log: (level: string, msg: string) => void;
}

declare global {
  interface Window {
    api: IElectronAPI;
  }
}
// --------------------------------

// ---- AUDIO ---- //
const addTaskSfx = new Audio(addTaskSrc);
const levelUpSfx = new Audio(levelUpSrc);
// --------------- //

// Profile type is now imported from shared/types/domain

// tiny helper so we never lose logs
function log(level: string, message: string) {
  try {
    window.api.log(level, message);
  } catch {
    // eslint-disable-next-line no-console
    console[level === 'error' ? 'error' : 'log'](message);
  }
}

const params = new URLSearchParams(location.search);
const isQuick = params.get('quick') === '1';

// ----------------- STATE ----------------- //
let prevLevel: number | null = null;
let tasksCache: Task[] = [];
// ----------------------------------------- //

async function ensureProfile(): Promise<Profile> {
  const existing = await window.api.getProfile();
  if (existing) return existing as Profile;

  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,0.9);z-index:9999;';
    overlay.innerHTML = `<div class="modal">${PROFILE_MODAL_HTML}</div>`;
    document.body.appendChild(overlay);

    const form = overlay.querySelector('#profile-form') as HTMLFormElement;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const profile = {
        name: (overlay.querySelector('#pf-name') as HTMLInputElement).value.trim(),
        lifeStage: (overlay.querySelector('#pf-life') as HTMLInputElement).value.trim(),
        goals: (overlay.querySelector('#pf-goals') as HTMLTextAreaElement).value.trim(),
      } as Profile;
      await window.api.setProfile(profile);
      overlay.remove();
      resolve(profile);
    });
  });
}

async function renderQuickAdd() {
  document.body.classList.add('modal');
  document.body.innerHTML = QUICK_MODAL_HTML;

  const form = document.getElementById('qa-form') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = (document.getElementById('qa-title') as HTMLInputElement).value.trim();
    if (!title) return;

    await window.api.addTask(title);
    log('info', `Saved task "${title}"`);

    addTaskSfx.currentTime = 0;
    addTaskSfx
      .play()
      .then(() => log('debug', 'addTaskSfx played'))
      .catch((err) => log('error', `addTaskSfx failed: ${err}`));

    addTaskSfx.addEventListener('ended', () => window.close());
    setTimeout(() => window.close(), 2000);
  });
}

function renderMain(tasks: Task[]) {
  const totalXP = tasks.reduce((sum, t) => sum + t.xp, 0);
  const level = Math.floor(totalXP / 100) + 1;
  const xpIntoLevel = totalXP % 100;
  const progress = xpIntoLevel / 100;
  const streak = calcStreak(tasks);

  // Play level‑up sound only if we actually just crossed a level boundary
  if (prevLevel !== null && level > prevLevel) {
    levelUpSfx.currentTime = 0;
    levelUpSfx
      .play()
      .then(() => log('debug', 'levelUpSfx played'))
      .catch((err) => log('error', `levelUpSfx failed: ${err}`));
  }
  prevLevel = level;

  const app = document.getElementById('app')!;
  app.innerHTML = `
    <h1 style="text-align:center">QuestXP</h1>
    ${LevelRing(level, progress)}
    <p style="text-align:center">Level ${level} — ${xpIntoLevel}/100 XP<br>Current streak: ${streak} day${
    streak === 1 ? '' : 's'
  }</p>
    <button id="add-btn" style="display:block;margin:1rem auto 0">Add Task (⌥⌘K)</button>
    <ul id="task-list">${TaskList(tasks)}</ul>
  `;

  document.getElementById('add-btn')!.addEventListener('click', () => {
    log('debug', 'Add Task button clicked – opening quick window');
    window.api.openQuick();
  });
}

(async () => {
  if (!isQuick) await ensureProfile();

  if (isQuick) {
    await renderQuickAdd();
    return;
  }

  // MAIN WINDOW FLOW
  tasksCache = await window.api.getTasks();
  renderMain(tasksCache);

  // Listen for new tasks and update UI in real‑time
  window.api.onTaskAdded((task: Task) => {
    log('debug', `Received tasks:added for "${task.title}"`);
    tasksCache.push(task);
    renderMain(tasksCache);
  });
})();
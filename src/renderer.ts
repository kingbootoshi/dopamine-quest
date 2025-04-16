import './index.css';
import addTaskSrc from './assets/sfx/add_task_placeholder.mp3';
import levelUpSrc from './assets/sfx/level_up_placeholder.mp3';

import { calcXP } from './renderer/utils/xp';
import { calcStreak } from './renderer/utils/streak';
import { LevelRing } from './renderer/components/LevelRing';
import { TaskList } from './renderer/components/TaskList';
import { QUICK_MODAL_HTML } from './renderer/components/QuickAddModal';

import type { Task } from './main/store';

// ---- AUDIO ---- //
const addTaskSfx = new Audio(addTaskSrc);
const levelUpSfx = new Audio(levelUpSrc);
// --------------- //

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

async function renderQuickAdd(existingTasks: Task[]) {
  document.body.classList.add('modal');
  document.body.innerHTML = QUICK_MODAL_HTML;

  const form = document.getElementById('qa-form') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = (document.getElementById('qa-title') as HTMLInputElement).value.trim();
    const impact = Number((document.getElementById('qa-impact') as HTMLInputElement).value);
    const complexity = Number((document.getElementById('qa-complexity') as HTMLInputElement).value);
    const streak = calcStreak(existingTasks);
    const xp = calcXP(impact, complexity, streak);

    const task: Task = {
      id: crypto.randomUUID(),
      title,
      impact,
      complexity,
      xp,
      createdAt: new Date().toISOString(),
    };

    await window.api.addTask(task);
    log('info', `Saved task "${task.title}" (+${task.xp} XP)`);

    // play SFX then close window
    addTaskSfx.currentTime = 0;
    addTaskSfx
      .play()
      .then(() => log('debug', 'addTaskSfx played'))
      .catch((err) => log('error', `addTaskSfx failed: ${err}`));

    addTaskSfx.addEventListener('ended', () => window.close());
    // fallback – never leave stray window
    setTimeout(() => window.close(), 2000);
  });
}

let prevLevel = 1;

function renderMain(tasks: Task[]) {
  const totalXP = tasks.reduce((sum, t) => sum + t.xp, 0);
  const level = Math.floor(totalXP / 100) + 1;
  const xpIntoLevel = totalXP % 100;
  const progress = xpIntoLevel / 100;
  const streak = calcStreak(tasks);

  if (level > prevLevel) {
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
    <p style="text-align:center">Level ${level} — ${xpIntoLevel}/100 XP<br>Current streak: ${streak} day${streak === 1 ? '' : 's'}</p>
    <button id="add-btn" style="display:block;margin:1rem auto 0">Add Task (⌥⌘K)</button>
    <ul id="task-list">${TaskList(tasks)}</ul>
  `;

  document.getElementById('add-btn')!.addEventListener('click', () => {
    log('debug', 'Add Task button clicked – opening quick window');
    window.api.openQuick();
  });
}

(async () => {
  const tasks = await window.api.getTasks();
  if (isQuick) await renderQuickAdd(tasks);
  else renderMain(tasks);
})();
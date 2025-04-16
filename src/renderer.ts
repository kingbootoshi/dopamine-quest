import './index.css';

interface Task {
  id: string;
  title: string;
  impact: number;
  complexity: number;
  xp: number;
  createdAt: string;
}

declare global {
  interface Window {
    api: {
      addTask: (task: Task) => Promise<Task>;
      getTasks: () => Promise<Task[]>;
    };
  }
}

const params = new URLSearchParams(location.search);
const isQuick = params.get('quick') === '1';

function calcXP(impact: number, complexity: number, streak: number) {
  const base = impact * complexity * 3;
  const bonus = 1 + Math.min(streak, 7) * 0.05;
  const randomness = 0.9 + Math.random() * 0.2;
  return Math.round(base * bonus * randomness);
}

function calcStreak(tasks: Task[]): number {
  const daySet = new Set<string>();
  tasks.forEach((t) => daySet.add(new Date(t.createdAt).toDateString()));

  let streak = 0;
  const oneDay = 24 * 60 * 60 * 1000;
  const today = new Date();

  for (let offset = 0; ; offset++) {
    const d = new Date(today.getTime() - offset * oneDay).toDateString();
    if (daySet.has(d)) streak++;
    else break;
  }
  return streak;
}

async function renderQuickAdd(existingTasks: Task[]) {
  document.body.style.background = 'transparent';
  document.body.style.color = '#f9fafb';

  const container = document.createElement('div');
  container.className = 'modal';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.justifyContent = 'center';
  container.style.alignItems = 'center';

  container.innerHTML = `
    <form id="qa-form" style="width:100%;max-width:360px">
      <label>Task
        <input type="text" id="qa-title" required placeholder="What did you complete?">
      </label>
      <label>Impact (1‑5)
        <input type="range" id="qa-impact" min="1" max="5" value="3">
      </label>
      <label>Complexity (1‑5)
        <input type="range" id="qa-complexity" min="1" max="5" value="3">
      </label>
      <button type="submit" style="width:100%;margin-top:0.5rem">Save</button>
    </form>
  `;
  document.body.appendChild(container);

  const form = document.getElementById('qa-form') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = (document.getElementById('qa-title') as HTMLInputElement).value.trim();
    const impact = Number(
      (document.getElementById('qa-impact') as HTMLInputElement).value
    );
    const complexity = Number(
      (document.getElementById('qa-complexity') as HTMLInputElement).value
    );
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
    window.close();
  });
}

function renderMain(tasks: Task[]) {
  const app = document.getElementById('app')!;
  const totalXP = tasks.reduce((sum, t) => sum + t.xp, 0);
  const level = Math.floor(totalXP / 100) + 1;
  const xpIntoLevel = totalXP % 100;
  const progress = xpIntoLevel / 100;
  const streak = calcStreak(tasks);

  app.innerHTML = `
    <h1 style="text-align:center">QuestXP</h1>
    <div class="ring" style="--progress:${progress}">
      <div class="ring-inner">${level}</div>
    </div>
    <p style="text-align:center">Level ${level} — ${xpIntoLevel}/100 XP<br>Current streak: ${streak} day${streak === 1 ? '' : 's'}</p>
    <button id="add-btn" style="display:block;margin:1rem auto 0">Add Task (⌥⌘K)</button>
    <ul id="task-list"></ul>
  `;

  const list = document.getElementById('task-list')!;
  tasks
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .forEach((t) => {
      const li = document.createElement('li');
      li.className = 'task';
      li.innerHTML = `<span>${t.title}</span><span>+${t.xp} XP</span>`;
      list.appendChild(li);
    });

  document.getElementById('add-btn')!.addEventListener('click', () => {
    window.open('?quick=1', '', 'width=420,height=280');
  });
}

(async () => {
  const tasks = await window.api.getTasks();
  if (isQuick) await renderQuickAdd(tasks);
  else renderMain(tasks);
})();
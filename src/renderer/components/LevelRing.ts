export function LevelRing(level: number, progress: number): string {
  return `
    <div class="ring" style="--progress:${progress}">
      <div class="ring-inner">${level}</div>
    </div>
  `;
}
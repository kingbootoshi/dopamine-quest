export const QUICK_MODAL_HTML = `
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
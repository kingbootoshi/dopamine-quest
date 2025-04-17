export const PROFILE_MODAL_HTML = `
  <form id="profile-form" style="width:100%;max-width:400px">
    <h2 style="text-align:center;margin-top:0">Welcome to QuestXP</h2>
    <label>Name
      <input type="text" id="pf-name" required placeholder="Your name">
    </label>
    <label>Life stage
      <input type="text" id="pf-life" placeholder="e.g., College senior, freelancer">
    </label>
    <label>Top goals
      <textarea id="pf-goals" rows="3" placeholder="Comma‑separated goals"></textarea>
    </label>
    <button type="submit" style="width:100%;margin-top:0.5rem">Continue</button>
  </form>
`;
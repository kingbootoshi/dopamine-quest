CHAT ABOUT SELLING THIS APP AS A SERVICE:
https://chatgpt.com/share/68005867-ed8c-800e-b90c-78bc24243628

Quick Notes:
- Use Supabase for user auth
- Sync Supabase user auth table with stripe to confirm subscriptions
- Use bettersqlite3 locally for storage for local first functionality
- Use electricsql/powersync for offline and cloud sync
- Use cloudflare AI workers for the AI calls on tool tasks
- Use electron-updater to update app between all installed clients

well... on local first functionality... if the AI system is offline, then the automatic AI system won't work
if the AI system is offline, then the user can just manually select the category (same for reward insertion)
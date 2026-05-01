# Troubleshooting (local setup)

Quick fixes for the most common issues when running ShadowFile locally.

## Ollama is not running

**Symptom:** App loads, but every AI reply times out or shows a "model unavailable" message.

**Fix:**

1. Confirm Ollama is installed:

   ```bash
   ollama --version
   ```

   If the command is not found, install from [ollama.com](https://ollama.com) and restart your terminal.

2. Start the Ollama service:

   ```bash
   ollama serve
   ```

   On macOS the desktop app starts the service automatically; if it is not running, open the Ollama app once.

3. Verify the model is pulled:

   ```bash
   ollama list
   ```

   You should see `llama3.2:3b` (default) or `llama3.1:8b` (`--strong`). If not, run `bash start.sh` again — it pulls the model.

4. Test the local endpoint:

   ```bash
   curl http://localhost:11434/api/tags
   ```

   A JSON response confirms Ollama is reachable.

## Stale PWA cache

**Symptom:** UI looks like an old version after pulling new code, or new flows do not appear.

**Fix:**

- Hard reload the page: **Cmd+Shift+R** (macOS) / **Ctrl+Shift+R** (Windows / Linux).
- If that does not help, open DevTools → **Application** → **Service Workers** → **Unregister**, then reload.
- Clear site data: DevTools → **Application** → **Storage** → **Clear site data**.
- As a last resort, uninstall the installed PWA and re-open from the dev server.

Note: clearing site data will erase locally stored journal entries on that browser profile.

## Port 5173 already in use

**Symptom:** `vite` exits with `Port 5173 is already in use` or silently moves to a different port.

**Fix:**

- Find and stop the process holding the port:

  ```bash
  lsof -i :5173
  kill <pid>
  ```

- Or run on a different port:

  ```bash
  npm run dev -- --port 5174
  ```

- If a previous `start.sh` left a stale Vite process, `pkill -f vite` will clear it.

## Missing Node.js

**Symptom:** `start.sh` exits early, or `npm` / `node` is not found.

**Fix:**

1. Install Node.js LTS from [nodejs.org](https://nodejs.org). Restart your terminal afterward so the new `PATH` takes effect.
2. Verify:

   ```bash
   node --version
   npm --version
   ```

   You want Node 18 or newer.
3. If you manage Node with `nvm`:

   ```bash
   nvm install --lts
   nvm use --lts
   ```

4. Re-run `bash start.sh`.

## Still stuck

- Re-run `bash start.sh` from a clean terminal session.
- Delete `node_modules` and `package-lock.json`, then run `npm install` again.
- Check the dev server console output for the first error — later errors are usually downstream.

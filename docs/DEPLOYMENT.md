# Deployment

## Architecture (confirmed with the DLSU VM setup)

- A single Node/Express process (`server.js`) runs directly on the DLSU VM, kept alive by **PM2**.
- **NGINX** reverse-proxies incoming requests to that process.
- The frontend is built (`npm run build` in `client/`, producing `client/dist`) and served **statically by the same Express process** — there is no separate frontend host. `server.js` already expects `client/dist` to exist right next to it.
- **DNS** is configured separately by DLSU ITS, pointing a hostname at the VM's address — not something this repo or app config needs to handle.
- **Access control** is network-level: VPN/campus-network gated, not application-level.
- There is currently no CI/CD — deployment is a manual, SSH-driven process. Automating it is a reasonable future improvement, not a prerequisite.

## Deploying a change

SSH into the VM, then from the project folder:

```bash
git pull origin <branch>

npm install
cd client && npm install && npm run build && cd ..

pm2 list                       # find the exact app name/id first
pm2 restart <app-name-or-id>
pm2 logs <app-name-or-id> --lines 50   # confirm it started cleanly, no errors
```

Then verify in a browser:
- Visit the VM's address / configured hostname
- Log in
- Confirm a previously-broken endpoint (e.g. the mentors list or dashboard) now loads real data instead of failing — this is the actual regression test for the routing fix

## Extra checks for this specific deploy (the routing bug fix)

- [ ] Confirm `.env.production` on the VM still points at the real production database — that's correct and expected there (unlike local dev, which intentionally points elsewhere)
- [ ] Confirm PM2 actually restarted with the new code — `pm2 status` should show a fresh start time, not just "online" from before
- [ ] If requests still fail after the restart, reload NGINX too (`sudo systemctl reload nginx`) — occasionally an upstream connection gets cached across a Node restart
- [ ] Spot-check a few of the endpoints that were previously shadowed by the bug: mentors list, dashboard stats, notifications — these should return real JSON now, not the SPA's `index.html`

## Rollback

Nothing on this branch has been deployed to the VM before, so rollback is simple: `git checkout <previous-commit>` on the VM, then restart PM2 again. None of the fixes in this round touch the database schema, so there's no migration to reverse.

## Not yet resolved before this should be considered fully production-hardened

See the project's remediation plan for full detail — flagging the two still-open items here since they're relevant to this deploy specifically:
- **Dev and prod currently share the same Telegram bot token, Gmail app password, and Google client secret.** Worth rotating the dev-side copies soon, not indefinitely later — especially since local testing has been exercising the real values.
- **The global rate limiter is still disabled** (`server.js`, commented out). VPN-gating reduces the urgency somewhat since this won't be exposed to the open internet, but it's still worth a deliberate decision rather than leaving it unaddressed.

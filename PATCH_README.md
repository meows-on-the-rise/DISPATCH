# Dispatch — Dependency Fix Patch

This patch resolves two issues from the initial zip:

## Issues fixed

**1. npm ERESOLVE — `multer-storage-cloudinary` peer conflict**
`multer-storage-cloudinary@4` requires `cloudinary@^1`, but we had `cloudinary@^2`.
Fix: pin `cloudinary` back to `^1.41.3` and rewrite the upload logic to stream buffers
directly instead of using the storage engine.

**2. `setup.sh` failing to find `server/.env.example`**
The path was wrong when run from a GitHub Codespace layout. Fixed path logic with
existence checks and a fallback.

---

## Apply the patch

Drop these files into your repo, replacing the originals:

```
server/package.json                  → replaces server/package.json
server/src/lib/cloudinary.ts         → replaces server/src/lib/cloudinary.ts
server/src/routes/users.ts           → replaces server/src/routes/users.ts
server/src/routes/drivers.ts         → replaces server/src/routes/drivers.ts
setup.sh                             → replaces setup.sh
```

Then re-run:

```bash
cd server && npm install
```

That's it — no other files changed.

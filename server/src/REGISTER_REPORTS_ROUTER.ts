// ── Add these two lines to server/src/index.ts ───────────────────────────────
// Place them alongside your existing router imports and app.use() calls.

// 1. Import at the top of the file (with your other route imports):
import reportsRouter from "./routes/reports.js";

// 2. Register the router (alongside your existing app.use("/admin", adminRouter) line):
app.use("/reports", reportsRouter);

// ─────────────────────────────────────────────────────────────────────────────
// The full block in context should look like this:
//
//   app.use("/auth",    authRouter);
//   app.use("/users",   usersRouter);
//   app.use("/wallet",  walletRouter);
//   app.use("/trips",   tripsRouter);
//   app.use("/drivers", driversRouter);
//   app.use("/admin",   adminRouter);
//   app.use("/reports", reportsRouter);   ← ADD THIS

// helpers/schedulerLogger.js
import fs from 'fs';
import path from 'path';

const logDir = path.join(process.cwd(), 'logs');
const logFile = path.join(logDir, 'scheduler.log');

// Ensure logs directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Append to scheduler.log
export function logScheduler(message) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
}

// clear log (manually triggered if needed)
export function clearSchedulerLog() {
  fs.writeFileSync(logFile, '');
}

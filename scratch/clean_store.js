const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", ".data");
if (fs.existsSync(dataDir)) {
  fs.rmSync(dataDir, { recursive: true, force: true });
  console.log("Completely removed .data fallback directory and JSON files.");
} else {
  console.log(".data directory does not exist.");
}

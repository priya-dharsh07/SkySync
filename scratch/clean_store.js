const fs = require("fs");
const path = "./.data/db_store.json";
if (fs.existsSync(path)) {
  const data = JSON.parse(fs.readFileSync(path, "utf-8"));
  data.users = data.users.filter(u => u.email === "priya@example.com");
  data.groupBookings = [];
  data.bookings = [];
  fs.writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
  console.log("Cleaned db_store.json successfully. Users remaining:", data.users.length);
}

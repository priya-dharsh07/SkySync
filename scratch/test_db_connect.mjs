import mongoose from "mongoose";

async function test() {
  const uris = [
    process.env.MONGODB_URI || "mongodb+srv://priyadharshini2845_db_user:H99xNlrT5QljWSDg@skysync.dsxiywo.mongodb.net/skysync?retryWrites=true&w=majority",
    "mongodb://127.0.0.1:27017/skysync",
    "mongodb://localhost:27017/skysync"
  ];

  for (const uri of uris) {
    try {
      console.log(`Trying ${uri}...`);
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      console.log(`CONNECTED SUCCESSFULLY to ${uri}! ReadyState:`, mongoose.connection.readyState);
      await mongoose.disconnect();
      return;
    } catch (e) {
      console.log(`Failed for ${uri}:`, e.message);
    }
  }
}

test();

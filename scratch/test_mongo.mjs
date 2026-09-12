import mongoose from "mongoose";

const uri = "mongodb+srv://priyadharshini2845_db_user:H99xNlrT5QljWSDg@skysync.dsxiywo.mongodb.net/test?retryWrites=true&w=majority";

async function test() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected successfully! ReadyState:", mongoose.connection.readyState);
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections in DB:", collections.map(c => c.name));
    
    const usersCollection = mongoose.connection.db.collection("users");
    const count = await usersCollection.countDocuments();
    console.log("Users count in MongoDB:", count);
    const users = await usersCollection.find({}).toArray();
    users.forEach(u => console.log("User:", u.name, u.email, u.homeAirport, u.homeCity));
    await mongoose.disconnect();
  } catch (err) {
    console.log("MongoDB connection failed:", err.message);
  }
}

test();

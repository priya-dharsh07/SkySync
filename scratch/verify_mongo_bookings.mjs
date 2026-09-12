import connectDB from "../src/lib/mongodb.js";
import Booking from "../src/models/Booking.js";
import { saveBooking, findBookings } from "../src/lib/db/unifiedStore.js";

async function run() {
  console.log("Connecting to MongoDB Atlas...");
  await connectDB();

  console.log("Saving test general flight booking...");
  const bkg = await saveBooking({
    userId: "usr-test-123",
    userEmail: "priyadharshini@gmail.com",
    bookingReference: `SKY-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
    eTicketNumber: `ETKT-SS-999111-DEL`,
    flightNumber: "AI-101",
    airline: "Air India",
    airlineCode: "AI",
    origin: "New Delhi",
    originCode: "DEL",
    destination: "Mumbai",
    destinationCode: "BOM",
    departureDate: "2026-10-15",
    departureTime: "08:15",
    arrivalTime: "10:30",
    passengers: [{ firstName: "Priyadharshini", lastName: "Sundaram", email: "priyadharshini@gmail.com", phone: "+91 9876543210" }],
    selectedSeats: ["12B"],
    totalPrice: 4950,
    escrowStatus: "CAPTURED",
    status: "CONFIRMED",
    paymentCardLast4: "8989",
  });

  console.log("Saved booking ID:", bkg._id, "Ref:", bkg.bookingReference);

  const count = await Booking.countDocuments();
  console.log("MongoDB 'bookings' collection total document count:", count);

  if (count === 0) {
    throw new Error("FAIL: bookings collection is still empty!");
  }

  console.log("PASS: MongoDB 'bookings' collection now contains confirmed general flight bookings!");
  process.exit(0);
}

run().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});

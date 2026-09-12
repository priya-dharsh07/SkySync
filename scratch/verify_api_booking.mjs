const BASE_URL = "http://localhost:3000";

async function verify() {
  console.log("Creating general flight booking via POST /api/bookings...");
  const res = await fetch(`${BASE_URL}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      flight: {
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
        price: 4950,
      },
      passengers: [{
        firstName: "Priyadharshini",
        lastName: "Sundaram",
        email: "priyadharshini@gmail.com",
        phone: "+91 9876543210",
        passportNumber: "Z9876543",
        passportCountry: "IND"
      }],
      selectedSeats: ["14A"],
      totalPrice: 4950,
      paymentCardLast4: "8989"
    })
  });

  const data = await res.json();
  console.log("API response status:", res.status, "Success:", data.success);
  console.log("Created Booking:", data.booking?.bookingReference, "eTicket:", data.booking?.eTicketNumber);

  if (!data.success || !data.booking) {
    throw new Error("Failed to create general flight booking!");
  }

  console.log("PASS: General flight booking successfully saved and synchronized!");
}

verify().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});

// Automated test for Option 1: Everyone Pays Separately
async function runOption1Test() {
  const baseUrl = "http://localhost:3000";

  console.log("1. Logging in as Organizer (priya@example.com)...");
  const priyaLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "priya@example.com", password: "password123" }),
  });
  const priyaData = await priyaLogin.json();
  const priyaCookie = priyaLogin.headers.get("set-cookie");

  console.log("2. Creating Group 'Tech Summit Bangalore 2026'...");
  const createRes = await fetch(`${baseUrl}/api/group-bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: priyaCookie },
    body: JSON.stringify({
      name: "Tech Summit Bangalore 2026",
      tripType: "Conference / Business",
      initialMembers: [
        { name: "Rohan Verma", email: "rohan.verma@example.com", homeAirport: "BOM", homeCity: "Mumbai" },
      ],
    }),
  });
  const createData = await createRes.json();
  if (!createRes.ok) {
    console.error("Create group failed:", createRes.status, createData);
  }
  const group = createData.group;
  console.log("Group created with ID:", group?.id, "Members:", group?.members.length);

  console.log("3. Optimizing and Locking Itinerary...");
  await fetch(`${baseUrl}/api/group-bookings/${group.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: priyaCookie },
    body: JSON.stringify({
      action: "OPTIMIZE_TRIP",
      weights: { priceFairness: 0.5, arrivalAlignment: 0.3, travelDuration: 0.2 },
    }),
  });

  const lockRes = await fetch(`${baseUrl}/api/group-bookings/${group.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: priyaCookie },
    body: JSON.stringify({
      action: "LOCK_ITINERARY",
    }),
  });
  const lockedGroup = (await lockRes.json()).group;
  console.log("Itinerary locked:", lockedGroup.status);

  console.log("4. Selecting Payment Mode: INDIVIDUAL (Everyone Pays Separately)...");
  const modeRes = await fetch(`${baseUrl}/api/group-bookings/${group.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: priyaCookie },
    body: JSON.stringify({
      action: "SELECT_PAYMENT_MODE",
      paymentMode: "INDIVIDUAL",
    }),
  });
  const modeGroup = (await modeRes.json()).group;
  console.log("Payment mode active:", modeGroup.paymentMode, "| Status:", modeGroup.status);

  console.log("5. Organizer (Priya) pays for her seat independently (Seat 15A)...");
  const priyaPayRes = await fetch(`${baseUrl}/api/group-bookings/${group.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: priyaCookie },
    body: JSON.stringify({
      action: "PROCESS_MEMBER_PAYMENT",
      seat: "15A",
      passengerDetails: {
        title: "Ms",
        firstName: "Priyadharshini",
        lastName: "Sundaram",
        email: "priya@example.com",
        phone: "+91 98401 23456",
        passportCountry: "IND",
        passportExpiry: "2030-05-15",
        passportNumber: "Z9810234",
        visaStatus: "VERIFIED_OK",
      },
      paymentMethod: "UPI",
    }),
  });
  const priyaPayData = await priyaPayRes.json();
  const priyaMember = priyaPayData.group.members.find(m => m.userId === priyaData.user.id);
  console.log(`Organizer Payment Complete: Seat ${priyaMember.selectedSeat} | E-Ticket: ${priyaMember.eTicketNumber} | Status: ${priyaMember.paymentStatus}`);
  console.log("Group status after 1/2 paid:", priyaPayData.group.status);

  console.log("6. Logging in as Traveler Rohan Verma (rohan.verma@example.com)...");
  const rohanLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "rohan.verma@example.com", password: "password123" }),
  });
  const rohanData = await rohanLogin.json();
  const rohanCookie = rohanLogin.headers.get("set-cookie");

  console.log("7. Rohan pays for his seat independently (Seat 15B)...");
  const rohanPayRes = await fetch(`${baseUrl}/api/group-bookings/${group.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: rohanCookie },
    body: JSON.stringify({
      action: "PROCESS_MEMBER_PAYMENT",
      seat: "15B",
      passengerDetails: {
        title: "Mr",
        firstName: "Rohan",
        lastName: "Verma",
        email: "rohan.verma@example.com",
        phone: "+91 98123 45678",
        passportCountry: "IND",
        passportExpiry: "2029-11-20",
        passportNumber: "A4781920",
        visaStatus: "VERIFIED_OK",
      },
      paymentMethod: "CARD",
    }),
  });
  const rohanPayData = await rohanPayRes.json();
  const rohanMember = rohanPayData.group.members.find(m => m.userId === rohanData.user.id);
  console.log(`Rohan Payment Complete: Seat ${rohanMember.selectedSeat} | E-Ticket: ${rohanMember.eTicketNumber} | Status: ${rohanMember.paymentStatus}`);
  console.log("Final Group status after all paid:", rohanPayData.group.status);

  console.log("8. Checking Rohan's Booking Ledger (/api/bookings)...");
  const rohanBookRes = await fetch(`${baseUrl}/api/bookings`, {
    headers: { Cookie: rohanCookie },
  });
  const rohanBookData = await rohanBookRes.json();
  const rohanBooking = rohanBookData.bookings?.find(b => b.groupId === group.id);
  if (rohanBooking) {
    console.log("SUCCESS! Rohan's personal booking ledger contains the group booking:");
    console.log(` - PNR: ${rohanBooking.bookingReference}`);
    console.log(` - Group: ${rohanBooking.groupName}`);
    console.log(` - Role: ${rohanBooking.travelerRole}`);
    console.log(` - Seat: ${rohanBooking.selectedSeats?.join(", ")}`);
    console.log(` - E-Ticket: ${rohanBooking.eTicketNumber}`);
    console.log(` - Status: ${rohanBooking.status}`);
  } else {
    console.error("FAIL: Booking was not recorded in Rohan's ledger.");
  }
}

runOption1Test().catch(console.error);

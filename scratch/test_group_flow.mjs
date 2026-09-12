// Automated E2E verification of SkySync Group Booking Lifecycle
async function runTest() {
  const baseUrl = "http://localhost:3000";

  console.log("1. Logging in as Organizer (priya@example.com)...");
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "priya@example.com", password: "password123" }),
  });
  const loginData = await loginRes.json();
  const cookie = loginRes.headers.get("set-cookie");
  console.log("Logged in user:", loginData.user?.name, "| Email:", loginData.user?.email);

  console.log("\n2. Creating Group 'Goa Beach Retreat 2026' with 2 invited friends...");
  const createRes = await fetch(`${baseUrl}/api/group-bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({
      name: "Goa Beach Retreat 2026",
      tripType: "Vacation / Friends Reunion",
      initialMembers: [
        { name: "Rohan Verma", email: "rohan.verma@example.com", homeAirport: "BOM", homeCity: "Mumbai" },
        { name: "Ananya Iyer", email: "ananya.iyer@example.com", homeAirport: "MAA", homeCity: "Chennai" },
      ],
    }),
  });
  const createData = await createRes.json();
  console.log("createRes status:", createRes.status, createData);
  const group = createData.group;
  console.log("Group created with ID:", group.id, "| Status:", group.status);
  console.log("Members count:", group.members.length);
  group.members.forEach(m => console.log(` - ${m.name} (${m.role}): Origin ${m.originAirport?.city || "Unassigned"}`));

  console.log("\n3. Running Multi-Origin Pareto Optimization...");
  const optRes = await fetch(`${baseUrl}/api/group-bookings/${group.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      action: "OPTIMIZE_TRIP",
      weights: { priceFairness: 0.4, arrivalAlignment: 0.35, travelDuration: 0.25 },
    }),
  });
  const optData = await optRes.json();
  console.log("Optimization result status:", optData.group.status);
  console.log("Recommended Destination:", optData.group.destination?.city, `(${optData.group.destination?.code})`);
  console.log("Fairness Score:", optData.group.destination?.fairnessScore, "| Arrival Alignment:", optData.group.destination?.arrivalWindowHours, "hrs");

  console.log("\n4. Locking Itinerary to Recommended Destination...");
  const lockRes = await fetch(`${baseUrl}/api/group-bookings/${group.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      action: "LOCK_ITINERARY",
      destination: optData.group.destination,
    }),
  });
  const lockData = await lockRes.json();
  console.log("Locked status:", lockData.group.status);

  console.log("\n5. Selecting Payment Mode: ORGANIZER (Option 2 - Organizer pays for everyone)...");
  const modeRes = await fetch(`${baseUrl}/api/group-bookings/${group.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      action: "SELECT_PAYMENT_MODE",
      paymentMode: "ORGANIZER",
    }),
  });
  const modeData = await modeRes.json();
  console.log("Payment mode active:", modeData.group.paymentMode, "| Status:", modeData.group.status);

  console.log("\n6. Executing Single Combined Group Payment & Seat Assignment...");
  const seatMap = {};
  seatMap[loginData.user.id] = "14A";
  optData.group.members.forEach((m, idx) => {
    if (m.userId !== loginData.user.id) {
      seatMap[m.userId] = `14${String.fromCharCode(66 + idx)}`;
    }
  });

  const payRes = await fetch(`${baseUrl}/api/group-bookings/${group.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      action: "PROCESS_GROUP_PAYMENT",
      paymentMethod: "CARD",
      seats: seatMap,
    }),
  });
  const payData = await payRes.json();
  console.log("Group Payment Result Status:", payData.group.status);
  console.log("Confirmed Members and E-Tickets:");
  payData.group.members.forEach(m => {
    console.log(` - ${m.name}: Seat ${m.selectedSeat} | E-Ticket ${m.eTicketNumber} | Status: ${m.paymentStatus}`);
  });

  console.log("\n7. Checking Booking Ledger for Priya Sundaram (/api/bookings)...");
  const bookRes = await fetch(`${baseUrl}/api/bookings`, {
    headers: { Cookie: cookie },
  });
  const bookData = await bookRes.json();
  console.log("Total Bookings in Profile Ledger:", bookData.bookings?.length);
  const groupTripBooking = bookData.bookings?.find(b => b.groupId === group.id);
  if (groupTripBooking) {
    console.log("SUCCESS! Group Booking verified in User Ledger:");
    console.log(` - PNR Reference: ${groupTripBooking.bookingReference}`);
    console.log(` - Group Name: ${groupTripBooking.groupName}`);
    console.log(` - Role: ${groupTripBooking.travelerRole}`);
    console.log(` - Flight: ${groupTripBooking.airline} (${groupTripBooking.flightNumber})`);
    console.log(` - Route: ${groupTripBooking.originCode} -> ${groupTripBooking.destinationCode}`);
    console.log(` - Seat: ${groupTripBooking.selectedSeats?.join(", ")}`);
    console.log(` - Status: ${groupTripBooking.status}`);
  } else {
    console.error("FAIL: Group booking was not recorded in user bookings ledger.");
  }
}

runTest().catch(console.error);

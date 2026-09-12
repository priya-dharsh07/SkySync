const BASE_URL = "http://localhost:3000";

function getCookies(res) {
  if (res.headers.getSetCookie) {
    return res.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
  }
  const raw = res.headers.get('set-cookie');
  return raw ? raw.split(';')[0] : '';
}

async function run() {
  console.log("=== SkySync Production Flow & Group Booking Verification ===");

  // 1. Register Rohan (BOM)
  console.log("\n1. Registering Rohan Verma with BOM departure origin...");
  const regRohanRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Rohan Verma",
      email: "rohan.verma@test.com",
      password: "password123",
      homeAirport: "BOM",
    }),
  });
  const regRohanData = await regRohanRes.json();
  console.log("Rohan registration response:", regRohanData.success ? "SUCCESS" : regRohanData);

  // 2. Register Ananya (MAA)
  console.log("\n2. Registering Ananya Iyer with MAA departure origin...");
  const regAnanyaRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Ananya Iyer",
      email: "ananya.iyer@test.com",
      password: "password123",
      homeAirport: "MAA",
    }),
  });
  const regAnanyaData = await regAnanyaRes.json();
  console.log("Ananya registration response:", regAnanyaData.success ? "SUCCESS" : regAnanyaData);

  // 3. Verify /api/users returns only registered users
  console.log("\n3. Verifying /api/users returns only genuine registered users...");
  const usersRes = await fetch(`${BASE_URL}/api/users`);
  const usersData = await usersRes.json();
  console.log(`Registered users in DB (${usersData.users.length}):`, usersData.users.map(u => `${u.name} (${u.email}) - Origin: ${u.homeAirport || 'None'}`));

  const mockNames = ["Kenji Sato", "Emma Watson", "Alex Chen"];
  const containsMock = usersData.users.some(u => mockNames.includes(u.name));
  if (containsMock) {
    throw new Error("FAIL: Found mock names in /api/users!");
  }
  console.log("PASS: Zero mock users in DB!");

  // 4. Log in as Priya (Organizer)
  console.log("\n4. Logging in as Priya (Organizer)...");
  const priyaLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "priya@example.com",
      password: "password123",
    }),
  });
  const priyaCookieHeader = getCookies(priyaLoginRes);
  console.log("Priya logged in:", priyaLoginRes.ok, "Cookie set:", !!priyaCookieHeader);

  // 5. Test rejecting unregistered email when creating group
  console.log("\n5. Testing rejection of unregistered member...");
  const invalidGroupRes = await fetch(`${BASE_URL}/api/group-bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": priyaCookieHeader,
    },
    body: JSON.stringify({
      groupName: "Invalid Mock Trip",
      targetDate: "2026-10-15",
      members: [
        { name: "Fake Member", email: "fake.ghost@unregistered.com" }
      ],
    }),
  });
  const invalidGroupData = await invalidGroupRes.json();
  console.log("Unregistered user rejected as expected:", !invalidGroupRes.ok, "Message:", invalidGroupData.message);

  // 6. Create genuine group with registered members: Priya + Rohan + Ananya
  console.log("\n6. Creating Group Trip with registered members (Priya + Rohan + Ananya)...");
  const createGroupRes = await fetch(`${BASE_URL}/api/group-bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": priyaCookieHeader,
    },
    body: JSON.stringify({
      groupName: "Delhi-Mumbai-Chennai Global Convergence",
      targetDate: "2026-11-20",
      members: [
        { name: "Rohan Verma", email: "rohan.verma@test.com" },
        { name: "Ananya Iyer", email: "ananya.iyer@test.com" },
      ],
    }),
  });
  const createGroupData = await createGroupRes.json();
  if (!createGroupRes.ok || !createGroupData.success) {
    throw new Error(`Failed to create group: ${JSON.stringify(createGroupData)}`);
  }
  const group1 = createGroupData.group;
  console.log(`Group created! ID: ${group1.groupId}, Members: ${group1.members.length}`);
  group1.members.forEach(m => {
    console.log(` - Member: ${m.name} (${m.email}), Departure Origin: ${m.originAirport?.code || 'None'} (${m.originAirport?.city || ''})`);
  });

  // 7. Run Optimization
  console.log("\n7. Running Pareto multi-origin optimization...");
  const optRes = await fetch(`${BASE_URL}/api/group-bookings/${group1.groupId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Cookie": priyaCookieHeader,
    },
    body: JSON.stringify({ action: "RUN_OPTIMIZATION" }),
  });
  const optData = await optRes.json();
  console.log("Optimization success:", optData.success);
  console.log("Destination:", optData.group.destination?.city, `(${optData.group.destination?.code})`);
  console.log("Fairness score:", optData.group.optimizationMetrics?.compositeFairnessScore);
  optData.group.members.forEach(m => {
    console.log(` - ${m.name}: Flight ${m.flight?.flightNumber} (${m.originAirport?.code} -> ${optData.group.destination?.code}), Fare: $${m.flight?.priceUsd}`);
  });

  // 8. Lock Itinerary
  console.log("\n8. Locking Itinerary...");
  const lockRes = await fetch(`${BASE_URL}/api/group-bookings/${group1.groupId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Cookie": priyaCookieHeader,
    },
    body: JSON.stringify({ action: "LOCK_ITINERARY" }),
  });
  const lockData = await lockRes.json();
  console.log("Status after locking:", lockData.group.status);

  // 9. Choose Option 1 (INDIVIDUAL pay mode)
  console.log("\n9. Selecting Option 1: Everyone Pays Separately (paymentMode = INDIVIDUAL)...");
  const modeRes = await fetch(`${BASE_URL}/api/group-bookings/${group1.groupId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Cookie": priyaCookieHeader,
    },
    body: JSON.stringify({ action: "SET_PAYMENT_MODE", paymentMode: "INDIVIDUAL" }),
  });
  const modeData = await modeRes.json();
  console.log("Payment mode set:", modeData.group.paymentMode, "Status:", modeData.group.status);

  // 10. Login as Rohan to accept invitation, complete passenger info, select seat, and pay
  console.log("\n10. Logging in as Rohan...");
  const rohanLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "rohan.verma@test.com",
      password: "password123",
    }),
  });
  const rohanCookieHeader = getCookies(rohanLoginRes);

  // Rohan accepts invitation
  console.log("Rohan accepting invitation...");
  await fetch(`${BASE_URL}/api/group-bookings/${group1.groupId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Cookie": rohanCookieHeader },
    body: JSON.stringify({ action: "ACCEPT_INVITATION" }),
  });

  // Rohan enters passenger details
  console.log("Rohan updating passenger details...");
  await fetch(`${BASE_URL}/api/group-bookings/${group1.groupId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Cookie": rohanCookieHeader },
    body: JSON.stringify({
      action: "UPDATE_PASSENGER_DETAILS",
      memberEmail: "rohan.verma@test.com",
      passengerDetails: {
        title: "Mr",
        firstName: "Rohan",
        lastName: "Verma",
        email: "rohan.verma@test.com",
        phone: "+91 98200 11223",
        dateOfBirth: "1994-08-12",
        gender: "male",
        passportNumber: "Z9817263",
        passportCountry: "IND",
        passportExpiry: "2034-01-10",
      },
    }),
  });

  // Rohan selects seat
  console.log("Rohan selecting seat 14A...");
  await fetch(`${BASE_URL}/api/group-bookings/${group1.groupId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Cookie": rohanCookieHeader },
    body: JSON.stringify({
      action: "SELECT_SEAT",
      memberEmail: "rohan.verma@test.com",
      seatId: "14A",
    }),
  });

  // Rohan pays for his ticket
  console.log("Rohan paying individual flight share...");
  const rohanPayRes = await fetch(`${BASE_URL}/api/group-bookings/${group1.groupId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Cookie": rohanCookieHeader },
    body: JSON.stringify({
      action: "PROCESS_MEMBER_PAYMENT",
      memberEmail: "rohan.verma@test.com",
      paymentCardLast4: "5555",
    }),
  });
  const rohanPayData = await rohanPayRes.json();
  const rohanMember = rohanPayData.group.members.find(m => m.email === "rohan.verma@test.com");
  console.log("Rohan payment status:", rohanMember.paymentStatus, "Ticket:", rohanMember.eTicketNumber, "PNR:", rohanMember.bookingReference);

  // 11. Verify privacy: Rohan only sees Rohan's booking in /api/bookings
  console.log("\n11. Verifying Rohan's booking privacy in /api/bookings...");
  const rohanBookingsRes = await fetch(`${BASE_URL}/api/bookings`, {
    headers: { "Cookie": rohanCookieHeader },
  });
  const rohanBookingsData = await rohanBookingsRes.json();
  console.log(`Rohan sees ${rohanBookingsData.bookings.length} booking(s):`, rohanBookingsData.bookings.map(b => `${b.bookingReference} - Passenger: ${b.passengers?.[0]?.firstName || b.passengerDetails?.firstName} ${b.passengers?.[0]?.lastName || b.passengerDetails?.lastName}`));
  if (rohanBookingsData.bookings.length < 1 || !rohanBookingsData.bookings.every(b => b.userEmail === "rohan.verma@test.com")) {
    throw new Error("FAIL: Booking privacy violation! Rohan should only see his own bookings.");
  }
  console.log("PASS: Strict user privacy verified for Option 1!");

  // 12. Test Option 2: Organizer Pays for Everyone
  console.log("\n12. Testing Option 2: Organizer Pays for Everyone in new group...");
  const group2Res = await fetch(`${BASE_URL}/api/group-bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Cookie": priyaCookieHeader },
    body: JSON.stringify({
      groupName: "Corporate Leadership Retreat",
      targetDate: "2026-12-05",
      members: [
        { name: "Rohan Verma", email: "rohan.verma@test.com" },
      ],
    }),
  });
  const group2Data = await group2Res.json();
  const group2 = group2Data.group;

  // Optimize & Lock
  await fetch(`${BASE_URL}/api/group-bookings/${group2.groupId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Cookie": priyaCookieHeader },
    body: JSON.stringify({ action: "RUN_OPTIMIZATION" }),
  });
  await fetch(`${BASE_URL}/api/group-bookings/${group2.groupId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Cookie": priyaCookieHeader },
    body: JSON.stringify({ action: "LOCK_ITINERARY" }),
  });

  // Select Option 2 (ORGANIZER)
  console.log("Setting paymentMode: ORGANIZER (Option 2)...");
  await fetch(`${BASE_URL}/api/group-bookings/${group2.groupId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Cookie": priyaCookieHeader },
    body: JSON.stringify({ action: "SET_PAYMENT_MODE", paymentMode: "ORGANIZER" }),
  });

  // Organizer pays for all travelers
  console.log("Organizer paying for entire group in single transaction...");
  const groupPayRes = await fetch(`${BASE_URL}/api/group-bookings/${group2.groupId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Cookie": priyaCookieHeader },
    body: JSON.stringify({
      action: "PROCESS_GROUP_PAYMENT",
      paymentCardLast4: "9999",
    }),
  });
  const groupPayData = await groupPayRes.json();
  console.log("Group 2 final status:", groupPayData.group.status);
  groupPayData.group.members.forEach(m => {
    console.log(` - ${m.name}: PaymentStatus = ${m.paymentStatus}, Ticket = ${m.eTicketNumber}, PNR = ${m.bookingReference}`);
  });

  // Verify tickets generated for both members
  const allPaid = groupPayData.group.members.every(m => m.paymentStatus === "PAID" && m.eTicketNumber);
  if (!allPaid) {
    throw new Error("FAIL: In Option 2, not all members received confirmed e-tickets!");
  }
  console.log("PASS: Option 2 (Organizer Pay All) issued individual e-tickets for all group members!");

  console.log("\n=== ALL VERIFICATION CHECKS PASSED SUCCESSFULLY ===");
}

run().catch(err => {
  console.error("\nTEST RUN FAILED:", err);
  process.exit(1);
});

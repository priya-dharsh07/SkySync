import fs from "fs";
import path from "path";
import connectDB from "@/lib/mongodb";
import User, { IUser } from "@/models/User";
import Booking, { IBooking } from "@/models/Booking";
import GroupBooking, { IGroupBooking } from "@/models/GroupBooking";

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  homeAirport: string;
  homeCity: string;
  country: string;
  lat: number;
  lng: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoredBooking {
  _id: string;
  userId?: string;
  userEmail?: string;
  groupId?: string;
  groupBookingId?: string;
  groupName?: string;
  isGroupBooking?: boolean;
  travelerRole?: string;
  bookingReference: string;
  eTicketNumber: string;
  flightNumber: string;
  airline: string;
  airlineCode: string;
  origin: string;
  originCode: string;
  destination: string;
  destinationCode: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  passengers: Array<{
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    passportNumber?: string;
    passportCountry?: string;
    passportExpiry?: string;
    visaStatus?: string;
  }>;
  selectedSeats: string[];
  totalPrice: number;
  escrowStatus: "CAPTURED" | "HELD" | "VOIDED";
  status: "CONFIRMED" | "CANCELLED";
  paymentCardLast4: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredGroupBooking {
  _id: string;
  groupId: string;
  groupName: string;
  organizerId: string;
  organizerEmail: string;
  organizerName: string;
  status:
    | "PLANNING"
    | "OPTIMIZED"
    | "ITINERARY_LOCKED"
    | "PAYMENT_IN_PROGRESS"
    | "CONFIRMED"
    | "CANCELLED";
  paymentMode?: "INDIVIDUAL" | "ORGANIZER";
  destination?: any;
  targetDate: string;
  members: any[];
  totalPrice?: number;
  optimizationMetrics?: any;
  createdAt: string;
  updatedAt: string;
}

interface StoreSchema {
  users: StoredUser[];
  bookings: StoredBooking[];
  groupBookings: StoredGroupBooking[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "db_store.json");

function readLocalStore(): StoreSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      const initial: StoreSchema = {
        users: [],
        bookings: [],
        groupBookings: [],
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
      groupBookings: Array.isArray(parsed.groupBookings) ? parsed.groupBookings : [],
    };
  } catch (err) {
    console.error("readLocalStore error:", err);
    return { users: [], bookings: [], groupBookings: [] };
  }
}

function writeLocalStore(store: StoreSchema) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("writeLocalStore error:", err);
  }
}

function mapUserDoc(doc: any): StoredUser {
  return {
    id: doc._id ? doc._id.toString() : doc.id,
    name: doc.name,
    email: doc.email,
    password: doc.password,
    homeAirport: doc.homeAirport || "DEL",
    homeCity: doc.homeCity || "New Delhi",
    country: doc.country || "India",
    lat: doc.lat ?? 28.5562,
    lng: doc.lng ?? 77.1,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
  };
}

function mapBookingDoc(doc: any): StoredBooking {
  return {
    _id: doc._id ? doc._id.toString() : doc.id,
    userId: doc.userId,
    userEmail: doc.userEmail?.toLowerCase(),
    groupId: doc.groupId,
    groupBookingId: doc.groupBookingId,
    groupName: doc.groupName,
    isGroupBooking: doc.isGroupBooking || false,
    travelerRole: doc.travelerRole,
    bookingReference: doc.bookingReference,
    eTicketNumber: doc.eTicketNumber,
    flightNumber: doc.flightNumber,
    airline: doc.airline,
    airlineCode: doc.airlineCode,
    origin: doc.origin,
    originCode: doc.originCode,
    destination: doc.destination,
    destinationCode: doc.destinationCode,
    departureDate: doc.departureDate,
    departureTime: doc.departureTime,
    arrivalTime: doc.arrivalTime,
    passengers: doc.passengers || [],
    selectedSeats: doc.selectedSeats || [],
    totalPrice: doc.totalPrice,
    escrowStatus: doc.escrowStatus || "CAPTURED",
    status: doc.status || "CONFIRMED",
    paymentCardLast4: doc.paymentCardLast4 || "4242",
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
  };
}

function mapGroupBookingDoc(doc: any): StoredGroupBooking {
  return {
    _id: doc._id ? doc._id.toString() : doc.groupId,
    groupId: doc.groupId,
    groupName: doc.groupName,
    organizerId: doc.organizerId,
    organizerEmail: doc.organizerEmail?.toLowerCase(),
    organizerName: doc.organizerName,
    status: doc.status,
    paymentMode: doc.paymentMode,
    destination: doc.destination,
    targetDate: doc.targetDate,
    members: doc.members || [],
    totalPrice: doc.totalPrice || 0,
    optimizationMetrics: doc.optimizationMetrics,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
  };
}

// ----------------- USER HELPERS -----------------

export async function findUsers(query?: string): Promise<StoredUser[]> {
  try {
    const conn = await connectDB();
    if (conn && conn.connection.readyState === 1) {
      const filter: Record<string, unknown> = {};
      if (query && query.trim()) {
        const q = query.trim();
        filter.$or = [
          { name: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
          { homeCity: { $regex: q, $options: "i" } },
          { homeAirport: { $regex: q, $options: "i" } },
        ];
      }
      const docs = await User.find(filter).sort({ createdAt: -1 }).limit(25).lean();
      return (docs || []).map(mapUserDoc);
    }
  } catch (e) {
    console.warn("findUsers MongoDB error, using fallback store:", e);
  }

  const store = readLocalStore();
  let list = store.users;
  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    list = list.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.homeAirport.toLowerCase().includes(q) ||
        u.homeCity.toLowerCase().includes(q)
    );
  }
  return list;
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  if (!id) return null;
  try {
    const conn = await connectDB();
    if (conn && conn.connection.readyState === 1) {
      let doc = null;
      try {
        doc = await User.findById(id).lean();
      } catch {
        doc = await User.findOne({ _id: id }).lean();
      }
      if (doc) return mapUserDoc(doc);
    }
  } catch (e) {}

  const store = readLocalStore();
  return store.users.find((u) => u.id === id) || null;
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  if (!email) return null;
  const norm = email.trim().toLowerCase();
  try {
    const conn = await connectDB();
    if (conn && conn.connection.readyState === 1) {
      const doc = await User.findOne({ email: norm }).lean();
      if (doc) return mapUserDoc(doc);
    }
  } catch (e) {}

  const store = readLocalStore();
  return store.users.find((u) => u.email.toLowerCase() === norm) || null;
}

export async function saveUser(userData: Partial<StoredUser>): Promise<StoredUser> {
  const normEmail = userData.email?.trim().toLowerCase();
  const store = readLocalStore();

  const existingIdx = store.users.findIndex(
    (u) =>
      (userData.id && u.id === userData.id) ||
      (normEmail && u.email.toLowerCase() === normEmail)
  );

  const now = new Date().toISOString();
  let updatedUser: StoredUser;

  if (existingIdx >= 0) {
    updatedUser = {
      ...store.users[existingIdx],
      ...userData,
      email: normEmail || store.users[existingIdx].email,
      updatedAt: now,
    };
    store.users[existingIdx] = updatedUser;
  } else {
    updatedUser = {
      id: userData.id || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: userData.name || "SkySync Traveler",
      email: normEmail || `user${Date.now()}@skysync.app`,
      password: userData.password,
      homeAirport: (userData.homeAirport || "DEL").toUpperCase(),
      homeCity: userData.homeCity || "New Delhi",
      country: userData.country || "India",
      lat: userData.lat ?? 28.5562,
      lng: userData.lng ?? 77.1,
      createdAt: now,
      updatedAt: now,
    };
    store.users.unshift(updatedUser);
  }

  writeLocalStore(store);

  // Sync to MongoDB if connected
  try {
    const conn = await connectDB();
    if (conn && conn.connection.readyState === 1 && normEmail) {
      const doc = await User.findOneAndUpdate(
        { email: normEmail },
        {
          name: updatedUser.name,
          email: updatedUser.email,
          ...(updatedUser.password ? { password: updatedUser.password } : {}),
          homeAirport: updatedUser.homeAirport,
          homeCity: updatedUser.homeCity,
          country: updatedUser.country,
          lat: updatedUser.lat,
          lng: updatedUser.lng,
        },
        { upsert: true, new: true }
      ).lean();
      if (doc) return mapUserDoc(doc);
    }
  } catch (e) {
    console.warn("saveUser MongoDB sync warning:", e);
  }

  return updatedUser;
}

// ----------------- BOOKING HELPERS -----------------

export async function findBookings(userCriteria: {
  userId?: string;
  userEmail?: string;
}): Promise<StoredBooking[]> {
  const normalizedEmail = userCriteria.userEmail?.trim().toLowerCase();
  try {
    const conn = await connectDB();
    if (conn && conn.connection.readyState === 1) {
      const orFilter: any[] = [];
      if (userCriteria.userId) orFilter.push({ userId: userCriteria.userId });
      if (normalizedEmail) {
        orFilter.push({ userEmail: normalizedEmail });
        orFilter.push({ "passengers.email": normalizedEmail });
      }
      const query = orFilter.length > 0 ? { $or: orFilter } : {};
      const docs = await Booking.find(query).sort({ createdAt: -1 }).lean();
      return (docs || []).map(mapBookingDoc);
    }
  } catch (e) {}

  const store = readLocalStore();
  return store.bookings.filter((b) => {
    if (userCriteria.userId && b.userId === userCriteria.userId) return true;
    if (normalizedEmail && b.userEmail?.toLowerCase() === normalizedEmail) return true;
    if (
      normalizedEmail &&
      b.passengers?.some((p) => p.email && p.email.toLowerCase() === normalizedEmail)
    )
      return true;
    return false;
  });
}

export async function findBookingById(id: string): Promise<StoredBooking | null> {
  if (!id) return null;
  try {
    const conn = await connectDB();
    if (conn && conn.connection.readyState === 1) {
      let doc: any = null;
      try {
        doc = await Booking.findById(id).lean();
      } catch {
        doc = await Booking.findOne({
          $or: [{ _id: id }, { bookingReference: id }, { eTicketNumber: id }],
        }).lean();
      }
      return doc ? mapBookingDoc(doc) : null;
    }
  } catch (e) {}

  const store = readLocalStore();
  return store.bookings.find((b) => b._id === id || b.bookingReference === id) || null;
}

export async function saveBooking(bookingData: Partial<StoredBooking>): Promise<StoredBooking> {
  const store = readLocalStore();
  const now = new Date().toISOString();

  const id = bookingData._id || `bkg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const bookingRef =
    bookingData.bookingReference ||
    `SKY-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Math.floor(
      100 + Math.random() * 900
    )}`;

  const eTicket =
    bookingData.eTicketNumber ||
    `ETKT-SS-${Math.floor(100000 + Math.random() * 900000)}-${
      bookingData.originCode || "DEP"
    }`;

  const fieldsToSave: StoredBooking = {
    _id: id,
    userId: bookingData.userId,
    userEmail: bookingData.userEmail?.toLowerCase(),
    groupId: bookingData.groupId,
    groupBookingId: bookingData.groupBookingId,
    groupName: bookingData.groupName,
    isGroupBooking: bookingData.isGroupBooking || false,
    travelerRole: bookingData.travelerRole,
    bookingReference: bookingRef,
    eTicketNumber: eTicket,
    flightNumber: bookingData.flightNumber || "SS-101",
    airline: bookingData.airline || "SkySync Airways",
    airlineCode: bookingData.airlineCode || "SS",
    origin: bookingData.origin || "Origin City",
    originCode: (bookingData.originCode || "DEP").toUpperCase(),
    destination: bookingData.destination || "Destination City",
    destinationCode: (bookingData.destinationCode || "ARR").toUpperCase(),
    departureDate: bookingData.departureDate || "2026-10-15",
    departureTime: bookingData.departureTime || "08:15",
    arrivalTime: bookingData.arrivalTime || "10:30",
    passengers: bookingData.passengers || [],
    selectedSeats: bookingData.selectedSeats || [],
    totalPrice: bookingData.totalPrice || 4950,
    escrowStatus: bookingData.escrowStatus || "CAPTURED",
    status: bookingData.status || "CONFIRMED",
    paymentCardLast4: bookingData.paymentCardLast4 || "4242",
    createdAt: bookingData.createdAt || now,
    updatedAt: now,
  };

  const existingIdx = store.bookings.findIndex((b) => b._id === id);
  if (existingIdx >= 0) {
    store.bookings[existingIdx] = fieldsToSave;
  } else {
    store.bookings.unshift(fieldsToSave);
  }
  writeLocalStore(store);

  // Sync to MongoDB if connected
  try {
    const conn = await connectDB();
    if (conn && conn.connection.readyState === 1) {
      const { _id, ...cleanFields } = fieldsToSave;
      const doc = await Booking.findOneAndUpdate(
        { bookingReference: bookingRef },
        { $set: cleanFields },
        { upsert: true, new: true }
      ).lean();
      if (doc) return mapBookingDoc(doc);
    }
  } catch (e) {
    console.error("saveBooking MongoDB sync error:", e);
  }

  return fieldsToSave;
}

export async function updateBookingStatus(
  id: string,
  status: "CONFIRMED" | "CANCELLED",
  escrowStatus: "CAPTURED" | "HELD" | "VOIDED"
): Promise<StoredBooking | null> {
  const store = readLocalStore();
  const idx = store.bookings.findIndex((b) => b._id === id || b.bookingReference === id);

  if (idx >= 0) {
    store.bookings[idx].status = status;
    store.bookings[idx].escrowStatus = escrowStatus;
    store.bookings[idx].updatedAt = new Date().toISOString();
    writeLocalStore(store);
  }

  try {
    const conn = await connectDB();
    if (conn && conn.connection.readyState === 1) {
      const doc = await Booking.findOneAndUpdate(
        { $or: [{ _id: id }, { bookingReference: id }] },
        { status, escrowStatus, updatedAt: new Date() },
        { new: true }
      ).lean();
      if (doc) return mapBookingDoc(doc);
    }
  } catch (e) {}

  return idx >= 0 ? store.bookings[idx] : null;
}

// ----------------- GROUP BOOKING HELPERS -----------------

export async function findGroupBookings(userCriteria: {
  userId?: string;
  userEmail?: string;
}): Promise<StoredGroupBooking[]> {
  const normalizedEmail = userCriteria.userEmail?.trim().toLowerCase();
  try {
    const conn = await connectDB();
    if (conn && conn.connection.readyState === 1) {
      const orFilter: any[] = [];
      if (userCriteria.userId) {
        orFilter.push({ organizerId: userCriteria.userId });
        orFilter.push({ "members.userId": userCriteria.userId });
      }
      if (normalizedEmail) {
        orFilter.push({ organizerEmail: normalizedEmail });
        orFilter.push({ "members.email": normalizedEmail });
      }

      const query = orFilter.length > 0 ? { $or: orFilter } : {};
      const docs = await GroupBooking.find(query).sort({ createdAt: -1 }).lean();
      return (docs || []).map(mapGroupBookingDoc);
    }
  } catch (e) {}

  const store = readLocalStore();
  return store.groupBookings.filter((gb) => {
    if (userCriteria.userId && gb.organizerId === userCriteria.userId) return true;
    if (normalizedEmail && gb.organizerEmail?.toLowerCase() === normalizedEmail) return true;
    if (
      normalizedEmail &&
      gb.members?.some((m) => m.email && m.email.toLowerCase() === normalizedEmail)
    )
      return true;
    if (
      userCriteria.userId &&
      gb.members?.some((m) => m.userId && m.userId === userCriteria.userId)
    )
      return true;
    return false;
  });
}

export async function findGroupBookingById(idOrGroupId: string): Promise<StoredGroupBooking | null> {
  if (!idOrGroupId) return null;
  try {
    const conn = await connectDB();
    if (conn && conn.connection.readyState === 1) {
      let doc: any = null;
      try {
        doc = await GroupBooking.findOne({ groupId: idOrGroupId }).lean();
      } catch (e) {
        console.warn("findGroupBookingById MongoDB error:", e);
      }
      if (doc) return mapGroupBookingDoc(doc);
    }
  } catch (e) {}

  const store = readLocalStore();
  return (
    store.groupBookings.find(
      (gb) => gb.groupId === idOrGroupId || gb._id === idOrGroupId
    ) || null
  );
}

export async function saveGroupBooking(
  groupData: Partial<StoredGroupBooking>
): Promise<StoredGroupBooking> {
  const store = readLocalStore();
  const now = new Date().toISOString();

  const groupId =
    groupData.groupId ||
    `grp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const id = groupData._id || groupId;

  const existingIdx = store.groupBookings.findIndex(
    (gb) => gb.groupId === groupId || gb._id === id
  );

  const merged: StoredGroupBooking = {
    _id: id,
    groupId,
    groupName: groupData.groupName || "SkySync Group Trip",
    organizerId: groupData.organizerId || "organizer-id",
    organizerEmail: groupData.organizerEmail?.toLowerCase() || "organizer@skysync.app",
    organizerName: groupData.organizerName || "Group Organizer",
    status: groupData.status || "PLANNING",
    paymentMode: groupData.paymentMode,
    destination: groupData.destination,
    targetDate: groupData.targetDate || "2026-10-15",
    members: groupData.members || [],
    totalPrice: groupData.totalPrice || 0,
    optimizationMetrics: groupData.optimizationMetrics,
    createdAt: (existingIdx >= 0 ? store.groupBookings[existingIdx].createdAt : null) || now,
    updatedAt: now,
  };

  if (existingIdx >= 0) {
    store.groupBookings[existingIdx] = merged;
  } else {
    store.groupBookings.unshift(merged);
  }
  writeLocalStore(store);

  // Sync to MongoDB if connected
  try {
    const conn = await connectDB();
    if (conn && conn.connection.readyState === 1) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, ...mergedWithoutId } = merged;
      const doc = await GroupBooking.findOneAndUpdate(
        { groupId },
        { $set: mergedWithoutId },
        { upsert: true, new: true }
      ).lean();
      if (doc) return mapGroupBookingDoc(doc);
    }
  } catch (e) {
    console.warn("saveGroupBooking MongoDB sync warning:", e);
  }

  return merged;
}

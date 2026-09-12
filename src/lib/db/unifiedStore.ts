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

// Pre-existing verified primary user for login; all other travelers must be genuinely registered
const SEED_USERS: StoredUser[] = [
  {
    id: "usr-priya-01",
    name: "Priyadharshini Sundaram",
    email: "priya@example.com",
    homeAirport: "DEL",
    homeCity: "New Delhi",
    country: "India",
    lat: 28.5562,
    lng: 77.1,
    createdAt: "2026-01-10T10:00:00.000Z",
    updatedAt: "2026-01-10T10:00:00.000Z",
  },
];

function readLocalStore(): StoreSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      const initial: StoreSchema = {
        users: SEED_USERS,
        bookings: [],
        groupBookings: [],
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed.users || parsed.users.length === 0) {
      parsed.users = SEED_USERS;
      writeLocalStore(parsed);
    }
    return parsed;
  } catch (err) {
    console.error("readLocalStore error:", err);
    return { users: SEED_USERS, bookings: [], groupBookings: [] };
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

// ----------------- USER HELPERS -----------------

export async function findUsers(query?: string): Promise<StoredUser[]> {
  try {
    const conn = await connectDB();
    if (conn && conn.connection.readyState === 1) {
      const filter: Record<string, unknown> = {};
      if (query && query.trim()) {
        filter.$or = [
          { name: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
          { homeCity: { $regex: query, $options: "i" } },
          { homeAirport: { $regex: query, $options: "i" } },
        ];
      }
      const docs = await User.find(filter).limit(25).lean();
      if (docs && docs.length > 0) {
        return docs.map((d: any) => ({
          id: d._id.toString(),
          name: d.name,
          email: d.email,
          homeAirport: d.homeAirport || "DEL",
          homeCity: d.homeCity || "New Delhi",
          country: d.country || "India",
          lat: d.lat ?? 28.5562,
          lng: d.lng ?? 77.1,
          createdAt: d.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: d.updatedAt?.toISOString() || new Date().toISOString(),
        }));
      }
    }
  } catch (e) {
    // Mongo unavailable, fallback smoothly
  }

  // Fallback to local store
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
  try {
    const conn = await connectDB();
    if (conn && conn.connection.readyState === 1) {
      const doc: any = await User.findById(id).lean();
      if (doc) {
        return {
          id: doc._id.toString(),
          name: doc.name,
          email: doc.email,
          homeAirport: doc.homeAirport || "DEL",
          homeCity: doc.homeCity || "New Delhi",
          country: doc.country || "India",
          lat: doc.lat ?? 28.5562,
          lng: doc.lng ?? 77.1,
          createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
        };
      }
    }
  } catch (e) {}

  const store = readLocalStore();
  return store.users.find((u) => u.id === id) || null;
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const norm = email.trim().toLowerCase();
  try {
    const conn = await connectDB();
    if (conn && conn.connection.readyState === 1) {
      const doc: any = await User.findOne({ email: norm }).lean();
      if (doc) {
        return {
          id: doc._id.toString(),
          name: doc.name,
          email: doc.email,
          password: doc.password,
          homeAirport: doc.homeAirport || "DEL",
          homeCity: doc.homeCity || "New Delhi",
          country: doc.country || "India",
          lat: doc.lat ?? 28.5562,
          lng: doc.lng ?? 77.1,
          createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
        };
      }
    }
  } catch (e) {}

  const store = readLocalStore();
  return store.users.find((u) => u.email.toLowerCase() === norm) || null;
}

export async function saveUser(userData: Partial<StoredUser>): Promise<StoredUser> {
  const store = readLocalStore();
  const existingIndex = store.users.findIndex(
    (u) =>
      (userData.id && u.id === userData.id) ||
      (userData.email && u.email.toLowerCase() === userData.email.toLowerCase())
  );

  const now = new Date().toISOString();
  let updatedUser: StoredUser;

  if (existingIndex >= 0) {
    updatedUser = {
      ...store.users[existingIndex],
      ...userData,
      updatedAt: now,
    };
    store.users[existingIndex] = updatedUser;
  } else {
    updatedUser = {
      id: userData.id || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: userData.name || "SkySync Traveler",
      email: userData.email || `user${Date.now()}@skysync.app`,
      password: userData.password,
      homeAirport: (userData.homeAirport || "DEL").toUpperCase(),
      homeCity: userData.homeCity || "New Delhi",
      country: userData.country || "India",
      lat: userData.lat ?? 28.5562,
      lng: userData.lng ?? 77.1,
      createdAt: now,
      updatedAt: now,
    };
    store.users.push(updatedUser);
  }

  writeLocalStore(store);

  // Sync to Mongo if possible
  try {
    const conn = await connectDB();
    if (conn && conn.connection.readyState === 1) {
      await User.findOneAndUpdate(
        { email: updatedUser.email },
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
        { upsert: true }
      );
    }
  } catch (e) {}

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

      const docs = await Booking.find(orFilter.length > 0 ? { $or: orFilter } : {})
        .sort({ createdAt: -1 })
        .lean();

      if (docs && docs.length > 0) {
        return docs.map((d: any) => ({
          ...d,
          _id: d._id.toString(),
          createdAt: d.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: d.updatedAt?.toISOString() || new Date().toISOString(),
        }));
      }
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
  try {
    const conn = await connectDB();
    if (conn && conn.connection.readyState === 1) {
      const doc: any = await Booking.findById(id).lean();
      if (doc) {
        return {
          ...doc,
          _id: doc._id.toString(),
          createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
        };
      }
    }
  } catch (e) {}

  const store = readLocalStore();
  return store.bookings.find((b) => b._id === id || b.bookingReference === id) || null;
}

export async function saveBooking(bookingData: Partial<StoredBooking>): Promise<StoredBooking> {
  const store = readLocalStore();
  const now = new Date().toISOString();

  const id =
    bookingData._id ||
    `bkg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const newBooking: StoredBooking = {
    _id: id,
    userId: bookingData.userId,
    userEmail: bookingData.userEmail?.toLowerCase(),
    groupId: bookingData.groupId,
    groupBookingId: bookingData.groupBookingId,
    groupName: bookingData.groupName,
    isGroupBooking: bookingData.isGroupBooking || false,
    travelerRole: bookingData.travelerRole,
    bookingReference:
      bookingData.bookingReference ||
      `SKY-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Math.floor(
        100 + Math.random() * 900
      )}`,
    eTicketNumber:
      bookingData.eTicketNumber ||
      `ETKT-SS-${Math.floor(100000 + Math.random() * 900000)}-${
        bookingData.originCode || "DEP"
      }`,
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
    store.bookings[existingIdx] = newBooking;
  } else {
    store.bookings.unshift(newBooking);
  }

  writeLocalStore(store);

  // Sync to MongoDB if connected
  try {
    const conn = await connectDB();
    if (conn && conn.connection.readyState === 1) {
      await Booking.findOneAndUpdate(
        { bookingReference: newBooking.bookingReference },
        newBooking,
        { upsert: true, new: true }
      );
    }
  } catch (e) {}

  return newBooking;
}

export async function updateBookingStatus(
  id: string,
  status: "CONFIRMED" | "CANCELLED",
  escrowStatus: "CAPTURED" | "HELD" | "VOIDED"
): Promise<StoredBooking | null> {
  const store = readLocalStore();
  const idx = store.bookings.findIndex((b) => b._id === id || b.bookingReference === id);
  if (idx < 0) return null;

  store.bookings[idx].status = status;
  store.bookings[idx].escrowStatus = escrowStatus;
  store.bookings[idx].updatedAt = new Date().toISOString();

  writeLocalStore(store);

  try {
    const conn = await connectDB();
    if (conn && conn.connection.readyState === 1) {
      await Booking.findByIdAndUpdate(id, {
        status,
        escrowStatus,
      });
    }
  } catch (e) {}

  return store.bookings[idx];
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

      const docs = await GroupBooking.find(orFilter.length > 0 ? { $or: orFilter } : {})
        .sort({ createdAt: -1 })
        .lean();

      if (docs && docs.length > 0) {
        return docs.map((d: any) => ({
          ...d,
          _id: d._id.toString(),
          createdAt: d.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: d.updatedAt?.toISOString() || new Date().toISOString(),
        }));
      }
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
  try {
    const conn = await connectDB();
    if (conn && conn.connection.readyState === 1) {
      const doc: any = await GroupBooking.findOne({
        $or: [{ _id: idOrGroupId }, { groupId: idOrGroupId }],
      }).lean();
      if (doc) {
        return {
          ...doc,
          _id: doc._id.toString(),
          createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
        };
      }
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

  try {
    const conn = await connectDB();
    if (conn && conn.connection.readyState === 1) {
      await GroupBooking.findOneAndUpdate({ groupId }, merged, {
        upsert: true,
        new: true,
      });
    }
  } catch (e) {}

  return merged;
}

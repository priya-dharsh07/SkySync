import mongoose, { Schema, Document, Model } from "mongoose";
import { Airport } from "@/lib/convergence/airports";
import { FlightLeg } from "@/lib/convergence/flightGraph";

export interface IGroupMember {
  userId?: string;
  name: string;
  email: string;
  role: "ORGANIZER" | "MEMBER";
  invitationStatus: "INVITED" | "ACCEPTED" | "DECLINED";
  originAirport?: Airport;
  flight?: FlightLeg;
  passengerDetails?: {
    title?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth?: string;
    gender?: string;
    passportNumber?: string;
    passportCountry?: string;
    passportExpiry?: string;
    visaStatus?: string;
  };
  passengerDetailsComplete: boolean;
  selectedSeat?: string;
  paymentStatus: "UNPAID" | "PROCESSING" | "PAID" | "FAILED";
  bookingReference?: string;
  eTicketNumber?: string;
  bookingId?: string;
  paidAt?: Date;
}

export interface IGroupBooking extends Document {
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
  destination?: Airport;
  targetDate: string;
  members: IGroupMember[];
  totalPrice?: number;
  optimizationMetrics?: {
    arrivalWindowMinutes?: number;
    averagePriceUsd?: number;
    fairnessScore?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const GroupMemberSchema = new Schema<IGroupMember>(
  {
    userId: { type: String, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ["ORGANIZER", "MEMBER"], default: "MEMBER" },
    invitationStatus: {
      type: String,
      enum: ["INVITED", "ACCEPTED", "DECLINED"],
      default: "INVITED",
    },
    originAirport: { type: Object },
    flight: { type: Object },
    passengerDetails: { type: Object },
    passengerDetailsComplete: { type: Boolean, default: false },
    selectedSeat: { type: String },
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PROCESSING", "PAID", "FAILED"],
      default: "UNPAID",
    },
    bookingReference: { type: String },
    eTicketNumber: { type: String },
    bookingId: { type: String },
    paidAt: { type: Date },
  },
  { _id: false }
);

const GroupBookingSchema = new Schema<IGroupBooking>(
  {
    groupId: { type: String, required: true, unique: true, index: true },
    groupName: { type: String, required: true, trim: true },
    organizerId: { type: String, required: true, index: true },
    organizerEmail: { type: String, required: true, lowercase: true, trim: true },
    organizerName: { type: String, required: true },
    status: {
      type: String,
      enum: [
        "PLANNING",
        "OPTIMIZED",
        "ITINERARY_LOCKED",
        "PAYMENT_IN_PROGRESS",
        "CONFIRMED",
        "CANCELLED",
      ],
      default: "PLANNING",
    },
    paymentMode: { type: String, enum: ["INDIVIDUAL", "ORGANIZER"] },
    destination: { type: Object },
    targetDate: { type: String, default: "2026-10-15" },
    members: { type: [GroupMemberSchema], default: [] },
    totalPrice: { type: Number, default: 0 },
    optimizationMetrics: { type: Object },
  },
  {
    timestamps: true,
  }
);

export const GroupBooking: Model<IGroupBooking> =
  mongoose.models.GroupBooking ||
  mongoose.model<IGroupBooking>("GroupBooking", GroupBookingSchema);

export default GroupBooking;

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBooking extends Document {
  userId?: string;
  userEmail?: string;
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
    email: string;
    phone: string;
    passportNumber?: string;
    passportCountry?: string;
    visaStatus?: string;
  }>;
  selectedSeats: string[];
  totalPrice: number;
  escrowStatus: "CAPTURED" | "HELD" | "VOIDED";
  status: "CONFIRMED" | "CANCELLED";
  paymentCardLast4: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema: Schema<IBooking> = new Schema(
  {
    userId: { type: String, index: true },
    userEmail: { type: String, index: true },
    bookingReference: { type: String, required: true, unique: true, index: true },
    eTicketNumber: { type: String, required: true },
    flightNumber: { type: String, required: true },
    airline: { type: String, required: true },
    airlineCode: { type: String, required: true },
    origin: { type: String, required: true },
    originCode: { type: String, required: true },
    destination: { type: String, required: true },
    destinationCode: { type: String, required: true },
    departureDate: { type: String, required: true },
    departureTime: { type: String, required: true },
    arrivalTime: { type: String, required: true },
    passengers: { type: [Object], required: true },
    selectedSeats: { type: [String], default: [] },
    totalPrice: { type: Number, required: true },
    escrowStatus: { type: String, enum: ["CAPTURED", "HELD", "VOIDED"], default: "CAPTURED" },
    status: { type: String, enum: ["CONFIRMED", "CANCELLED"], default: "CONFIRMED" },
    paymentCardLast4: { type: String, default: "4242" },
  },
  {
    timestamps: true,
  }
);

export const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);

export default Booking;

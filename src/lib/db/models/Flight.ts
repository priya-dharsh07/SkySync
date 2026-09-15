import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFlight extends Document {
  airline: string;
  airlineCode: string;
  flightNumber: string;
  origin: string;
  originCode: string;
  destination: string;
  destinationCode: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  price: number;
  availableSeats: number;
  totalSeats: number;
  type: "domestic" | "international";
  status: "scheduled" | "delayed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const FlightSchema: Schema<IFlight> = new Schema(
  {
    airline: { type: String, required: true },
    airlineCode: { type: String, required: true, uppercase: true },
    flightNumber: { type: String, required: true },
    origin: { type: String, required: true },
    originCode: { type: String, required: true, uppercase: true, index: true },
    destination: { type: String, required: true },
    destinationCode: { type: String, required: true, uppercase: true, index: true },
    departureDate: { type: String, required: true, index: true },
    departureTime: { type: String, required: true },
    arrivalTime: { type: String, required: true },
    duration: { type: Number, required: true },
    price: { type: Number, required: true },
    availableSeats: { type: Number, required: true, default: 180 },
    totalSeats: { type: Number, required: true, default: 180 },
    type: { type: String, enum: ["domestic", "international"], default: "domestic" },
    status: { type: String, enum: ["scheduled", "delayed", "cancelled"], default: "scheduled" },
  },
  {
    timestamps: true,
  }
);

export const FlightModel: Model<IFlight> =
  mongoose.models.Flight || mongoose.model<IFlight>("Flight", FlightSchema);

export default FlightModel;

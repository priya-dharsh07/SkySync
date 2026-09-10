import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGroupSession extends Document {
  sessionId: string;
  destination: {
    code: string;
    city: string;
    country: string;
    name: string;
    lat: number;
    lng: number;
  };
  members: Array<{
    id: string;
    name: string;
    originAirport: {
      code: string;
      city: string;
      country: string;
      lat: number;
      lng: number;
    };
    flight: {
      airline: string;
      flightNumber: string;
      departureLocal: string;
      arrivalLocal: string;
      durationMinutes: number;
      priceUsd: number;
    };
    selectedSeat: string;
    escrowStatus: string;
    isLocked: boolean;
  }>;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  createdAt: Date;
  updatedAt: Date;
}

const GroupSessionSchema: Schema<IGroupSession> = new Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    destination: { type: Object, required: true },
    members: { type: [Object], required: true },
    status: { type: String, enum: ["ACTIVE", "COMPLETED", "CANCELLED"], default: "ACTIVE" },
  },
  {
    timestamps: true,
  }
);

export const GroupSessionModel: Model<IGroupSession> =
  mongoose.models.GroupSession || mongoose.model<IGroupSession>("GroupSession", GroupSessionSchema);

export default GroupSessionModel;

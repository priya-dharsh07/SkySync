import mongoose, { Schema, Model } from "mongoose";

export interface IFlight {
  airline: string;
  airlineCode: string;
  flightNumber: string;

  origin: string;
  destination: string;

  originCode: string;
  destinationCode: string;

  departureDate: Date;
  arrivalDate: Date;

  departureTime: string;
  arrivalTime: string;

  duration: number;

  price: number;

  availableSeats: number;
  totalSeats: number;

  class: "economy" | "business";

  type: "domestic" | "international";

  status: "scheduled" | "delayed" | "cancelled";
}

const FlightSchema = new Schema<IFlight>(
  {
    airline: {
      type: String,
      required: true,
    },

    airlineCode: {
      type: String,
      required: true,
    },

    flightNumber: {
      type: String,
      required: true,
    },

    origin: {
      type: String,
      required: true,
    },

    destination: {
      type: String,
      required: true,
    },

    originCode: {
      type: String,
      required: true,
      uppercase: true,
    },

    destinationCode: {
      type: String,
      required: true,
      uppercase: true,
    },

    departureDate: {
      type: Date,
      required: true,
    },

    arrivalDate: {
      type: Date,
      required: true,
    },

    departureTime: {
      type: String,
      required: true,
    },

    arrivalTime: {
      type: String,
      required: true,
    },

    duration: {
      type: Number,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    availableSeats: {
      type: Number,
      required: true,
      min: 0,
    },

    totalSeats: {
      type: Number,
      required: true,
    },

    class: {
      type: String,
      enum: ["economy", "business"],
      required: true,
    },

    type: {
      type: String,
      enum: ["domestic", "international"],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "scheduled",
        "delayed",
        "cancelled",
      ],
      default: "scheduled",
    },
  },
  {
    timestamps: true,
  }
);

const Flight: Model<IFlight> =
  mongoose.models.Flight ||
  mongoose.model<IFlight>("Flight", FlightSchema);

export default Flight;
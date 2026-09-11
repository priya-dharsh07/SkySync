import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: "user" | "admin";
  homeAirport?: string;
  homeCity?: string;
  country?: string;
  lat?: number;
  lng?: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    homeAirport: {
      type: String,
      trim: true,
      uppercase: true,
      default: "DEL",
    },
    homeCity: {
      type: String,
      trim: true,
      default: "New Delhi",
    },
    country: {
      type: String,
      trim: true,
      default: "India",
    },
    lat: {
      type: Number,
      default: 28.5562,
    },
    lng: {
      type: Number,
      default: 77.1000,
    },
  },
  {
    timestamps: true,
  }
);

export const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default UserModel;

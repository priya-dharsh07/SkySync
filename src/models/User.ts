import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  homeAirport?: string;
  homeCity?: string;
  country?: string;
  lat?: number;
  lng?: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
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

const User: Model<IUser> =
  mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);

export default User;
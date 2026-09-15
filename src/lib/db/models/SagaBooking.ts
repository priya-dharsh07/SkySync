import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISagaBooking extends Document {
  sessionId: string;
  isAtomicSuccess: boolean;
  totalCapturedUsd: number;
  totalRefundedVoidedUsd: number;
  totalMembers: number;
  steps: Record<string, unknown>;
  members: Array<unknown>;
  logs: Array<{
    timestamp: string;
    step: string;
    message: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const SagaBookingSchema: Schema<ISagaBooking> = new Schema(
  {
    sessionId: { type: String, required: true, index: true },
    isAtomicSuccess: { type: Boolean, required: true },
    totalCapturedUsd: { type: Number, required: true, default: 0 },
    totalRefundedVoidedUsd: { type: Number, required: true, default: 0 },
    totalMembers: { type: Number, required: true },
    steps: { type: Object, required: true },
    members: { type: [Object], required: true },
    logs: { type: [Object], required: true },
  },
  {
    timestamps: true,
  }
);

export const SagaBookingModel: Model<ISagaBooking> =
  mongoose.models.SagaBooking || mongoose.model<ISagaBooking>("SagaBooking", SagaBookingSchema);

export default SagaBookingModel;

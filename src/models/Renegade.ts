import mongoose from "mongoose";
export type RenegadeDocument = mongoose.Document & {
  username: string;
  auctions: Array<number>;
};

const renegadeSchema = new mongoose.Schema({
  username: String,
  auctions: Array,
}, { timestamps: true });

export const Renegade = mongoose.model<RenegadeDocument>("Renegade", renegadeSchema);

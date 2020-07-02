import mongoose from "mongoose";
import { Media } from './Media';
import { any } from "bluebird";
export type AuctionDocument = mongoose.Document & {
    media: Media;
    userId: string;
    price: string;
    step: string;
    start: Date;
    end: Date;
    prolongation: string;
    bids: Bid[];
    winner: Bid;
};
export interface Bid {
    ammount: Number,
    userId: String,
    sended: Date,
}

const auctionSchema = new mongoose.Schema({
    userId: String,
    mediaId: String,
    price: String,
    step: String,
    start: Date,
    end: Date,
    prolongation: String,
    media: {
        id: String,
        media_url: String,
        owner: String,
        permalink: String,
        shortcode: String,
        thumbnail_url: String,
        comments: {
            data: Array
        },
        caption: String,
    },
    bids: Array,
    winner: {
        ammount: Number,
        userId: String,
        sended: Date,
    }
}, { timestamps: true });

export const Auction = mongoose.model<AuctionDocument>("Auction", auctionSchema);

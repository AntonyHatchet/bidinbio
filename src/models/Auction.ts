import mongoose from "mongoose";
import { Media } from './Media';
import { any } from "bluebird";

export enum AuctionStatus {
    active = 'active',
    finished = 'finished',
    canceled = 'canceled',
}
export type AuctionDocument = mongoose.Document & {
    media: Media;
    mediaId: string;
    userId: string;
    startingPrice: string;
    price: string;
    bin: number;
    step: string;
    start: Date;
    end: Date;
    prolongation: string;
    bids: Bid[];
    winner: Bid;
    status: AuctionStatus;
};
export interface Bid {
    ammount: Number,
    username: String,
    sended: Date,
    commentId: string,
}

const auctionSchema = new mongoose.Schema({
    userId: String,
    mediaId: String,
    price: String,
    startingPrice: String,
    bin: Number,
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
        username: String,
        sended: Date,
        commentId: String
    },
    status: String,
}, { timestamps: true });

export const Auction = mongoose.model<AuctionDocument>("Auction", auctionSchema);

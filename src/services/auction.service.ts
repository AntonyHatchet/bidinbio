import mongoose from "mongoose";
import {
  createCommentForMedia,
  replyForComment,
  replyForMention,
} from "./instagram.service";
import { Auction, AuctionStatus, Renegade, User } from "../models";
import getToken from "../util/getToken";
import { IG_ACCOUNT_ID } from "../util/secrets";

export enum AuctionAnswers {
  bidAccepted = "Congrats your bid was accepted!",
  bidLowerThanCurrent = "Bid is lower or the same as current",
  bidLowerThanMinimalRaise = "Minimal raise is 1$",
}

export async function closeAllEndedAuctions() {
  const auctions = await Auction.find({ end: { $lte: new Date() }, status: "active"});
  console.log(`Found ${auctions.length} to close`);

  for (const auction of auctions) {
    console.log(JSON.stringify(auction));
    const { mediaId, bids, userId, bin } = auction;
    if (bids.length === 0) {
      await sendAuctionEndMessagesWithoutWinner(mediaId);
      auction.status = AuctionStatus.finished;
      await auction.save();
      continue;
    }
    const winner = bids[bids.length - 1];
    const user = await User.findOne({ "businessAccounts.facebook.id": userId });
    const { longLiveToken } = getToken(user, "facebook");

    auction.status = AuctionStatus.finished;
    auction.winner = winner;
    await auction.save();
    await sendAuctionEndMessages({
      commentId: winner.commentId, 
      token: longLiveToken,
      username: winner.username, 
      mediaId, 
      ammount: winner.ammount, 
      bin,
    });
  }
}

interface AuctionEndMessages { 
  commentId: string;
  token: string;
  username: string;
  mediaId: string;
  ammount: string | number;
  bin: string | number;
}
export async function sendAuctionEndMessages({ commentId, token, username, mediaId, ammount, bin }: AuctionEndMessages) {
  await replyForComment({
    commentId,
    token,
    message: `@${username} Congrats! You got it! I'll DM you soon`,
  });

  const bidInBioUser = await User.findOne({ "businessAccounts.facebook.id": IG_ACCOUNT_ID });
  const { longLiveToken } = getToken(bidInBioUser, "facebook");

  await replyForMention({
    userId: IG_ACCOUNT_ID,
    media_id: mediaId,
    token: longLiveToken, 
    message: `🏁The bidding is over. Sold ${+bin > +ammount? `for $${ammount}`: "@ BIN"}`
  });
}

export async function sendAuctionEndMessagesWithoutWinner(mediaId: string) {
  const bidInBioUser = await User.findOne({ "businessAccounts.facebook.id": IG_ACCOUNT_ID });
  const { longLiveToken } = getToken(bidInBioUser, "facebook");

  await replyForMention({
    userId: IG_ACCOUNT_ID,
    media_id: mediaId,
    token: longLiveToken, 
    message: "🏁The bidding is over — no winner this time."
  });
}

export async function winnerBackedOut(mediaId: string) {
  const auction = await Auction.findOne({ mediaId });
  const renegade = auction.bids.pop();

  if(!renegade) {
    return auction;
  }

  await Renegade.updateOne({
    username: renegade.username,
  }, {
    username: renegade.username,
    "$addToSet": { 
      auctions: auction._id
    }
  }, {upsert: true});

  const newWinner = auction.bids[auction.bids.length - 1];
  
  if (!newWinner) {
    auction.price = auction.startingPrice;
    auction.winner = null;

    return await auction.save();
  }

  auction.price = newWinner.ammount,
  auction.winner = newWinner;

  return await auction.save();
}

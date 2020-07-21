import mongoose from "mongoose";
import {
  createCommentForMedia,
  replyForComment, 
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
  for (const auction of auctions) {
    const { mediaId, bids, userId, bin } = auction;
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

  await createCommentForMedia({
    mediaId,
    token: longLiveToken, 
    message: `🏁The bidding is over. Sold ${+bin > +ammount? `for $${ammount}`: "@ BIN"}`
  });
}

export async function winnerBackedOut(mediaId: string) {
  const auction = await Auction.findOne({ mediaId });
  const renegade = auction.winner;

  if(!renegade) {
    return auction;
  }

  await Renegade.update({
    username: renegade.username,
  }, {
    username: renegade.username,
    "$addToSet": { 
      auctions: auction._id
    }
  }, {upsert: true});

  const newBids = auction.bids.map( bid => {
    if (bid.username === renegade.username) {
      bid.renegade = true;
    }
    return bid;
  });

  const newBidsWithoutRenegate = newBids.filter(bid => !bid.renegade);
  const newWinner = newBidsWithoutRenegate[newBidsWithoutRenegate.length - 1];

  if (!newWinner) {
    return await Auction.findByIdAndUpdate({
      _id: auction._id,
    }, {
      price: auction.startingPrice,
      bids: newBids,
      winner: null
    });
  }

  return await Auction.findByIdAndUpdate({
    _id: auction._id,
  }, {
    price: newWinner.ammount,
    bids: newBids,
    winner: newWinner
  });
}

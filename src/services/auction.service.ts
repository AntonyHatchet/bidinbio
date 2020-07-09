import mongoose from 'mongoose';
import {
  createCommentForMedia,
  replyForComment, 
} from "./instagram.service";
import { Auction, User, AuctionStatus } from '../models';
import getToken from '../util/getToken';

export enum AuctionAnswers {
  bidAccepted = 'Congrats your bid was accepted!',
  bidLowerThanCurrent = 'Bid is lower or the same as current',
  bidLowerThanMinimalRaise = 'Minimal raise is 1$',
}

export async function closeAllEndedAuctions() {
  const auctions = await Auction.find({ end: { $lte: new Date() }, status: 'active'});
  for (let auction of auctions) {
    const { mediaId, bids, userId, bin } = auction;
    const winner = bids[bids.length - 1];
    const user = await User.findOne({ 'bussinessAccounts.facebook': userId });
    const { longLiveToken } = getToken(user, 'facebook');

    auction.status = AuctionStatus.finished;
    auction.winner = winner;
    await auction.save();
    await replyForComment({ 
      commentId: winner.commentId,
      token: longLiveToken,
      message: `You got it! I'll DM you soon!`,
    });
    await createCommentForMedia({
      mediaId,
      token: longLiveToken, 
      message: `Sold for ${+bin > +winner.ammount? `$${winner.ammount}`: '@ BIN'}`
    })
    console.log('success');
  }
}

export async function endAuction({commentId, ammount, bin, auction}) {

  await replyForComment({ 
    commentId: winner.commentId,
    token: longLiveToken,
    message: `You got it! I'll DM you soon!`,
  });
  await createCommentForMedia({
    mediaId,
    token: longLiveToken, 
    message: `Sold for ${+bin > +winner.ammount? `$${winner.ammount}`: '@ BIN'}`
  })
}
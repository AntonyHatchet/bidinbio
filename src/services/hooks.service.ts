import {
  createCommentForMedia,
  loadComment,
  loadMediaById,
  replyForMention,
  replyForComment,
} from "./instagram.service";
import { User, Comment, Auction, AuctionStatus } from "../models";
import { 
  media, 
  auctionMessages,
  mentions,
  fakeClientId,
  bidInBioId,
} from "../util/fixture";
import getToken from "../util/getToken";
import { Bid } from "../models/Auction";
const twenyFourHours = 86400000;

interface CommentHook {
  text?: string;
  userId?: string;
  time?: string;
  commentId?: string;
}


interface StoryInsightsHook {
  media_id: string;
  impressions: number;
  reach: number;
  taps_forward: number;
  taps_back: number;
  exits: number;
  replies: number;
}
export const handleCommentsHook = async ({ time, userId, text, commentId }: CommentHook) => {
  const comment = await Comment.findOne({ commentId: commentId });
  if(comment && comment.commentId){
    return console.log(`Comment ${commentId} already exist, do nothing`);
  }

  const bid = getBidFromComment(text);

  if(!bid) {
    return console.log(`Comment ${commentId} is not a bid, ignore it`);
  }

  const user = await User.findOne({ "businessAccounts.facebook.id": userId });
  if (!user) {
    return console.log(`User for key ${userId} not found`);
  }

  const { longLiveToken, accessToken } = getToken(user, "facebook");

  const extendedComment = await loadComment(commentId, longLiveToken);

  if(!extendedComment) {
    return console.log("cannot load comment");
  }

  extendedComment.commentId = commentId;
  await Comment.create(extendedComment);

  const auction = await Auction.findOne({ mediaId: extendedComment.media.id, status: AuctionStatus.active });
  if(!auction) {
    return console.log(`Auction for media ${extendedComment.media.id} is not started yet`);
  }

  if (+auction.price >= +bid || +bid < +auction.step) {
    console.log(`Bid from ${commentId} is to low: ${bid}`);
    extendedComment.replyed = true;
    await Comment.create(extendedComment);
    return await replyForComment({ 
      commentId: commentId,
      token: longLiveToken,
      message: `@${extendedComment.username}: Current bid is $${auction.price}. You need to bid at least $${+auction.price + +auction.step}`,
    });
  }

  if(auction.bin && +auction.bin <= +bid) {
    console.log(`Bid from ${commentId} is equal or more than BIN, auction over`);
    const winner: Bid = {
      ammount: bid,
      username: extendedComment.username,
      sended: time,
      commentId: extendedComment.id,
      renegade: false,
    };
    auction.bids.push(winner);
    auction.price = bid;
    auction.status = AuctionStatus.finished;
    auction.winner = winner;
    await auction.save();

    await replyForComment({ 
      commentId: commentId,
      token: longLiveToken,
      message: `@${winner.username} Congrats! You got it! I'll DM you soon`,
    });

    extendedComment.replyed = true;
    await Comment.create(extendedComment);

    return await createCommentForMedia({
      mediaId: auction.mediaId,
      token: longLiveToken,
      message: `🏁The bidding is over. Sold for $${bid}!`
    });
  }

  const previousBid = auction.bids.length ? auction.bids[auction.bids.length -1] : null;
  auction.bids.push({
    ammount: +bid,
    username: extendedComment.username,
    sended: time,
    commentId: extendedComment.id,
    renegade: false,
  });
  auction.price = bid;

  await auction.save();
  if (previousBid) {
    await replyForComment({
      commentId: previousBid.commentId,
      token: longLiveToken,
      message: `@${previousBid.username} bid increased to $${bid}!`,
    });
  }

  extendedComment.replyed = true;
  await Comment.create(extendedComment);
};

interface MentionHook {
  time?: string;
  mediaId?: string;
  userId?: string;
}
export const handleMentionsHook = async ({ time, userId, mediaId }: MentionHook) => {
  // if (userId === "0") {
  //   userId = bidInBioId;
  //   mediaId = mentions.caption.value.media_id;
  // }
  console.log('handleMentionsHook', userId, mediaId)
  const existedAuction = await Auction.findOne({ mediaId });
  if (existedAuction) {
    return console.log(`Auction for media ${mediaId} already exist!`);
  }

  const user = await User.findOne({ "businessAccounts.facebook.id": userId });
  if (!user) {
    return console.log(`User for key ${userId} not found`);
  }


  const { longLiveToken } = getToken(user, "facebook");
  const extendedMedia = await loadMediaById({ mediaId, token: longLiveToken });
  if (!extendedMedia) {
    return console.log("Cannot load media");
  }

  const auctionAtributes = getAuctionAttributes(extendedMedia.caption);
  if(!auctionAtributes) {
    return console.log("No auction attributes found in message");
  }


  const newAuction = await Auction.create({
    userId,
    mediaId: extendedMedia.id,
    startingPrice: auctionAtributes.startPrice,
    price: auctionAtributes.startPrice,
    bin: auctionAtributes.bin,
    step: auctionAtributes.step,
    status: AuctionStatus.active,
    start: new Date(),
    end: new Date( Date.now() + twenyFourHours ),
    media: {
      media_url: extendedMedia.media_url,
      caption: extendedMedia.caption
    },
  });

  await replyForMention({
    userId,
    media_id: extendedMedia.id,
    token: longLiveToken,
    message: `🏁 Bidding started! 
    Starting at: $${auctionAtributes.startPrice}
    Buy it now: $${auctionAtributes.bin}
    Minimal raise: $${auctionAtributes.step}`,
  });
};

export const handleStoryInsightsHook = async (data: StoryInsightsHook) => {
  console.log({data});
};

// private 

function getBidFromComment(comment: string) {
  return comment.match(/\d+/)[0];
}

function getAuctionAttributes(comment: string) {
  const result = /( ([0-9]+)(?=[^\/]*)\/([0-9]+)(?=[^\/]*)\/([0-9]+)(?=[^\/]*)| ([0-9]+)(?=[^\/]*)\/([0-9]+)(?=[^\/]*))/.test(comment);

  if(result) {
    const [startPrice, bin, step= 1] = comment.split(" ")[1].split("/");
    return { startPrice, bin, step };
  }
  return false;
}

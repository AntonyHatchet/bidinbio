import {
  createCommentForMedia,
  loadComment,
  loadMediaById,
  replyForMention,
  replyForComment,
  loadMentionedMedia 
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
interface Hook {
  entry: [
    {
      changes: [
        {
          field: string;
          value: MentionHook;
        }
      ];
      time: number;
      id: string;
    }
  ];
  object: string;
}
interface MentionHook {
  id?: string;
  text?: string;
  media_id?: string;
  comment_id?: string;
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
export const handleCommentsHook = async (data: Hook) => {
  let { time, id: hookUserId } = data.entry[0]; // eslint-disable-line
  let incomeMessageId = data.entry[0].changes[0].value.id;

  if (hookUserId === "0"){
    const randNumber = Math.floor(Math.random() * (auctionMessages.length - 1));

    hookUserId = fakeClientId;
    incomeMessageId = "17855557361098584";

    console.log({randNumber, incomeMessageId});
  }

  const comment = await Comment.findOne({ commentid: incomeMessageId });
  if(comment && comment.commentid){
    return console.log(`Comment ${incomeMessageId} already exist, do nothing`);
  }
  
  const user = await User.findOne({ "bussinessAccounts.facebook": hookUserId });
  if (!user) {
    return console.log(`User for key ${hookUserId} not found`);
  }

  const { longLiveToken, accessToken } = getToken(user, "facebook");

  const extendedComment = await loadComment(incomeMessageId, longLiveToken);

  if(!extendedComment) {
    return console.log("cannot load comment");
  }

  extendedComment.commentid = incomeMessageId;
  await Comment.create(extendedComment);

  const auction = await Auction.findOne({ mediaId: extendedComment.media.id, status: AuctionStatus.active });
  if(!auction) {
    return console.log(`Auction for media ${extendedComment.media.id} is not started yet`);
  }

  const bid = getBidFromComment(extendedComment.text);

  if(!bid) {
    return console.log(`Comment ${incomeMessageId} is not a bid, ignore it`);
  }

  if (+auction.price >= +bid || +bid < +auction.step) {
    console.log(`Bid from ${incomeMessageId} is to low: ${bid}`);
    extendedComment.replyed = true;
    await Comment.create(extendedComment);
    return await replyForComment({ 
      commentId: incomeMessageId,
      token: longLiveToken,
      message: `@${extendedComment.username}: Current bid is $${auction.price}. You need to bid at least $${+auction.price + +auction.step}`,
    });
  }

  if(auction.bin && +auction.bin <= +bid) {
    console.log(`Bid from ${incomeMessageId} is equal or more than BIN, auction over`);
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
      commentId: incomeMessageId,
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
export const handleMentionsHook = async (data: Hook) => {
  let { time, id: hookUserId } = data.entry[0]; // eslint-disable-line
  let { media_id } = data.entry[0].changes[0].value;
  
  if (hookUserId === "0") {
    hookUserId = bidInBioId;
    media_id = mentions.caption.value.media_id;
  }

  const user = await User.findOne({ "bussinessAccounts.facebook": hookUserId });
  if (!user) {
    return console.log(`User for key ${hookUserId} not found`);
  }

  const { longLiveToken } = getToken(user, "facebook");
  const extendedMedia = await loadMediaById({ mediaId: media_id, token: longLiveToken });
  if (!extendedMedia) {
    return console.log("Cannot load media");
  }

  const auctionAtributes = getAuctionAttributes(extendedMedia.caption);
  if(!auctionAtributes) {
    return console.log("No auction attributes found in message");
  }

  const existedAuction = await Auction.findOne({ mediaId: extendedMedia.id });
  if (existedAuction) {
    return console.log(`Auction for media ${extendedMedia.id} already exist!`);
  }

  const newAuction = await Auction.create({
    userId: hookUserId,
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
    userId: hookUserId,
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

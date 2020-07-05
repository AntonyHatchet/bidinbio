import {
  createCommentForMedia,
  loadComment,
  loadMediaById,
  replyForMention,
  replyForComment,
  loadMentionedMedia 
} from "./instagram.service";
import { User, Comment, Auction, AuctionStatus } from '../models';
import { 
  media, 
  auctionMessages, 
  mentions,
  fakeClientId,
  bidInBioId,
} from '../util/fixture';
import getToken from '../util/getToken';

interface Hook {
  entry: [
    {
      changes: [
        {
          field: string;
          value: CommentHook | MentionsHook;
        }
      ];
      time: number;
      id: string;
    }
  ];
  object: string;
}
interface CommentHook {
  id: string;
  text: string;
}

interface MentionsHook {
  media_id: string;
  comment_id: string;
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
  let { time, id: hookUserId } = data.entry[0];
  let incomeMessageId = data.entry[0].changes[0].value.id;

  if (hookUserId === '0'){
    const randNumber = Math.floor(Math.random() * (auctionMessages.length - 1));

    hookUserId = fakeClientId;
    incomeMessageId = auctionMessages[randNumber].id;

    console.log({randNumber, incomeMessageId});
  }

  const comment = Comment.findOne({ commentid: incomeMessageId });
  if(comment.id){
    return console.log(`Comment ${incomeMessageId} already exist, do nothing`);
  }

  const user = await User.findOne({ 'bussinessAccounts.facebook': hookUserId });
  if (!user) {
    return console.log(`User for key ${hookUserId} not found`)
  }

  const { longLiveToken, accessToken } = getToken(user, 'facebook');

  const extendedComment = await loadComment(incomeMessageId, longLiveToken);
  console.log({ mediaId: extendedComment.media.id, status: AuctionStatus.ongoing })
  const auction = await Auction.findOne({ mediaId: extendedComment.media.id, status: AuctionStatus.ongoing });
  console.log({auction})
  if(!auction) {
    return console.log(`Auction for media ${extendedComment.media.id} is not started yet`)
  }

  const bid = getBidFromComment(extendedComment.text);

  if(!bid) {
    return console.log(`Comment ${incomeMessageId} is not a bid, ignore it`)
  }

  if (+auction.step >= +bid || +bid < +auction.step) {
    console.log(`Bid from ${incomeMessageId} is to low`)
    return await replyForComment({ 
      commentId: incomeMessageId,
      token: longLiveToken,
      message: `Hi @${extendedComment.username}, current bid is $${auction.price} and minimal step is $${auction.step}!`,
    });
  }

  if(auction.bin && +auction.bin <= +bid) {
    console.log(`Bid from ${incomeMessageId} is equal or more than BIN, auction over`)
    const winner = {
      ammount: bid,
      userName: extendedComment.username,
      sended: time
    };
    auction.bids.push(winner)
    auction.price = bid;
    auction.status = AuctionStatus.finished;
    auction.winner = winner;
    await auction.save();

    await replyForComment({ 
      commentId: incomeMessageId,
      token: longLiveToken,
      message: `Wow, congrats @${extendedComment.username}! He made a BIN!`,
    });

    return await createCommentForMedia({
      mediaId: auction.mediaId,
      token: longLiveToken, 
      message: `Auction finished!
      winner: @${extendedComment.username}!`
    })
  }

  auction.bids.push({
    ammount: +bid,
    userName: extendedComment.username,
    sended: time
  })
  auction.price = +bid;

  await auction.save();
  await replyForComment({ 
    commentId: incomeMessageId,
    token: longLiveToken,
    message: `Got it, @${extendedComment.username}! next bid: $${+auction.step + +bid}!`,
  });

  extendedComment.replyed = true;
  await Comment.create(extendedComment);
}
export const handleMentionsHook = async (data: MentionsHook) => {
  let { time, id: hookUserId } = data.entry[0];
  let { media_id } = data.entry[0].changes[0].value;
  
  if (hookUserId === '0'){
    hookUserId = bidInBioId;
    media_id = mentions.caption.value.media_id;
  }

  const user = await User.findOne({ 'bussinessAccounts.facebook': hookUserId });
  if (!user) {
    return console.log(`User for key ${hookUserId} not found`)
  }

  const { longLiveToken } = getToken(user, 'facebook');
  const extendedMedia = await loadMediaById({ mediaId: media_id, token: longLiveToken });
  if (!extendedMedia) {
    return console.log('Cannot load media');
  }

  const auctionAtributes = getAuctionAttributes(extendedMedia.caption);
  if(!auctionAtributes) {
    return console.log(`No auction attributes found in message`);
  }

  const existedAuction = await Auction.findOne({ mediaId: extendedMedia.id });
  if (existedAuction) {
    return console.log(`Auction for media ${extendedMedia.id} already exist!`)
  }

  const newAuction = await Auction.create({
    userId: hookUserId,
    mediaId: extendedMedia.id,
    price: auctionAtributes.startPrice,
    bin: auctionAtributes.bin,
    step: auctionAtributes.step,
    status: AuctionStatus.ongoing,
  })

  await replyForMention({
    userId: hookUserId,
    media_id: extendedMedia.id,
    token: longLiveToken,
    message: `Hey! Auction started: 
    base price: ${auctionAtributes.startPrice}
    bin: ${auctionAtributes.bin? auctionAtributes.bin: 'No bin for that lot!'}
    step: ${auctionAtributes.step}`,
  });
}

export const handleStoryInsightsHook = async (data: StoryInsightsHook) => {
  console.log({data})
}

// private 

function getBidFromComment(comment: string) {
  return comment.match(/\d+/)[0];
}

function getAuctionAttributes(comment: string) {
  const result = /( ([0-9]+)(?=[^\/]*)\/([0-9]+)(?=[^\/]*)\/([0-9]+)(?=[^\/]*)| ([0-9]+)(?=[^\/]*)\/([0-9]+)(?=[^\/]*))/.test(comment)

  if(result) {
    const [startPrice, bin, step= 1] = comment.split(' ')[1].split('/');
    return { startPrice, bin, step };
  }
  return false;
}

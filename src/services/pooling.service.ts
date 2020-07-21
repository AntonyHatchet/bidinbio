import axios from "axios";
import { Media } from "../models/Media";
import { User, Auction } from "../models";
import getToken from "../util/getToken";
import { getMediaIds, loadMentionedMedia, loadComments } from "./instagram.service";
import { handleMentionsHook, handleCommentsHook } from "./hooks.service";
import { UserDocument } from "../models/User";
import { IG_ACCOUNT_ID } from "../util/secrets";
import { CommentDocument } from "../models/Comment";

export async function pollingMentionsAndComments() {
  const users = await User.find({ "businessAccounts.facebook.subscribed": true });

  for (const user of users) {
    const { longLiveToken } = getToken(user, "facebook");
    for (const igUser of user.businessAccounts.facebook) {
      await updateStateForUser(igUser.id, longLiveToken);
    }
  }
}

// private

async function updateStateForUser(igAccountId: string, longLiveToken: string) {
  console.log(`Start updateStateForUser ${igAccountId}`);
  const mediasIds = await getMediaIds({ igAccountId, token: longLiveToken });
  if (igAccountId === IG_ACCOUNT_ID) {
    console.log("BidInBio account");
    return;
  }
  console.log("mediasIds", mediasIds.length);
  for (const media of mediasIds) {
    await handleMentionsHook({ time: (new Date()).toDateString(), userId: igAccountId, mediaId: media.id });
  }
  const auctions = await Auction.find({ status: "active" });
  for (const auction of auctions) {
    const comments = await loadComments(auction.mediaId, longLiveToken);
    const unansweredMessages = comments.filter((comment: CommentDocument) => auction.bids.every(bid => bid.commentId !== comment.id));

    for (const message of unansweredMessages) {
      await handleCommentsHook({
        time: message.timestamp,
        userId: igAccountId,
        text: message.text,
        commentId: message.id
      });
    }
  }
}

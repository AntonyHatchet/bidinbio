import async from "async";
import crypto from "crypto";
import nodemailer from "nodemailer";
import passport from "passport";
import { User, UserDocument, AuthToken } from "../models/User";
import { Auction, AuctionDocument } from "../models/Auction";
import { Request, Response, NextFunction } from "express";
import { WriteError } from "mongodb";
import { check, sanitize, validationResult } from "express-validator";
import { loadIGUser, loadAllMedia, createCommentForMedia } from "../services/instagram.service";
import {
  getPageToken,
  subscribeToPageWebhooks,
} from "../services/facebook.service";

import "../config/passport";

export const getInstagramPage = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as UserDocument;
  const token = user.tokens.find((token: AuthToken) => token.kind === "facebook");
  const igAccountId = req.params.id;
  const account = await loadIGUser({ igAccountId, token: token.longLiveToken });
  const auctions = await Auction.find({ userId: igAccountId });

  console.log(`Get subscription for user ${user._id}`);

  for (const businessAccount of user.businessAccounts.facebook) {
    if (!businessAccount.subscribed) {
      console.log("!subscribed")
      const pageToken = await getPageToken(businessAccount.pageId, token.longLiveToken);
      await subscribeToPageWebhooks(businessAccount.pageId, pageToken);
      const newBussinesAccountsArray = user.businessAccounts.facebook.map(acc => {
        if(acc.id === businessAccount.id) {
          acc.subscribed = true;
        }
        return acc;
      })
      await User.updateOne({ _id: user._id }, { 'businessAccounts.facebook': newBussinesAccountsArray})
    }
  }

  res.render("instagram", {
      title: "Instagram",
      auctions,
      account
  });
};

export const createInstagramComment = async (req: Request, res: Response) => {
  const user = req.user as UserDocument;
  const { longLiveToken: token } = user.tokens.find((token: AuthToken) => token.kind === "facebook");
  const mediaId = req.params.mediaId;

  const result = await createCommentForMedia({ mediaId, token, message: "Auction will start soon" });
  res.send(result);
};

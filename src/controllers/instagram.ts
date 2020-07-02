import async from "async";
import crypto from "crypto";
import nodemailer from "nodemailer";
import passport from "passport";
import { User, UserDocument, AuthToken } from "../models/User";
import { Auction } from "../models/Auction";
import { Request, Response, NextFunction } from "express";
import { IVerifyOptions } from "passport-local";
import { WriteError } from "mongodb";
import { check, sanitize, validationResult } from "express-validator";
import { loadIGUser, loadAllMedia, createCommentForMedia } from "../services/instagram.service";

import "../config/passport";

export const getInstagramMedia = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as UserDocument;
  const token = user.tokens.find((token: AuthToken) => token.kind === "facebook");
  const igAccountId = req.params.id;
  const account = await loadIGUser({ igAccountId, token: token.accessToken })
  const medias = await loadAllMedia({ igAccountId, token: token.accessToken });
  const auctions = [];

  for(const media of medias) {
    const auction = await Auction.findOne({ mediaId: media.id });
    if(auction) {
      auctions.push(auction);
    }
  }
  
  res.render("instagram", {
      title: "Instagram",
      medias: medias.map(media => {
        for(const auction of auctions) {
          if(media.id === auction.mediaId){
            media.auctionId = auction._id
          }
        }
        return media;
      }),
      account
  });
};

export const createInstagramComment = async (req: Request, res: Response) => {
  const user = req.user as UserDocument;
  const { accessToken: token } = user.tokens.find((token: AuthToken) => token.kind === "facebook");
  const mediaId = req.params.mediaId;

  const result = await createCommentForMedia({ mediaId, token, message: 'Auction will start soon' })
  res.send(result);
};

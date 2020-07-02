"use strict";

import axios from "axios";
import moment from 'moment';
import { Response, Request, NextFunction } from "express";
import { AuthToken, UserDocument } from "../models/User";
import { Auction } from "../models/Auction";
import { getBussinessAccount, getFacebookUser } from "../services/facebook.service";
import { createCommentForMedia, loadIGUser, loadAllMedia, loadMediaById } from "../services/instagram.service";

axios.defaults.baseURL = "https://graph.facebook.com/v7.0";

export const getAuction = async (req: Request, res: Response) => {
  const user = req.user as UserDocument;
  const { accessToken: token } = user.tokens.find((token: AuthToken) => token.kind === "facebook");
  const mediaId = req.params.mediaId;
  const auction = await Auction.findOne({ mediaId });

  console.log(auction)
  return res.render("auction/index", {
    title: "Auction",
    auction
  });
}

export const getNewAuction = async (req: Request, res: Response) => {
  const user = req.user as UserDocument;
  const { accessToken: token } = user.tokens.find((token: AuthToken) => token.kind === "facebook");
  const mediaId = req.params.mediaId;
  const media = await loadMediaById({ mediaId, token });

  return res.render("auction/new", {
    title: "New Auction",
    media
  });
}

export const createNewAuction = async (req: Request, res: Response) => {
  const user = req.user as UserDocument;
  const { accessToken: token } = user.tokens.find((token: AuthToken) => token.kind === "facebook");
  const mediaId = req.params.mediaId;
  const { price, step, start, end, prolongation } = req.body;
  const media = await loadMediaById({ mediaId, token });
  const auction = {
    mediaId,
    userId: user.id,
    price,
    step,
    start: new Date(start),
    end: new Date(end),
    prolongation,
    media,
  };
  const message = createAuctionStartMessage({
    price,
    step,
    start: new Date(start),
    end: new Date(end),
    prolongation,
  })
  await Auction.updateOne({ mediaId }, auction, { upsert: true });
  await createCommentForMedia({ mediaId, token, message });
  res.redirect(`../${mediaId}`);
}


export const deleteAuction = async (req: Request, res: Response) => {
  const user = req.user as UserDocument;
  const { accessToken: token } = user.tokens.find((token: AuthToken) => token.kind === "facebook");
  const mediaId = req.params.mediaId;
  await Auction.deleteOne({ mediaId });

  return res.redirect("../../../");
}


interface StartAuction {
  price: number;
  step: number;
  start:Date;
  end:Date;
  prolongation: number;
}

function createAuctionStartMessage({
  price,
  step,
  start,
  end,
  prolongation,
}: StartAuction) {
  return `
    Auction will start on ${moment(start).format('LLLL')}! 
    Start price: ${price}$ and step is ${step}$ 
    Auction will end on ${moment(end).format('LLLL')}!
  `
}
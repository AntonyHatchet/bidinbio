"use strict";

import { Response, Request } from "express";
import Stripe from "stripe";
import { UserDocument } from "../models/User";
import {
  STRIPE_API_KEY,
  STRIPE_WEBHOOK_SECRET,
  STRIPE_PUBLISHABLE_KEY,
  BASIC_PRICE_ID,
  MID_PRICE_ID,
  PRO_PRICE_ID
} from "../util/secrets";
import { confirmPayment, getProductByPriceId } from "../services/payment.service";
import { setupAccount } from "./api";

const stripe = new Stripe(STRIPE_API_KEY, {
  apiVersion: "2020-08-27"
});

export const getPaymentPage = async (req: Request, res: Response) => {
  res.render("payment", {
    title: "Payment page",
  }); 
};
export const stripeHook = async (req: Request & { rawBody: string}, res: Response ) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log(err);
    console.log("⚠️  Webhook signature verification failed.");
    console.log(
      "⚠️  Check the env file and enter the correct webhook secret."
    );
    return res.sendStatus(400);
  }

  const dataObject = event.data.object as any;
  console.log(JSON.stringify(dataObject));
  await confirmPayment(dataObject.customer, Number(dataObject.lines.data[0].price.metadata.auctions));
  res.sendStatus(200);
};

export const createCheckoutSession = async (req: Request, res: Response) => {
  const domainURL = req.headers.referer;
  const { priceId } = req.body;
  const user = req.user as UserDocument;

  if(!user.stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
    });
    user.stripeCustomerId = customer.id;
    await user.save();
  }

  const session = await stripe.checkout.sessions.create({
    customer: user.stripeCustomerId,
    mode: "subscription",
    payment_method_types: ["card"],
    billing_address_collection: "auto",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    // ?session_id={CHECKOUT_SESSION_ID} means the redirect will have the session ID set as a query param
    success_url: `${domainURL}/success`,
    cancel_url: `${domainURL}/failed`,
  });

  res.send({
    sessionId: session.id,
  });
};

export const setupPayment = async (req: Request, res: Response) => {
  res.send({
    publishableKey: STRIPE_PUBLISHABLE_KEY,
    basicPrice: BASIC_PRICE_ID,
    midPrice: MID_PRICE_ID,
    proPrice: PRO_PRICE_ID,
  });
};

export const paymentSuccess = async (req: Request, res: Response) => {
  return setupAccount(req, res, "success");
};

export const paymentFailed = async (req: Request, res: Response) => {
  return setupAccount(req, res, "failed");
};


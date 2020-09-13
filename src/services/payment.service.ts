import { User } from "../models";
import { STRIPE_API_KEY, PRO_PRICE_ID, MID_PRICE_ID, BASIC_PRICE_ID } from "../util/secrets";

const products = [
  {
    name: "Basic",
    priceId: BASIC_PRICE_ID,
    auctions: 10,
  },
  {
    name: "Mid",
    priceId: MID_PRICE_ID,
    auctions: 25,
  },
  {
    name: "Pro",
    priceId: PRO_PRICE_ID,
    auctions: 50,
  },
];

export const confirmPayment = async (stripeCustomerId: string, auctions: number) => {
  const user = await User.findOne({ stripeCustomerId });
  if(!user) {
    throw Error("[payment] User not found! Payment could not be attended");
  }
  user.availableAuctions = user.availableAuctions + auctions;
  await user.save();
};

export const getProductByPriceId = (priceId: string) => {
  return products.find(product => product.priceId === priceId);
};
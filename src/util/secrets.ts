import logger from "./logger";
import dotenv from "dotenv";
import fs from "fs";

if (fs.existsSync(".env")) {
    logger.debug("Using .env file to supply config environment variables");
    dotenv.config({ path: ".env" });
} else {
    logger.debug("Using .env.example file to supply config environment variables");
    dotenv.config({ path: ".env.example" });  // you can delete this after you create your own .env file!
}
export const ENVIRONMENT = process.env.NODE_ENV;
export const prod = ENVIRONMENT === "production"; // Anything else is treated as 'dev'

export const SESSION_SECRET = process.env["SESSION_SECRET"];
export const MONGODB_URI = prod ? process.env["MONGODB_URI"] : process.env["MONGODB_URI_LOCAL"];
export const FACEBOOK_ID = prod ? process.env["FACEBOOK_ID"] : process.env["FACEBOOK_ID_LOCAL"];
export const FACEBOOK_SECRET = prod ? process.env["FACEBOOK_SECRET"] : process.env["FACEBOOK_SECRET_LOCAL"];
export const IG_ACCOUNT_ID = process.env["IG_ACCOUNT_ID"];
export const STRIPE_API_KEY = process.env["STRIPE_API_KEY"];
export const STRIPE_WEBHOOK_SECRET = process.env["STRIPE_WEBHOOK_SECRET"];
export const STRIPE_PUBLISHABLE_KEY = process.env["STRIPE_PUBLISHABLE_KEY"];
export const BASIC_PRICE_ID = process.env["BASIC_PRICE_ID"];
export const MID_PRICE_ID = process.env["MID_PRICE_ID"];
export const PRO_PRICE_ID = process.env["PRO_PRICE_ID"];

if (!SESSION_SECRET) {
    logger.error("No client secret. Set SESSION_SECRET environment variable.");
    process.exit(1);
}

if (!MONGODB_URI) {
    if (prod) {
        logger.error("No mongo connection string. Set MONGODB_URI environment variable.");
    } else {
        logger.error("No mongo connection string. Set MONGODB_URI_LOCAL environment variable.");
    }
    process.exit(1);
}

import express from "express";
import compression from "compression";  // compresses requests
import session from "express-session";
import bodyParser from "body-parser";
import lusca from "lusca";
import mongo from "connect-mongo";
import flash from "express-flash";
import path from "path";
import mongoose from "mongoose";
import passport from "passport";
import bluebird from "bluebird";
import { MONGODB_URI, SESSION_SECRET } from "./util/secrets";

import { closeAllEndedAuctions } from "./services/auction.service";
import cron from "node-cron";

const MongoStore = mongo(session);

// Controllers (route handlers)
import * as hooksController from "./controllers/hooks";
import * as userController from "./controllers/user";
import * as apiController from "./controllers/api";
import * as auctionController from "./controllers/auction";
import * as instagramController from "./controllers/instagram";
import { pollingMentionsAndComments } from "./services/pooling.service";


// API keys and Passport configuration
import * as passportConfig from "./config/passport";
import { IncomingMessage } from "http";

// Create Express server
const app = express();

// Connect to MongoDB
const mongoUrl = MONGODB_URI;
mongoose.Promise = bluebird;

mongoose.connect(mongoUrl, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true } ).then(
    () => { /** ready to use. The `mongoose.connect()` promise resolves to undefined. */ },
).catch(err => {
    console.log("MongoDB connection error. Please make sure MongoDB is running. " + err);
    // process.exit();
});

// Express configuration
app.set("port", process.env.PORT || 3000);
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "pug");
app.use(compression());
app.use(bodyParser.json({
    verify: (req: IncomingMessage & { rawBody: any }, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: SESSION_SECRET,
    store: new MongoStore({
        url: mongoUrl,
        autoReconnect: true
    })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(lusca.xframe("SAMEORIGIN"));
app.use(lusca.xssProtection(true));
app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});
app.use((req, res, next) => {
    console.log({method: req.method, path:req.path});
    // After successful login, redirect back to the intended page
    if (!req.user &&
    req.path !== "/login" &&
    req.path !== "/signup" &&
    !req.path.match(/^\/auth/) &&
    !req.path.match(/\./)) {
        req.session.returnTo = req.path;
    } else if (req.user &&
    req.path == "/account") {
        req.session.returnTo = req.path;
    }
    next();
});

app.use(
    express.static(path.join(__dirname, "public"), { maxAge: 31557600000 })
);

/**
 * Primary app routes.
 */
app.get("/", userController.getLogin);
app.get("/login", userController.getLogin);
app.get("/logout", userController.logout);
app.get("/account", passportConfig.isAuthenticated, userController.getAccount);
app.post("/account/profile", passportConfig.isAuthenticated, userController.postUpdateProfile);
app.post("/account/delete", passportConfig.isAuthenticated, userController.postDeleteAccount);
app.get("/account/unlink/:provider", passportConfig.isAuthenticated, userController.getOauthUnlink);

app.get("/auction/:auctionId", passportConfig.isAuthenticated, auctionController.getAuction);
app.delete("/auction/:auctionId", passportConfig.isAuthenticated, auctionController.deleteAuction);
app.get("/auction/new/:mediaId", passportConfig.isAuthenticated, auctionController.getNewAuction);
app.post("/auction/new/:mediaId", passportConfig.isAuthenticated, auctionController.createNewAuction);

app.post("/auction/backed/:mediaId", passportConfig.isAuthenticated, auctionController.markWinnerAsBackedOut);

app.get("/instagram/:id", passportConfig.isAuthenticated, instagramController.getInstagramPage);
app.post("/instagram/:mediaId", passportConfig.isAuthenticated, instagramController.createInstagramComment);

/**
 * API examples routes.
 */
app.get("/api", apiController.getApi);
app.get("/api/facebook", passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.setupAccount);
app.post("/api/v1/hooks/instagram", hooksController.authorizeHook, hooksController.hookRouter);
app.get("/api/v1/hooks/instagram", hooksController.authorizeHook, (req, res) => {
    res.send(req.query["hub.challenge"]);
});

const facebookPermision = [
    "pages_manage_metadata",
    "pages_read_engagement",
    "instagram_basic",
    "instagram_manage_comments",
    "pages_show_list",
];

/**
 * OAuth authentication routes. (Sign in)
 */
app.get("/auth/facebook", passport.authenticate("facebook", { scope: ["email", "public_profile", ...facebookPermision] }));
app.get("/auth/facebook/callback", passport.authenticate("facebook", { failureRedirect: "/login" }), (req, res) => {
    res.redirect(req.session.returnTo || "/");
});

cron.schedule("* * * * *", () => {
    console.log("running every minute to 1");
    console.log(new Date());
    closeAllEndedAuctions();
    // pollingMentionsAndComments();
});

export default app;

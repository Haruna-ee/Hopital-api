const functions = require("firebase-functions");
const firebaseAdmin = require("firebase-admin");

const firebaseClient = require("firebase");

const cookieParser = require("cookie-parser")();
const cors = require("cors");

const morgan = require("morgan");

var serviceAccount = require("../ehopital-api-permissions.json");
const baseUrl = "https://us-central1-ehopital-3114f.cloudfunctions.net/app/";

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: "https://ehopital-3114f.firebaseio.com",
  storageBucket: "gs://ehopital-3114f.appspot.com",
});

firebaseClient.initializeApp({
  apiKey: "AIzaSyD-y3XrdPEsbzAzi0pGjz1WXaQi__0X9fI",
  authDomain: "ehopital-3114f.firebaseapp.com",
  databaseURL: "https://ehopital-3114f.firebaseio.com",
  projectId: "ehopital-3114f",
  storageBucket: "ehopital-3114f.appspot.com",
  messagingSenderId: "1089884907559",
  appId: "1:1089884907559:web:9c72d9dd796326d6924602",
  measurementId: "G-GCBKMSTRL3"
});

const bucket = firebaseAdmin.storage().bucket();

const ejs = require("ejs");


const db = firebaseAdmin.firestore();
db.settings({ ignoreUndefinedProperties: true });

/*
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
const path = require("path");
const os = require("os");
const fs = require("fs");

const slugify = require("slugify");
var bodyParser = require("body-parser");

// Node.js doesn't have a built-in multipart/form-data parsing library.
// Instead, we can use the 'busboy' library from NPM to parse these requests.
const Busboy = require("busboy");

const isEmail = require("is-email");
//email

const nodemailer = require("nodemailer");
// Configure the email transport using the default SMTP transport and a GMail account.
// For Gmail, enable these:
// 1. https://www.google.com/settings/security/lesssecureapps
// 2. https://accounts.google.com/DisplayUnlockCaptcha
// For other types of transports such as Sendgrid see https://nodemailer.com/transports/
// TODO: Configure the `gmail.email` and `gmail.password` Google Cloud environment variables.
const gmailEmail = "harunamuazang1994@gmail.com";
const gmailPassword = "wsybbdromksacnzo";
const mailTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

// Your company name to include in the emails
// TODO: Change this to your app or company name to customize the email sent.
const APP_NAME = "EHopital";

module.exports = {
  functions,
  db,
  firebaseAdmin,
  firebaseClient,
  bucket,
  morgan,
  cors,
  cookieParser,
  nodemailer,
  gmailEmail,
  gmailPassword,
  mailTransport,
  APP_NAME,
  path,
  os,
  isEmail,
  fs,
  ejs,
  slugify,
  Busboy,
  bodyParser,
};

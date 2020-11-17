const express = require("express");
const { functions, cors, morgan, cookieParser } = require("./config");
const { ErrorHandler, handleError } = require("./helpers/error");
const app = express();

app.set("view engine", "ejs");
app.use(cors({ origin: true }));
app.use(cookieParser);

app.use(express.json());

app.use(morgan("dev"));

//api routes

/********************************************************
 * 1.ACESS
 *
 *
 * ******************************************************/
app.use(require("./auth/auth"));


/********************************************************
 * 2.USERS
 *
 *
 * ******************************************************/
app.use(require("./user/user"));
app.use(require("./user/generic"));
app.use(require("./user/favorite"));
app.use(require("./user/feedback"));
app.use(require("./user/request"));
app.use(require("./user/userdrug"));
app.use(require("./user/drug"));


/********************************************************
 * 3.Admin
 *
 *
 * ******************************************************/
app.use(require("./admin/encounter"));


/********************************************************
 * 4.NEWSLETTER
 *
 *
 * ******************************************************/
app.use(require("./newsletter/subscribe"));



/********************************************************
 * 4.MEDICAL PRACTITIONERS
 *
 *
 * ******************************************************/
app.use(require("./medical/medical"));





app.use((req, res, next) => {
  throw new ErrorHandler(
    404,
    req.url,
    "Endpoint not found or bad request method"
  );
});

//error handler

app.use((err, req, res, next) => {
  handleError(err, res);
});

exports.app = functions.https.onRequest(app);

//sudo lsof -i :port#
//sudo kill -9 PID

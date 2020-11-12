/* eslint-disable promise/always-return */
/* eslint-disable callback-return */
const {
  db,
  firebaseAdmin,
  firebaseClient,
  fs,
  ejs,
  path,
  isEmail,
} = require("../config");
const { ErrorHandler } = require("../helpers/error");
const { sendFreelancerWelcome, sendUserWelcome } = require("../mails/email");
const {
  validateFirebaseIdToken,
  admin,
  author,
  freelancer,
  formFilter,
} = require("../middleware/");
var router = require("express").Router();
var userMsg = "Swifter";

async function login(req, res, next) {
  try {
    let verify, data;
    if (!req.body.email || !req.body.password) {
      throw new ErrorHandler(
        401,
        "login",
        "Email and password cannot be empty"
      );
    }

    if (!isEmail(req.body.email)) {
      throw new ErrorHandler(401, "login", "email not valid");
    }

    const cred = await firebaseClient
      .auth()
      .signInWithEmailAndPassword(req.body.email, req.body.password);

    const idToken = await cred.user.getIdToken();

    //check if email is verified
    const user = await firebaseClient.auth().currentUser;

    if (user) {
      //User is signed in.
      verify = user.emailVerified;
      if (verify === false) {
        //send email verification
        user.sendEmailVerification().catch((error) => {
          // An error happened.
          next(error);
        });
        data = {
          message: "Check your email for verification link before logging in",
        };
      } else {
        data = { token: idToken };
      }
    }

    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
}

async function signup(req, res, next) {
  try {
    console.log("body>>>", req.body);
    if (!req.body.email || !req.body.password || !req.body.role) {
      throw new ErrorHandler(
        401,
        "signup",
        "Missing required fields: email or password or role"
      );
    }

    if (!isEmail(req.body.email)) {
      throw new ErrorHandler(401, "signup", "Email not valid");
    }

    if (
      req.body.role !== "doctor" &&
      req.body.role !== "nurse" &&
      req.body.role !== "patient"
    ) {
      throw new ErrorHandler(
        401,
        "signup",
        "Role must be doctor or nurse  or patient"
      );
    }

    await firebaseClient
      .auth()
      .createUserWithEmailAndPassword(req.body.email, req.body.password);

    const user = await firebaseClient.auth().currentUser;
    const idToken = await user.getIdToken();

    //check if email is verified
    if (user) {
      // User is signed in.
      db.collection("users")
        .doc("/" + user.uid + "/")
        .create({
          user: user.uid,
          newuser: true,
          role: req.body.role,
          email: req.body.email,
          country: null,
          image: null,
          username: null,
          firstname: null,
          lastname: null,
          about: null,
          active: true,
        });

      if (user.emailVerified === false) {
        //send email verification
        await user.sendEmailVerification();
      }

      const emailTemplate = await ejs.renderFile(
        path.join(__dirname, "../views/emailTemplate.ejs"),
        {
          user: userMsg,
          email: user.email,
          imageUrl: "https://i.imgur.com/C1L1czV.jpg",
          imageText: "You successfully registered ",
          stageOneText:
            "Thanks for registering on the platform. Enjoy our services",
        }
      );

      let authData = {
        emailTemplate: emailTemplate,
        email: user.email,
      };

      await sendUserWelcome(authData);
    }

    const data = {
      token: idToken,
      message:
        "Signup successful. Check your email for verification link and login",
    };

    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
}

async function reset(req, res, next) {
  try {
    var data;
    if (!req.body.email) {
      throw new ErrorHandler(401, "reset", "email cannot be empty");
    }

    if (!isEmail(req.body.email)) {
      throw new ErrorHandler(401, "reset", "email not valid");
    }

    const user = await firebaseAdmin.auth().getUserByEmail(req.body.email);

    if (user) {
      const auth = firebaseClient.auth();

      auth.sendPasswordResetEmail(req.body.email).catch((error) => {
        // An error happened.
        return next(error);
      });

      data = {
        message: "Check your email for reset link",
      };
    } else {
      data = {
        message: "Invalid user",
      };
    }

    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
}

async function logout(req, res, next) {
  try {
    let verify, data;
    if (!req.body.id) {
      throw new ErrorHandler(401, "logout", "id cannot be empty");
    }

    data = {
      message: "logour successfull",
    };

    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
}

router.post("/login", login);
router.post("/signup", signup);
router.post("/reset", reset);
router.post("/logout", logout);
module.exports = router;

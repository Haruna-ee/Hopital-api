/* eslint-disable promise/always-return */
/* eslint-disable callback-return */
const {
  bucket,
  db,
  firebaseAdmin,
  firebaseClient,
  fs,
  ejs,
  path,
  isEmail,
  slugify,
} = require("../config");
const { sendRequestComment, sendRequestStatus } = require("../mails/email");
const { ErrorHandler } = require("../helpers/error");
const { validateFirebaseIdToken, admin } = require("../middleware");
const new_line = "\n\xA0";
const { user } = require("firebase-functions/lib/providers/auth");
var router = require("express").Router();

async function setRequestStatus(req, res, next) {
  try {
    if (!req.params.id) {
      throw new ErrorHandler(401, "setRequestStatus", "Missing parameter id");
    }

    if (!req.body.status) {
      throw new ErrorHandler(
        401,
        "setRequestStatus",
        "Missing required fields:status"
      );
    }

    if (!req.body.requestcomment) {
      throw new ErrorHandler(
        401,
        "setRequestStatus",
        "Missing required fields:requestcomment"
      );
    }

    const id = req.params.id;

    const doc = db.collection("requests").doc(`${id}`);
    let request = await doc.get();

    if (!request.exists) {
      throw new ErrorHandler(
        401,
        "setRequestStatus",
        "Request with id does not exist"
      );
    }

    //vet info exists
    let response;
    var updateObj = {};

    //process obj
    updateObj.status = req.body.status === "approved" ? true : false;
    updateObj.requestcomment = req.body.requestcomment;

    if (Object.keys(updateObj).length > 0) {
      const doc = db.collection("requests").doc(`${id}`);
      await doc.update(updateObj);

      let req = await doc.get();
      response = req.data();

      //send email to user to confirm acceptance or rejection

      const approvedTemplate = await ejs.renderFile(
        path.join(__dirname, "../views/emailTemplate2.ejs"),
        {
          email: response.email,
          imageUrl: "https://imgur.com/67pJWs0.jpg",
          imageText: "Hurrayy, your request has been approved!!!!",
          stageOneText: ` 
            We will be pleased to have you. .${new_line}
            Details of the appointment are enclosed in the mail ${new_line}
            You have been approved ${new_line}
            !!!!!!!!!Congratulations!!!!!!! ${new_line}
            Join us in changing the world.One person at a time. ${new_line}
            ************************** ${new_line}
            Reply this mail if you have any questions.${new_line}`,
        }
      );

      const disapprovedTemplate = await ejs.renderFile(
        path.join(__dirname, "../views/emailTemplate2.ejs"),
        {
          email: response.email,
          imageUrl: "https://imgur.com/41vPcIU.jpg",
          imageText: "You were not approved at this time!!!!",
          stageOneText: ` 
            We are sorry there are no spots to meet during this time.${new_line}
            You can always check in after a while ${new_line}
            Send us feedback and get services from any of our stores ${new_line}
            Be great. ${new_line}
            ************************** ${new_line}
            Reply this mail if you have any questions.${new_line}`,
        }
      );

      const emailData = {
        approvedTemplate: approvedTemplate,
        disapprovedTemplate: disapprovedTemplate,
        email: response.email,
        status: response.status,
      };

      await sendRequestStatus(emailData);
    } else {
      response = "No data passed:";
    }

    return res.status(200).send({
      message: "Freelancer " + req.body.status + " succesfully",
      data: response,
    });
  } catch (error) {
    return next(error);
  }
}

async function setRequestComment(req, res, next) {
  try {
    if (!req.params.id) {
      throw new ErrorHandler(401, "setRequestComment", "Missing parameter id");
    }

    if (!req.body.requestcomment) {
      throw new ErrorHandler(
        401,
        "setRequestStatus",
        "Missing required fields:requestcomment"
      );
    }

    const id = req.params.id;

    const doc = db.collection("requests").doc(`${id}`);
    let request = await doc.get();

    if (!request.exists) {
      throw new ErrorHandler(
        401,
        "setRequestStatus",
        "Request with id does not exist"
      );
    }

    //vet info exists
    let response;
    var updateObj = {};

    //process obj
    updateObj.requestcomment = req.body.requestcomment;

    if (Object.keys(updateObj).length > 0) {
      const doc = db.collection("requests").doc(`${id}`);
      await doc.update(updateObj);

      let req = await doc.get();
      response = req.data();

      //send email to user to confirm acceptance or rejection

      const template = await ejs.renderFile(
        path.join(__dirname, "../views/emailTemplate2.ejs"),
        {
          email: response.email,
          imageUrl: "https://imgur.com/67pJWs0.jpg",
          imageText: "New comment from your medical practitioner!!!",
          stageOneText: ` 
              ${req.body.requestcomment}..${new_line}
              Join us in changing the world.One person at a time. ${new_line}
              ************************** ${new_line}
              Reply this mail if you have any questions.${new_line}`,
        }
      );

      const emailData = {
        template: template,
        email: response.email,
      };

      await sendRequestComment(emailData);
    } else {
      response = "No data passed:";
    }

    return res.status(200).send({
      message: "Freelancer " + req.body.status + " succesfully",
      data: response,
    });
  } catch (error) {
    return next(error);
  }
}

router.put("/rstatus/:id", [validateFirebaseIdToken], setRequestStatus);
router.put("/rcomment/:id", [validateFirebaseIdToken], setRequestComment);
module.exports = router;

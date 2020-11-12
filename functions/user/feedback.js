/* eslint-disable callback-return */
const { ErrorHandler } = require("../helpers/error");
const { isEmail } = require("../config");
const { formFilter } = require("../middleware/");
const { sendUserFeedback } = require("../mails/email");
var router = require("express").Router();

async function feedback(req, res, next) {
  try {
    if (!req.body.email) {
      throw new ErrorHandler(401, "feedback", "email cannot be empty");
    }

    if (!isEmail(req.body.email)) {
      throw new ErrorHandler(401, "feedback", "email not valid");
    }

    if (!req.body.message || req.body.message.length < 30) {
      throw new ErrorHandler(
        401,
        "feedback",
        "Message is required and must be greater than 30 characters"
      );
    }

    // eslint-disable-next-line eqeqeq
    if (!req.body.rating || isNaN(req.body.rating)) {
      throw new ErrorHandler(401, "feedback", "Please select a number rating");
    }

    const data = {
      email: req.body.email,
      message: req.body.message,
      rating: req.body.rating,
    };

    await sendUserFeedback(data);

    const response = {
      message: "Successfully sent feedback to eHopital",
    };

    return res.status(200).json(response);
  } catch (error) {
    return next(error);
  }
}

router.post("/feedback", feedback);

module.exports = router;

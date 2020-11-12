/* eslint-disable callback-return */
const { ErrorHandler } = require("../helpers/error");
const {
  db,
  firebaseAdmin,
  firebaseClient,
  isEmail,
  ejs,
  path,
} = require("../config");
const {
  validateFirebaseIdToken,
  admin,
} = require("../middleware/");
const { sendSubscriberWelcome } = require("../mails/email");
const new_line = "\n\xA0";
var router = require("express").Router();

async function subscribe(req, res, next) {
  try {
    let data;
    if (!req.body.email) {
      throw new ErrorHandler(401, "email cannot be empty");
    }

    if (!isEmail(req.body.email)) {
      throw new ErrorHandler(401, "email not valid");
    }

    const email = req.body.email;

    const document = db.collection("subscribers").doc(email);
    let em = await document.get();

    if (em.exists) {
      data = {
        message: "You already subscribed to mailing list",
      };
    } else {
      let userMsg = "Swifter";

      const emailTemplate = await ejs.renderFile(
        path.join(__dirname, "../views/emailTemplate.ejs"),
        {
          user: userMsg,
          email: email,
          imageUrl: "https://i.imgur.com/apZIgO4.jpg",
          imageText: "You have successfully subscribed to AswiftConnect",
          stageOneText: ` 
          You will be kept in the loop about our latest news${new_line}
          Please kindly keep in touch with us if anything${new_line}
          We are always here for you ${new_line}
          >>>> For any inquiries, you can reply us here
          *********${new_line}`,
        }
      );

      const emailData = {
        emailTemplate: emailTemplate,
        email: email,
      };

      await sendSubscriberWelcome(emailData);

      await db
        .collection("subscribers")
        .doc("/" + email + "/")
        .create({
          email: email,
        });

      data = {
        message: "Successfully subscribed to AswiftConnect's mailing list",
      };
    }

    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
}

async function subscribers(req, res, next) {
  try {
    let query = db.collection("subscribers");
    let response = [];

    await query.get().then((querySnapshot) => {
      let docs = querySnapshot.docs; //result of the query

      for (let doc of docs) {
        const selectedItem = {
          id: doc.id,
          email: doc.data().email,
        };

        response.push(selectedItem);
      }

      return response; //each then should return a value
    });

    return res.status(200).send(response);
  } catch (error) {
    return next(error);
  }
}

async function unsubscribe(req, res, next) {
  try {
    const document = db.collection("subscribers").doc(req.params.id);
    await document.delete();

    return res
      .status(200)
      .send({ message: "Successfully unsubscribed from mailing list" });
  } catch (error) {
    return next(error);
  }
}

router.post("/subscribe",  subscribe);
router.get("/subscribers", [validateFirebaseIdToken], subscribers);
router.get("/unsubscribe/:id", unsubscribe);

module.exports = router;

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
const {
  sendFreelancerEncounterDate,
  sendFreelancerStatus,
} = require("../mails/email");
const { ErrorHandler } = require("../helpers/error");
const { validateFirebaseIdToken, admin } = require("../middleware");
const new_line = "\n\xA0";
const userMsg = "Swifter";
const { user } = require("firebase-functions/lib/providers/auth");
var router = require("express").Router();

async function unEncounters(req, res, next) {
  try {
    const document = db.collection("users");

    const query = document
      .where("Encounter", "==", null)
      .where("role", "==", "freelancer");

    let response = [];

    await query.get().then((querySnapshot) => {
      let docs = querySnapshot.docs; //result of the query

      for (let doc of docs) {
        const selectedItem = {
          id: doc.id,
          email: doc.data().email,
          role: doc.data().role,
          firstname: doc.data().firstname,
          lastname: doc.data().lastname,
          username: doc.data().username,
          active: doc.data().active,
          country: doc.data().country,
          phone: doc.data().phone,
          image: doc.data().image,
          step1: doc.data().step1,
          step2: doc.data().step2,
          step3: doc.data().step3,
          lang1: doc.data().lang1,
          Encounter: doc.data().Encounter,
          is_approved: doc.data().is_approved,
          onbstate: doc.data().onbstate,
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

async function encounters(req, res, next) {
  try {
    let query = db.collection("Encounters");
    let response = [];

    await query.get().then((querySnapshot) => {
      let docs = querySnapshot.docs; //result of the query

      for (let doc of docs) {
        const selectedItem = {
          id: doc.id,
          user: doc.data().user,
          date: doc.data().date,
          time: doc.data().time,
          Encounterurl: doc.data().Encounterurl,
          comment: doc.data().comment,
          status: doc.data().status,
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

async function createEncounter(req, res, next) {
  try {
    if (
      !req.body.user ||
      !req.body.date ||
      !req.body.time ||
      !req.body.Encounterurl
    ) {
      throw new ErrorHandler(
        401,
        "createEncounter",
        "Missing required fields:user or date or time or Encounterurl"
      );
    }

    const document = db.collection("users").doc(req.body.user);
    let sysUser = await document.get();

    if (!sysUser.exists) {
      throw new ErrorHandler(401, "createEncounter", "User id not found");
    }

    if (sysUser.data().role !== "freelancer") {
      throw new ErrorHandler(401, "createEncounter", "You can only Encounter a freelancer");
    }

    const userRecord = await firebaseAdmin.auth().getUser(req.body.user);

    //check if user id belongs to someone who registered as a freelancer

    const response = await db.collection("Encounters").add({
      user: req.body.user,
      date: req.body.date,
      time: req.body.time,
      Encounterurl: req.body.Encounterurl,
      comment: req.body.comment ? req.body.comment : null,
      status: "pending",
    });

    const data = {
      email: userRecord.email,
      user: req.body.user,
      date: req.body.date,
      time: req.body.time,
      Encounterurl: req.body.Encounterurl,
      comment: req.body.comment ? req.body.comment : "---",
    };

    const emailTemplate = await ejs.renderFile(
      path.join(__dirname, "../views/emailTemplate.ejs"),
      {
        user: userMsg,
        email: data.email,
        imageUrl: "https://i.imgur.com/UIQoALX.jpg",
        imageText: "Your Encounter date has been set",
        stageOneText: ` 
        Our team went through your cv and have set a Encounter meeting with you.${new_line}
        Date : ${data.date} ${new_line}
        Time : ${data.time} ${new_line}
        Url : ${data.Encounterurl} ${new_line}
        Comment: ${data.comment ? data.comment : "-"} ${new_line}
        ************************** ${new_line}
        Reply this mail if you have any questions.${new_line}`,
      }
    );

    const emailData = {
      emailTemplate: emailTemplate,
      email: data.email,
    };

    await sendFreelancerEncounterDate(emailData);

    return res
      .status(200)
      .json({ message: "Encounterting meeting set successfully", id: response.id });
  } catch (error) {
    return next(error);
  }
}

async function getEncounter(req, res, next) {
  try {
    if (!req.params.id) {
      throw new ErrorHandler(401, "getEncounter", "Missing parameter id");
    }

    const document = db.collection("Encounters").doc(req.params.id);
    let Encounter = await document.get();

    if (!Encounter.exists) {
      throw new ErrorHandler(401, "getEncounter", "Encounter id not found");
    }

    const response = {
      user: Encounter.data().user,
      date: Encounter.data().date,
      time: Encounter.data().time,
      Encounterurl: Encounter.data().Encounterurl,
      comment: Encounter.data().comment,
      status: Encounter.data().status,
    };

    return res.status(200).send(response);
  } catch (error) {
    return next(error);
  }
}

async function updateEncounter(req, res, next) {
  try {
    if (!req.params.id) {
      throw new ErrorHandler(401, "updatEncounter", "Missing parameter id");
    }

    var id = req.params.id;

    //check if user is the owner of skill to be updated
    const doc = db.collection("Encounters").doc(`${id}`);
    let vt = await doc.get();

    if (!vt.exists) {
      throw new ErrorHandler(
        401,
        "updatEncounter",
        "Encounter meeting with id does not exist"
      );
    }

    if (vt.data().status === "held") {
      throw new ErrorHandler(
        401,
        "updatEncounter",
        "Encounter meeting which has already held cannot be altered"
      );
    }

    //check for user

    const document = db.collection("users").doc(vt.data().user);
    let sysUser = await document.get();

    if (!sysUser.exists) {
      throw new ErrorHandler(401, "updatEncounter", "User id not found");
    }

    if (sysUser.data().role !== "freelancer") {
      throw new ErrorHandler(401, "updatEncounter", "You can only Encounter a freelancer");
    }

    //Encounter info exists

    let response;
    var updateObj = {};

    //process obj
    if (req.body.date) {
      updateObj.date = req.body.date;
    }

    if (req.body.time) {
      updateObj.time = req.body.time;
    }

    if (req.body.Encounterurl) {
      updateObj.Encounterurl = req.body.Encounterurl;
    }

    if (req.body.comment) {
      updateObj.comment = req.body.comment;
    }

    if (Object.keys(updateObj).length > 0) {
      await doc.update(updateObj);

      let Encounter = await doc.get();
      response = {
        user: Encounter.data().user,
        date: Encounter.data().date,
        time: Encounter.data().time,
        Encounterurl: Encounter.data().Encounterurl,
        comment: Encounter.data().comment,
      };

      const userRecord = await firebaseAdmin.auth().getUser(response.user);

      response.email = userRecord.email;

      const emailTemplate = await ejs.renderFile(
        path.join(__dirname, "../views/emailTemplate.ejs"),
        {
          user: userMsg,
          email: response.email,
          imageUrl: "https://i.imgur.com/UIQoALX.jpg",
          imageText: "You Encounter day has been updated",
          stageOneText: ` 
          Our team went through your cv and have set a Encounter meeting with you.${new_line}
          Date : ${response.date} ${new_line}
          Time : ${response.time} ${new_line}
          Url : ${response.Encounterurl} ${new_line}
          Comment: ${response.comment ? data.comment : "-"} ${new_line}
          ************************** ${new_line}
          Reply this mail if you have any questions.${new_line}`,
        }
      );

      const emailData = {
        emailTemplate: emailTemplate,
        email: response.email,
      };

      await sendFreelancerEncounterDate(emailData);

      //send email to user
    } else {
      response = "No data passed:";
    }

    return res
      .status(200)
      .send({ message: "Encounter meeting updated succesfully" });
  } catch (error) {
    return next(error);
  }
}

async function setEncounter(req, res, next) {
  try {
    if (!req.params.id) {
      throw new ErrorHandler(401, "setEncounter", "Missing parameter id");
    }

    if (!req.body.status) {
      throw new ErrorHandler(401, "setEncounter", "Missing required fields:status");
    }

    const id = req.params.id;

    //check if user is the owner of skill to be updated

    const doc = db.collection("Encounters").doc(`${id}`);
    let vt = await doc.get();

    if (!vt.exists) {
      throw new ErrorHandler(
        401,
        "setEncounter",
        "Encounter meeting with id does not exist"
      );
    }

    if (vt.data().status === "held") {
      throw new ErrorHandler(
        401,
        "setEncounter",
        "Encounter meeting which has already held cannot be altered"
      );
    }

    //Encounter info exists
    let response;
    var updateObj = {};

    //process obj
    updateObj.status = req.body.status;

    if (Object.keys(updateObj).length > 0) {
      const doc = db.collection("Encounters").doc(`${id}`);
      await doc.update(updateObj);

      let Encounter = await doc.get();
      response = {
        user: Encounter.data().user,
        date: Encounter.data().date,
        time: Encounter.data().time,
        Encounterurl: Encounter.data().Encounterurl,
        comment: Encounter.data().comment,
        status: Encounter.data().status,
      };
    } else {
      response = "No data passed:";
    }

    return res.status(200).send({
      message: "Encounter meeting " + req.body.status + " succesfully",
      data: response,
    });
  } catch (error) {
    return next(error);
  }
}

async function setFreelancerStatus(req, res, next) {
  try {
    if (!req.params.id) {
      throw new ErrorHandler(
        401,
        "setFreelancerStatus",
        "Missing parameter id"
      );
    }

    if (!req.body.status) {
      throw new ErrorHandler(
        401,
        "setFreelancerStatus",
        "Missing required fields:status"
      );
    }

    const id = req.params.id;

    const doc = db.collection("users").doc(`${id}`);
    let user = await doc.get();

    if (!user.exists) {
      throw new ErrorHandler(
        401,
        "setFreelancerStatus",
        "User with id does not exist"
      );
    }

    if (user.data().role !== "freelancer") {
      throw new ErrorHandler(
        401,
        "setFreelancerStatus",
        "Only freelancers can be approved"
      );
    }

    //might need to approve some freelancers without Encounterting

    //check if there is a Encounterting entry for this freelancer

    const document = db.collection("Encounters");

    const query = document.where("user", "==", id);

    await query.get().then((querySnapshot) => {
      if (querySnapshot.docs.length === 0) {
        throw new ErrorHandler(
          401,
          "setFreelancerStatus",
          "A Encounterting date has not been set for the freelancer"
        );
      }
    });

    //Encounter info exists
    let response;
    var updateObj = {};

    //process obj
    updateObj.is_approved = req.body.status === "approved" ? true : false;
    updateObj.Encounter = true;

    if (Object.keys(updateObj).length > 0) {
      const doc = db.collection("users").doc(`${id}`);
      await doc.update(updateObj);

      let user = await doc.get();
      response = user.data();

      //send email to user to confirm acceptance or rejection

      const approvedTemplate = await ejs.renderFile(
        path.join(__dirname, "../views/emailTemplate.ejs"),
        {
          user: userMsg,
          email: response.email,
          imageUrl: "https://i.imgur.com/WqENm6m.jpg",
          imageText: "Congratulations, you have been approved!!!!",
          stageOneText: ` 
          After our session with you, we are pleased to give you a spot at ASwiftConnect .${new_line}
          We are dedicated to producing quality products for our clients ${new_line}
          You have been approved ${new_line}
          !!!!!!!!!Congratulations!!!!!!! ${new_line}
          Join us in changing the world.One code at a time. ${new_line}
          ************************** ${new_line}
          Reply this mail if you have any questions.${new_line}`,
        }
      );

      const disapprovedTemplate = await ejs.renderFile(
        path.join(__dirname, "../views/emailTemplate.ejs"),
        {
          user: userMsg,
          email: response.email,
          imageUrl: "https://i.imgur.com/WqENm6m.jpg",
          imageText: "You were not approved at this time!!!!",
          stageOneText: ` 
          We are sorry there are no spots for you at ASwiftConnect during this time.${new_line}
          You can always check in after a while ${new_line}
          If we are in need of your services, we will keep in touch ${new_line}
          Be great. ${new_line}
          ************************** ${new_line}
          Reply this mail if you have any questions.${new_line}`,
        }
      );

      const emailData = {
        approvedTemplate: approvedTemplate,
        disapprovedTemplate: disapprovedTemplate,
        email: response.email,
        is_approved: response.is_approved,
      };

      await sendFreelancerStatus(emailData);
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

async function deleteEncounter(req, res, next) {
  try {
    if (!req.params.id) {
      throw new ErrorHandler(401, "deleteEncounter", "Missing parameter id");
    }

    var id = req.params.id;

    //check if user is the owner of skill to be deleted

    const doc = db.collection("Encounters").doc(`${id}`);
    let Encounter = await doc.get();
    if (!Encounter.exists) {
      throw new ErrorHandler(
        401,
        "deleteEncounter",
        "Encounter meeting with id does not exist"
      );
    }

    if (Encounter.data().status === "held") {
      throw new ErrorHandler(
        401,
        "deleteEncounter",
        "Encounter meeting which has already held cannot be deleted"
      );
    }

    await doc.delete();

    return res
      .status(200)
      .send({ message: "Encounter meeting deleted successfully" });
  } catch (error) {
    return next(error);
  }
}

router.get("/unEncounters", [validateFirebaseIdToken, admin], unEncounters);
router.get("/encounters", [validateFirebaseIdToken, admin], encounters);
router.get("/encounter/:id", [validateFirebaseIdToken, admin], getEncounter);
router.post("/encounter", [validateFirebaseIdToken, admin], createEncounter);
router.put("/setEncounter/:id", [validateFirebaseIdToken, admin], setEncounter);
router.put("/updateEncounter/:id", [validateFirebaseIdToken, admin], updateEncounter);
router.put(
  "/frstatus/:id",
  [validateFirebaseIdToken, admin],
  setFreelancerStatus
);
router.delete("/deleteEncounter/:id", [validateFirebaseIdToken, admin], deleteEncounter);
module.exports = router;

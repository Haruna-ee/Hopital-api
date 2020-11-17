/* eslint-disable promise/always-return */
/* eslint-disable callback-return */
const {
  bucket,
  db,
  firebaseAdmin,
  fs,
  ejs,
  path,
  isEmail,
  slugify,
} = require("../config");
const cryptoRandomString = require("crypto-random-string");
const { ErrorHandler } = require("../helpers/error");
const {
  validateFirebaseIdToken,
  admin,
  doctor,
  nurse,
  patient,
} = require("../middleware/");
const { sendProfileDeletionWarning } = require("../mails/email");
var router = require("express").Router();
const new_line = "\n\xA0";
const userMsg = "EHospit";

async function users(req, res, next) {
  try {
    let query = db.collection("users");
    let response = [];

    await query.get().then((querySnapshot) => {
      let docs = querySnapshot.docs; //result of the query

      for (let doc of docs) {
        const selectedItem = {
          id: doc.id,
          newuser: doc.data().newuser,
          email: doc.data().email,
          role: doc.data().role,
          firstname: doc.data().firstname,
          lastname: doc.data().lastname,
          username: doc.data().username,
          active: doc.data().active,
          country: doc.data().country,
          phone: doc.data().phone,
          image: doc.data().image,
          about: doc.data().about,
          is_approved: doc.data().is_approved,
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

async function medicals(req, res, next) {
  try {
    let doc = db.collection("users");

    const query = doc.where("role", "!=", "patient");

    let response = [];

    await query.get().then((querySnapshot) => {
      let docs = querySnapshot.docs; //result of the query

      for (let doc of docs) {
        const selectedItem = {
          id: doc.id,
          newuser: doc.data().newuser,
          email: doc.data().email,
          role: doc.data().role,
          firstname: doc.data().firstname,
          lastname: doc.data().lastname,
          username: doc.data().username,
          active: doc.data().active,
          country: doc.data().country,
          phone: doc.data().phone,
          image: doc.data().image,
          about: doc.data().about,
          is_approved: doc.data().is_approved,
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

async function getUserById(req, res, next) {
  try {
    if (!req.params.id) {
      throw new ErrorHandler(401, "getUserById", "Missing parameter id");
    }

    const document = db.collection("users").doc(req.params.id);
    let user = await document.get();

    if (!user.exists) {
      throw new ErrorHandler(401, "getUserById", "User id not found");
    }
    let response = user.data();
    delete response.imagepath;

    return res.status(200).send(response);
  } catch (error) {
    return next(error);
  }
}

async function user(req, res, next) {
  try {
    if (!req.user.uid) {
      throw new ErrorHandler(
        401,
        "user",
        "Refresh... Token not found.Decoding might have stalled."
      );
    }

    const document = db.collection("users").doc(req.user.uid);
    let user = await document.get();

    if (!user.exists) {
      throw new ErrorHandler(401, "User id not found");
    }
    let response = user.data();
    delete response.imagepath;

    return res.status(200).send(response);
  } catch (error) {
    return next(error);
  }
}

async function userByUsername(req, res, next) {
  try {
    if (!req.params.username) {
      throw new ErrorHandler(
        401,
        "userByUsername",
        "Missing parameter username"
      );
    }

    const document = db.collection("users");

    const query = document.where("username", "==", req.params.username);

    let response = [];

    await query.get().then((querySnapshot) => {
      if (querySnapshot.docs.length === 0) {
        throw new ErrorHandler(
          401,
          "userByUsername",
          "User with username not found.Invalid username"
        );
      }

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

async function userUpdate(req, res, next) {
  try {
    if (!req.user.uid) {
      throw new ErrorHandler(
        401,
        "userUpdate",
        "Refresh... Token not found.Decoding might have stalled."
      );
    }

    var id = req.user.uid;

    let document = db.collection("users").doc(`${id}`);

    let userData = await document.get();

    if (!userData.exists) {
      throw new ErrorHandler(
        401,
        "userUpdate",
        "User with id not found.Invalid id"
      );
    }

    if (`${id}` !== userData.data().user) {
      throw new ErrorHandler(
        401,
        "userUpdate",
        "Unauthorized user: Let appropriate user update data"
      );
    }

    //check if user is the right user to update profile
    let message, response;

    var updateObj = {};
    var adminObj = {};

    if (req.body.email && isEmail(req.body.email)) {
      updateObj.email = req.body.email;
      adminObj.email = req.body.email;
    }

    if (req.body.password) {
      adminObj.password = req.body.password;
    }

    if (req.body.phone) {
      updateObj.phone = req.body.phone;
    }

    if (req.body.firstname) {
      updateObj.firstname = req.body.firstname;
    }

    if (req.body.username) {
      updateObj.username = req.body.username;
    }


    if (req.body.lastname) {
      updateObj.lastname = req.body.lastname;
    }

    if (req.body.image && req.body.path) {
      updateObj.image = req.body.image;
      updateObj.imagepath = req.body.path;
    }

    if (Object.keys(adminObj).length > 0) {
      await firebaseAdmin.auth().updateUser(`${id}`, adminObj);
    }

    // See the UserRecord reference doc for the contents of userRecord.\
    if (Object.keys(updateObj).length > 0) {
      const doc = db.collection("users").doc(`${id}`);
      await doc.update(updateObj);

      let user = await doc.get();
      response = user.data();
      delete response.imagepath;
    }

    if (
      Object.keys(adminObj).length === 0 &&
      Object.keys(updateObj).length === 0
    ) {
      throw new ErrorHandler(
        401,
        "userUpdate",
        "Integrity checks passed.No data submitted.."
      );
    }

    return res
      .status(200)
      .send({ message: message, user: response ? response : null });
  } catch (error) {
    return next(error);
  }
}

async function userDelete(req, res, next) {
  try {
    if (!req.user.uid) {
      throw new ErrorHandler(
        401,
        "userDelete",
        "Refresh... Token not found.Decoding might have stalled."
      );
    }
    var id = req.user.uid;

    const document = db.collection("users").doc(`${id}`);

    let userData = await document.get();
    if (!userData.exists) {
      throw new ErrorHandler(
        401,
        "userDelete",
        "User with id not found.Invalid id"
      );
    }

    if (`${id}` !== userData.data().user) {
      throw new ErrorHandler(
        401,
        "userDelete",
        "Unauthorized user: Let appropriate user delete profile"
      );
    }

    await document.update({
      active: false,
    });

    const emailTemplate = await ejs.renderFile(
      path.join(__dirname, "../views/emailTemplate2.ejs"),
      {
        user: userMsg,
        email: userData.data().email,
        imageUrl: "https://i.imgur.com/cSPYPq5.png",
        stageOneText: ` 
        Your profile is set to be deleted ${new_line}
        You can reverse this deletion within three days ${new_line}
        Failure to do so, your profile will be permanently deleted ${new_line}
        Kindly leave us feedback as to why you want to delete your profile.${new_line}
        >>>> For any inquiries, you can reply us here
        *********${new_line}`,
      }
    );

    emailData = {
      emailTemplate: emailTemplate,
      email: userData.data().email,
    };

    await sendProfileDeletionWarning(emailData);

    return res.status(200).send({
      message:
        "User account is set to be deleted.You have 3 days to change the status",
    });
  } catch (error) {
    return next(error);
  }
}

async function userDeleteById(req, res, next) {
  try {
    if (!req.params.id) {
      throw new ErrorHandler(401, "userDeleteById", "Missing parameter id.");
    }
    var id = req.params.id;

    const document = db.collection("users").doc(`${id}`);

    let userData = await document.get();
    if (!userData.exists) {
      throw new ErrorHandler(
        401,
        "userDeleteById",
        "User with id not found.Invalid id"
      );
    }

    await document.update({
      active: false,
    });

    return res.status(200).send({
      message: "User account deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
}

async function reverseDelete(req, res, next) {
  try {
    if (!req.user.uid) {
      throw new ErrorHandler(
        401,
        "reverseDelete",
        "Refresh... Token not found.Decoding might have stalled."
      );
    }

    var id = req.user.uid;

    const document = db.collection("users").doc(`${id}`);

    let userData = await document.get();
    if (!userData.exists) {
      throw new ErrorHandler(
        401,
        "reverseDelete",
        "User with id not found.Invalid id"
      );
    }

    if (`${id}` !== userData.data().user) {
      throw new ErrorHandler(
        401,
        "reverseDelete",
        "Unauthorized user: Let appropriate user reverse delete profile"
      );
    }

    await document.update({
      active: true,
    });

    return res.status(200).send({ message: "User account is revived" });
  } catch (error) {
    return next(error);
  }
}

router.get("/users", [validateFirebaseIdToken], users);
router.get("/medicals", medicals);
router.get("/user", [validateFirebaseIdToken], user);
router.get("/user/:id", getUserById);
router.get("/usr/:username", userByUsername);
router.put("/userupdate", [validateFirebaseIdToken], userUpdate);
router.put("/userdelete", [validateFirebaseIdToken], userDelete);
router.put("/reversedelete", [validateFirebaseIdToken], reverseDelete);
router.delete("/userdelete/:id", [validateFirebaseIdToken], userDeleteById);

module.exports = router;

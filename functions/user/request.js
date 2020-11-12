/* eslint-disable certomise/always-return */
/* eslint-disable callback-return */
const {
  bucket,
  db,
  firebaseAdmin,
  firebaseClient,
  fs,
  ejs,
  path,
  slugify,
} = require("../config");
const { ErrorHandler } = require("../helpers/error");
const { validateFirebaseIdToken } = require("../middleware");
var router = require("express").Router();

async function requests(req, res, next) {
  try {
    let query = db.collection("requests");
    let response = [];

    await query.get().then((querySnapshot) => {
      let docs = querySnapshot.docs; //result of the query

      for (let doc of docs) {
        const selectedItem = {
          id: doc.id,
          name: doc.data().name,
          email: doc.data().email,
          phone: doc.data().phone,
          section: doc.data().section,
          reason: doc.data().reason,
          user: doc.data().user,
          time: doc.data().time,
          requestcomment: doc.data().requestcomment,
          status: doc.data().status,
          created: doc.data().created
            ? doc.data().created.toDate().toUTCString()
            : null,
          updated: doc.data().updated
            ? doc.data().updated.toDate().toUTCString()
            : null,
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

async function createRequest(req, res, next) {
  try {
    if (
      !req.body.name ||
      !req.body.email ||
      !req.body.phone ||
      !req.body.section ||
      !req.body.user ||
      !req.body.reason
    ) {
      throw new ErrorHandler(
        401,
        "createRequest",
        "Missing required fields:name or email or phone  or section or reason  or user"
      );
    }

    const document = db.collection("users").doc(req.body.user);
    let user = await document.get();

    if (!user.exists) {
      throw new ErrorHandler(401, "Medical practitioner id not found");
    }

    const response = await db.collection("requests").add({
      user: req.body.user,
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      reason: req.body.reason,
      section: req.body.section,
      time: null,
      requestcomment: null,
      status: false,
      created: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
    });

    return res
      .status(200)
      .json({ message: "Request added successfully", id: response.id });
  } catch (error) {
    return next(error);
  }
}

async function getRequest(req, res, next) {
  try {
    if (!req.params.id) {
      throw new ErrorHandler(401, "getRequest", "Missing parameter id");
    }
    const document = db.collection("requests").doc(req.params.id);
    let request = await document.get();

    let response = {
      user: request.data().user,
      name: request.data().name,
      email: request.data().email,
      phone: request.data().phone,
      reason: request.data().reason,
      section: request.data().section,
      time: request.data().time,
      requestcomment: request.data().requestcomment,
      status: request.data().status,
      created: request.data().created.toDate().toUTCString(),
      updated: request.data().updated
        ? request.data().updated.toDate().toUTCString()
        : null,
    };

    return res.status(200).send(response);
  } catch (error) {
    return next(error);
  }
}

async function getAllRequests(req, res, next) {
  try {

    // Create a reference to the cities collection
    const requestsRef = db.collection("requests");

    // Create a query against the collection
    const queryRef = requestsRef.where("user", "==", req.user.uid);

    let response = [];

    await queryRef.get().then((querySnapshot) => {
      let docs = querySnapshot.docs; //result of the query

      for (let doc of docs) {
        const selectedItem = {
          id: doc.id,
          user: doc.data().user,
          name: doc.data().name,
          email: doc.data().email,
          phone: doc.data().phone,
          reason: doc.data().reason,
          section: doc.data().section,
          time: doc.data().time,
          requestcomment: doc.data().requestcomment,
          status: doc.data().status,
          created: doc.data().created
            ? doc.data().created.toDate().toUTCString()
            : null,
          updated: doc.data().updated
            ? doc.data().updated.toDate().toUTCString()
            : null,
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

async function updateRequest(req, res, next) {
  try {
    if (!req.params.id) {
      throw new ErrorHandler(401, "updateRequest", "Missing parameter id");
    }

    var id = req.params.id;

    //check if user is the owner of skill to be updated

    const doc = db.collection("requests").doc(`${id}`);
    let cert = await doc.get();
    if (!cert.exists) {
      throw new ErrorHandler(
        401,
        "updateRequest",
        "certificate with id does not exist"
      );
    }

    let requestUsr = cert.data().user;

    if (requestUsr !== req.user.uid) {
      throw new ErrorHandler(
        401,
        "updateRequest",
        "Unauthorized user: Let approproate user update request"
      );
    }

    let response;
    var updateObj = {};

    //certocess obj
    if (req.body.name) {
      updateObj.name = req.body.name;
    }

    if (req.body.email) {
      updateObj.email = req.body.email;
    }

    if (req.body.phone) {
      updateObj.phone = req.body.phone;
    }

    if (req.body.section) {
      updateObj.section = req.body.section;
    }

    if (req.body.reason) {
      updateObj.reason = req.body.reason;
    }

    updateObj.updated = firebaseAdmin.firestore.FieldValue.serverTimestamp();

    if (Object.keys(updateObj).length > 0) {
      const doc = db.collection("requests").doc(`${id}`);
      await doc.update(updateObj);

      let request = await doc.get();
      response = {
        user: request.data().user,
        name: request.data().name,
        email: request.data().email,
        phone: request.data().phone,
        reason: request.data().reason,
        section: request.data().section,
        time: request.data().time,
        requestcomment: request.data().requestcomment,
        status: request.data().status,
        created: request.data().created
          ? request.data().created.toDate().toUTCString()
          : null,
        updated: request.data().updated
          ? request.data().updated.toDate().toUTCString()
          : null,
      };
    } else {
      response = "No data passed:";
    }

    return res
      .status(200)
      .send({ message: "request updated succesfully", user: response });
  } catch (error) {
    return next(error);
  }
}

async function deleteRequest(req, res, next) {
  try {
    if (!req.params.id) {
      throw new ErrorHandler(401, "deleteRequest", "Missing parameter id");
    }

    var id = req.params.id;

    //check if user is the owner of skill to be deleted

    const doc = db.collection("requests").doc(`${id}`);
    let ed = await doc.get();

    if (!ed.exists) {
      throw new ErrorHandler(
        401,
        "deleteRequest",
        "request with id does not exist"
      );
    }

    let requestUsr = ed.data().user;

    if (requestUsr !== req.user.uid) {
      throw new ErrorHandler(
        401,
        "deleteRequest",
        "Unauthorized user: Let appropirate user delete request"
      );
    }

    await doc.delete();

    return res.status(200).send({ message: "request deleted successfully" });
  } catch (error) {
    return next(error);
  }
}

router.get("/requests", requests);
router.get("/request/:id", getRequest);
router.get("/usrrequests", [validateFirebaseIdToken], getAllRequests);
router.post("/request", createRequest);
router.put("/uprequest/:id", [validateFirebaseIdToken], updateRequest);
router.delete("/drequest/:id", [validateFirebaseIdToken], deleteRequest);
module.exports = router;

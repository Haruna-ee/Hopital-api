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

    const response = await db.collection("requests").add({
      medical: req.body.user,
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
      medical: request.data().medical,
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

async function getAllPatientRequests(req, res, next) {
  try {
    // Create a reference to the cities collection
    const requestsRef = db.collection("requests");

    // Create a query against the collection
    const queryRef = requestsRef.where("email", "==", req.params.id);

    let response = [];

    await queryRef.get().then((querySnapshot) => {
      let docs = querySnapshot.docs; //result of the query

      for (let doc of docs) {
        const selectedItem = {
          id: doc.id,
          user: doc.data().user,
          medical: doc.data().medical,
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

async function updateRequestByPatient(req, res, next) {
  try {
    if (!req.params.id) {
      throw new ErrorHandler(401, "updateRequest", "Missing parameter id");
    }

    var id = req.params.id;

    //check if user is the owner of skill to be updated

    const doc = db.collection("requests").doc(`${id}`);
    let request = await doc.get();
    if (!request.exists) {
      throw new ErrorHandler(
        401,
        "updateRequest",
        "request with id does not exist"
      );
    }

    let requestUsr = request.data().user;

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

    if (req.body.reason) {
      updateObj.reason = req.body.reason;
    }

    if (req.body.section) {
      updateObj.section = req.body.section;
    }

    updateObj.status = false;

    updateObj.updated = firebaseAdmin.firestore.FieldValue.serverTimestamp();

    if (Object.keys(updateObj).length > 0) {
      const doc = db.collection("requests").doc(`${id}`);
      await doc.update(updateObj);

      let request = await doc.get();
      response = {
        user: req.user.uid,
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

async function updateRequestByMed(req, res, next) {
  try {
    if (!req.params.id) {
      throw new ErrorHandler(401, "updateRequest", "Missing parameter id");
    }

    var id = req.params.id;

    //check if user is the owner of skill to be updated

    const doc = db.collection("requests").doc(`${id}`);
    let request = await doc.get();
    if (!request.exists) {
      throw new ErrorHandler(
        401,
        "updateRequest",
        "request with id does not exist"
      );
    }

    let response;
    var updateObj = {};

    //certocess obj
    if (req.body.requestcomment) {
      updateObj.requestcomment = req.body.requestcomment;
    }

    if (req.body.time) {
      updateObj.time = req.body.time;
    }

    updateObj.status = true;

    updateObj.updated = firebaseAdmin.firestore.FieldValue.serverTimestamp();

    if (Object.keys(updateObj).length > 0) {
      const doc = db.collection("requests").doc(`${id}`);
      await doc.update(updateObj);

      let request = await doc.get();
      response = {
        user: req.user.uid,
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

    await doc.delete();

    return res.status(200).send({ message: "request deleted successfully" });
  } catch (error) {
    return next(error);
  }
}

router.get("/requests", [validateFirebaseIdToken], requests);
router.get("/request/:id", getRequest);
router.get("/usrrequests/:id", [validateFirebaseIdToken], getAllPatientRequests);
router.post("/request", createRequest);
router.put("/uprequest/:id", [validateFirebaseIdToken], updateRequestByPatient);
router.put(
  "/uprequestbymed/:id",
  [validateFirebaseIdToken],
  updateRequestByMed
);
router.delete("/requestdelete/:id", [validateFirebaseIdToken], deleteRequest);
module.exports = router;

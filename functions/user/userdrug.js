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

async function createUserDrug(req, res, next) {
  try {
    if (!req.body.user || !req.body.drug || !req.body.prescription) {
      throw new ErrorHandler(
        401,
        "createDrug",
        "Missing required fields:user or drug  or prescription"
      );
    }

    const document = db.collection("drugs").doc(req.body.drug);
    let drug = await document.get();

    if (!drug.exists) {
      throw new ErrorHandler(401, "drug id not found");
    }

    const response = await db.collection("userdrugs").add({
      user: req.body.user,
      medical: req.user.uid,
      drug: req.body.drug,
      prescription: req.body.prescription,
      created: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
    });

    return res
      .status(200)
      .json({ message: "User prescribed successfully", id: response.id });
  } catch (error) {
    return next(error);
  }
}

async function getAllUserDrugs(req, res, next) {
  try {
    // Create a reference to the cities collection
    const drugsRef = db.collection("userdrugs");

    // Create a query against the collection
    const queryRef = drugsRef.where("user", "==", req.user.uid);

    let response = [];

    await queryRef.get().then((querySnapshot) => {
      let docs = querySnapshot.docs; //result of the query

      for (let doc of docs) {
        const selectedItem = {
          id: doc.id,
          user: doc.data().user,
          drug: doc.data().drug,
          prescription: doc.data().prescription,
          medical: doc.data().medical,
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


async function getAllUserDrugsMed(req, res, next) {
  try {
    // Create a reference to the cities collection
    const drugsRef = db.collection("userdrugs");

    // Create a query against the collection
    const queryRef = drugsRef.where("user", "==", req.params.id);

    let response = [];

    await queryRef.get().then((querySnapshot) => {
      let docs = querySnapshot.docs; //result of the query

      for (let doc of docs) {
        const selectedItem = {
          id: doc.id,
          user: doc.data().user,
          drug: doc.data().drug,
          prescription: doc.data().prescription,
          medical: doc.data().medical,
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



async function deleteUserDrug(req, res, next) {
  try {
    if (!req.params.id) {
      throw new ErrorHandler(401, "deleteUserDrug", "Missing parameter id");
    }

    var id = req.params.id;

    //check if user is the owner of skill to be deleted

    const doc = db.collection("userdrugs").doc(`${id}`);
    let ed = await doc.get();

    if (!ed.exists) {
      throw new ErrorHandler(
        401,
        "deleteUserDrug",
        "prescription with id does not exist"
      );
    }
    await doc.delete();

    return res.status(200).send({ message: "prescription deleted successfully" });
  } catch (error) {
    return next(error);
  }
}

router.post("/usrdrug", [validateFirebaseIdToken], createUserDrug);
router.get("/usrdrugs", [validateFirebaseIdToken], getAllUserDrugs);
router.get("/usrdrugsmd/:id", [validateFirebaseIdToken], getAllUserDrugsMed);
router.delete("/deleteusrdrug/:id", [validateFirebaseIdToken], deleteUserDrug);
module.exports = router;

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
  
  async function drugs(req, res, next) {
    try {
      let query = db.collection("drugs");
      let response = [];
  
      await query.get().then((querySnapshot) => {
        let docs = querySnapshot.docs; //result of the query
  
        for (let doc of docs) {
          const selectedItem = {
            id: doc.id,
            name: doc.data().name,
            category: doc.data().category,
            price: doc.data().price,
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
  
  async function createDrug(req, res, next) {
    try {
      if (
        !req.body.name ||
        !req.body.category ||
        !req.body.price
      ) {
        throw new ErrorHandler(
          401,
          "createDrug",
          "Missing required fields:name or category  or price"
        );
      }
  
      const response = await db.collection("drugs").add({
        name: req.body.name,
        category: req.body.category,
        price: req.body.price,
        created: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      });
  
      return res
        .status(200)
        .json({ message: "drug added successfully", id: response.id });
    } catch (error) {
      return next(error);
    }
  }
  
  async function getDrug(req, res, next) {
    try {
      if (!req.params.id) {
        throw new ErrorHandler(401, "getDrug", "Missing parameter id");
      }
      const document = db.collection("drugs").doc(req.params.id);
      let drug = await document.get();
  
      let response = {
        name: drug.data().name,
        category: drug.data().category,
        price: drug.data().price,
        created: drug.data().created.toDate().toUTCString(),
        updated: drug.data().updated
          ? drug.data().updated.toDate().toUTCString()
          : null,
      };
  
      return res.status(200).send(response);
    } catch (error) {
      return next(error);
    }
  }
  
  async function updateDrugByMed(req, res, next) {
    try {
      if (!req.params.id) {
        throw new ErrorHandler(401, "updateDrugByMed", "Missing parameter id");
      }
  
      var id = req.params.id;
  
      //check if user is the owner of skill to be updated
  
      const doc = db.collection("drugs").doc(`${id}`);
      let drug = await doc.get();
      if (!drug.exists) {
        throw new ErrorHandler(
          401,
          "updateDrugByMed",
          "drug with id does not exist"
        );
      }

      let response;
      var updateObj = {};
  
      //certocess obj
      if (req.body.name) {
        updateObj.name = req.body.name;
      }

      if (req.body.category) {
        updateObj.category = req.body.category;
      }

      if (req.body.price) {
        updateObj.price = req.body.price;
      }
  
  
      updateObj.updated = firebaseAdmin.firestore.FieldValue.serverTimestamp();
  
      if (Object.keys(updateObj).length > 0) {
        const doc = db.collection("drugs").doc(`${id}`);
        await doc.update(updateObj);
  
        let drug = await doc.get();
        response = {
          user: req.user.uid,
          name: drug.data().name,
          category: drug.data().category,
          price: drug.data().price,
          created: drug.data().created
            ? drug.data().created.toDate().toUTCString()
            : null,
          updated: drug.data().updated
            ? drug.data().updated.toDate().toUTCString()
            : null,
        };
      } else {
        response = "No data passed:";
      }
  
      return res
        .status(200)
        .send({ message: "drug updated succesfully", user: response });
    } catch (error) {
      return next(error);
    }
  }
  
  async function deleteDrug(req, res, next) {
    try {
      if (!req.params.id) {
        throw new ErrorHandler(401, "deleteDrug", "Missing parameter id");
      }
  
      var id = req.params.id;
  
      //check if user is the owner of skill to be deleted
  
      const doc = db.collection("drugs").doc(`${id}`);
      let ed = await doc.get();
  
      if (!ed.exists) {
        throw new ErrorHandler(
          401,
          "deletedrug",
          "drug with id does not exist"
        );
      }
      await doc.delete();
  
      return res.status(200).send({ message: "drug deleted successfully" });
    } catch (error) {
      return next(error);
    }
  }
  
  router.get("/drugs", [validateFirebaseIdToken], drugs);
  router.get("/drug/:id", getDrug);
  router.post("/drug", createDrug);
  router.put(
    "/updrugbymed/:id",
    [validateFirebaseIdToken],
    updateDrugByMed
  );
  router.delete("/deletedrug/:id", [validateFirebaseIdToken], deleteDrug);
  module.exports = router;
  
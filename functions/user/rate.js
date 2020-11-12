/* eslint-disable promise/always-return */
/* eslint-disable callback-return */
const { db } = require("../config");
const { ErrorHandler } = require("../helpers/error");
const { validateFirebaseIdToken, author } = require("../middleware");
var router = require("express").Router();

async function rate(req, res, next) {
  try {
    if (!req.body.id) {
      throw new ErrorHandler(401, "rate", "Missing required fields: post id");
    }

    if (!req.body.rating) {
      throw new ErrorHandler(401, "rate", "Missing required fields:rating");
    }

    const id = req.body.id;
    const user = req.user.uid;

    const doc = db.collection("posts").doc(`${id}`);
    let pt = await doc.get();

    if (!pt.exists) {
      throw new ErrorHandler(401, "rate", "Post with id does not exist");
    }

    if (!pt.data().assigned_to) {
      throw new ErrorHandler(
        401,
        "rate",
        "You cannot rate a freelancer for a post which is unassigned"
      );
    }

    const response = await db.collection("ratings").add({
      post: id,
      user: user,
      freelancer: req.body.freelancer,
      rating: req.body.rating,
    });

    return res.status(200).json({
      message: "Rating submitted successfully",
      id: response.id,
    });
  } catch (error) {
    return next(error);
  }
}

async function getRatings(req, res, next) {
  try {
    if (!req.params.id) {
      throw new ErrorHandler(401, "getRatings", "Missing parameter id");
    }

    // Create a reference to the cities collection
    const document = db.collection("ratings");

    // Create a query against the collection
    const queryRef = document.where("post", "==", req.params.id);

    let response = [];

    await queryRef.get().then((querySnapshot) => {
      let docs = querySnapshot.docs; //result of the query

      for (let doc of docs) {
        const selectedItem = {
          id: doc.id,
          user: doc.data().user,
          post: doc.data().post,
          freelancer: doc.data().freelancer,
          rating: doc.data().rating,
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

router.get("/rating/:id", getRatings);
router.post("/rate", [validateFirebaseIdToken, author], rate);
module.exports = router;

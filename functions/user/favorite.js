/* eslint-disable promise/always-return */
/* eslint-disable callback-return */
const {
  bucket,
  db,
  firebaseAdmin,
  firebaseClient,
  fs,
  isEmail,
  slugify,
} = require("../config");

const { ErrorHandler } = require("../helpers/error");
const {
  validateFirebaseIdToken,
  admin,
  author,
  freelancer,
} = require("../middleware");
var router = require("express").Router();

async function favorite(req, res, next) {
  try {
    if (!req.body.id) {
      throw new ErrorHandler(
        401,
        "favorite",
        "Missing required fields: post id"
      );
    }

    const id = req.body.id;
    const user = req.user.uid;

    const doc = db.collection("posts").doc(`${id}`);
    let pt = await doc.get();

    if (!pt.exists) {
      throw new ErrorHandler(401, "favorite", "Post with id does not exist");
    }

    const document = db.collection("favorites");

    const queryRef = document
      .where("post", "==", `${id}`)
      .where("user", "==", `${user}`);
    const qr = await queryRef.get();

    if (!qr.exists) {
      throw new ErrorHandler(
        401,
        "favorite",
        "You already have this post as favorite"
      );
    }

    const response = await db.collection("favorites").add({
      user: `${user}`,
      post: `${id}`,
    });

    return res
      .status(200)
      .json({ message: "Post favorite added", id: response.id });
  } catch (error) {
    return next(error);
  }
}

async function getFavorites(req, res, next) {
  try {
    if (!req.params.id) {
      throw new ErrorHandler(401, "getFavorites", "Missing parameter id");
    }

    // Create a reference to the cities collection
    const document = db.collection("favorites");

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

async function unfavorite(req, res, next) {
  try {
    if (!req.params.id) {
      throw new ErrorHandler(401, "unfavorite", "Missing parameter id");
    }

    var id = req.params.id;

    //check if user is the owner of skill to be deleted

    const doc = db.collection("favorites").doc(`${id}`);
    let favorite = await doc.get();
    if (!favorite.exists) {
      throw new ErrorHandler(
        401,
        "unfavorite",
        "favorite with id does not exist"
      );
    }

    if (favorite.data().user !== req.user.uid) {
      throw new ErrorHandler(401, "unfavorite", "User does not match.");
    }

    await doc.delete();

    return res
      .status(200)
      .send({ message: "Post marked as unfavorite successfully" });
  } catch (error) {
    return next(error);
  }
}

router.get("/favorites/:id", getFavorites);
router.post("/favorite", [validateFirebaseIdToken], favorite);
router.delete("/unfavorite/:id", [validateFirebaseIdToken], unfavorite);
module.exports = router;

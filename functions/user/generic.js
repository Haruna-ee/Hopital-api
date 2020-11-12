/* eslint-disable promise/always-return */
/* eslint-disable callback-return */
const { db } = require("../config");
const { ErrorHandler } = require("../helpers/error");
const { validateFirebaseIdToken, admin } = require("../middleware/");
var router = require("express").Router();

async function freelancers(req, res, next) {
  try {
    const document = db.collection("users");

    const query = document.where("role", "==", "freelancer")
                          .where("is_approved", "==", true);

    let response = [];

    await query.get().then((querySnapshot) => {
      let docs = querySnapshot.docs; //result of the query

      for (let doc of docs) {
        const selectedItem = {
          id: doc.id,
          email: doc.data().email,
          newuser: doc.data().newuser,
          role: doc.data().role,
          specialty: doc.data().specialty,
          about: doc.data().about,
          lang1: doc.data().lang1,
          firstname: doc.data().firstname,
          lastname: doc.data().lastname,
          username: doc.data().username,
          active: doc.data().active,
          country: doc.data().country,
          phone: doc.data().phone,
          image: doc.data().image,
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

async function authors(req, res, next) {
  try {
    const document = db.collection("users");

    const query = document.where("role", "==", "author");

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
          photo: doc.data().photo,
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

router.get("/freelancers", freelancers);
router.get("/authors", [validateFirebaseIdToken], authors);
module.exports = router;

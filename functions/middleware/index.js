const { db, firebaseAdmin, path, os, fs, Busboy } = require("../config");
const { ErrorHandler } = require("../helpers/error");
/* eslint-disable promise/always-return */
// Express middleware that validates Firebase ID Tokens passed in the authorization HTTP header.
// The Firebase ID token needs to be passed as a Bearer token in the authorization HTTP header like this:
// `authorization: Bearer <Firebase ID Token>`.
// when decoded successfully, the ID Token content will be added as `req.user`.
const validateFirebaseIdToken = async (req, res, next) => {
  console.log("Check if request is authorized with Firebase ID token");

  if (
    (!req.headers.authorization ||
      !req.headers.authorization.startsWith("Bearer ")) &&
    !(req.cookies && req.cookies.__session)
  ) {
    console.error(
      "No Firebase ID token was passed as a Bearer token in the authorization header.",
      "Make sure you nurseize your request by providing the following HTTP header:",
      "authorization: Bearer <Firebase ID Token>",
      'or by passing a "__session" cookie.'
    );
    res.status(403).send({ message: "Unauthorized.Could not verify token" });
    return;
  }

  let idToken;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    console.log('Found "authorization" header');
    // Read the ID Token from the authorization header.
    idToken = req.headers.authorization.split("Bearer ")[1];
  } else if (req.cookies) {
    console.log('Found "__session" cookie');
    // Read the ID Token from cookie.
    idToken = req.cookies.__session;
  } else {
    // No cookie
    res
      .status(403)
      .send({ message: "Unauthorized.Could not verify token.No Cookie" });
    return;
  }

  try {
    const decodedIdToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    console.log("ID Token correctly decoded", decodedIdToken);
    req.user = decodedIdToken;
    next();
    return;
  } catch (error) {
    if (error.code === "auth/id-token-expired") {
      res
        .status(403)
        .send({ message: "Token has expired. Login again before continuing" });
    } else {
      res.status(403).send({ message: error.message });
    }
    return;
  }
};

const admin = async (req, res, next) => {
  try {
    const document = db.collection("users").doc(req.user.user_id);
    let userRecord = await document.get();
    let rec = userRecord.data();
    if (rec.role !== "admin") {
      res.status(403).send({ message: "Unauthorized action" });
      return;
    }
    next();
    return;
  } catch (e) {
    res.status(403).send({ message: "Unauthorized action" });
    return;
  }
};

const nurse = async (req, res, next) => {
  try {
    const document = db.collection("users").doc(req.user.user_id);
    let userRecord = await document.get();
    let rec = userRecord.data();
    if (rec.role !== "nurse") {
      res.status(403).send({ message: "Unauthorized action" });
      return;
    }
    next();
    return;
  } catch (e) {
    res.status(403).send({ message: "Unauthorized action" });
    return;
  }
};

const patient = async (req, res, next) => {
  try {
    const document = db.collection("users").doc(req.user.user_id);
    let userRecord = await document.get();
    let rec = userRecord.data();
    if (rec.role !== "patient") {
      res.status(403).send({ message: "Unauthorized action" });
      return;
    }
    next();
    return;
  } catch (e) {
    res.status(403).send({ message: "Unauthorized action" });
    return;
  }
};

const doctor = async (req, res, next) => {
  try {
    const document = db.collection("users").doc(req.user.user_id);
    let userRecord = await document.get();
    let rec = userRecord.data();
    if (rec.role !== "doctor") {
      res.status(403).send({ message: "Unauthorized action" });
      return;
    }
    next();
    return;
  } catch (e) {
    res.status(403).send({ message: "Unauthorized action" });
    return;
  }
};

const formFilter = async (req, res, next) => {
  
  res.set('Access-Control-Allow-Origin', '*');

  try {
    if (req.method !== "POST") {
      // Return a "method not allowed" error
      return res.status(405).end();
    }
    const busboy = new Busboy({ headers: req.headers });
    const tmpdir = os.tmpdir();

    // This object will accumulate all the fields, keyed by their name
    const fields = {};

    // This object will accumulate all the uploaded files, keyed by their name.
    const uploads = {};

    // This code will process each non-file field in the form.
    busboy.on("field", (fieldname, val) => {
      /**
       *  TODO(developer): Process submitted field values here
       */
      console.log(`Processed field ${fieldname}: ${val}.`);
      fields[fieldname] = val;
    });

    const fileWrites = [];

    // This code will process each file uploaded.
    busboy.on("file", (fieldname, file, filename) => {
      // Note: os.tmpdir() points to an in-memory file system on GCF
      // Thus, any files in it must fit in the instance's memory.
      console.log(`Processed file ${filename}`);
      const filepath = path.join(tmpdir, filename);
      uploads[fieldname] = filepath;

      const writeStream = fs.createWriteStream(filepath);
      file.pipe(writeStream);

      // File was processed by Busboy; wait for it to be written.
      // Note: GCF may not persist saved files across invocations.
      // Persistent files must be kept in other locations
      // (such as Cloud Storage buckets).
      const promise = new Promise((resolve, reject) => {
        file.on("end", () => {
          writeStream.end();
        });
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
      });
      fileWrites.push(promise);
    });

    // Triggered once all uploaded files are processed by Busboy.
    // We still need to wait for the disk writes (saves) to complete.
    busboy.on("finish", async () => {
      await Promise.all(fileWrites);

      /**
       * TODO(developer): Process saved files here
       */
      for (const file in uploads) {
        fs.unlinkSync(uploads[file]);
      }
      res.send();
    });

    busboy.end(req.rawBody);

    return next();
  } catch (e) {
    res.status(403).send({ message: "Unauthorized action" });
    return next(e);
  }
};

module.exports = {
  validateFirebaseIdToken,
  admin,
  nurse,
  doctor,
  patient,
  formFilter
};

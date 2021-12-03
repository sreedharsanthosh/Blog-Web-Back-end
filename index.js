const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on("error", (err) => {
  console.log(`Error while connecting with the database ${err}`);
});

mongoose.connection.once("open", () => {
  console.log("App is connected with the database");
});

const userSchema = mongoose.Schema({
  username: String,
  password: String,
  blogs: [
    {
      title: String,
      body: String,
      img: {
        contenType: String,
        data: Buffer,
      },
    },
  ],
});

const user = mongoose.model("users", userSchema);

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./public/uploads");
  },
  filename: function (req, file, callback) {
    crypto.pseudoRandomBytes(16, function (err, raw) {
      let filename = "upload.jpg";
      req.file = filename;
      callback(null, filename);
    });
  },
});

const upload = multer({
  storage: storage,
}).single("img");

app.get("/", (req, res) => {
  res.send("Home page");
});

app.post("/register", (req, res) => {
  user.countDocuments({ username: req.body.name }, (err, count) => {
    if (err) {
      console.log(`Error while comparing username ${err}`);
    } else if (count >= 1) {
      res.send("A user with the same username exists");
    } else {
      bcrypt.hash(req.body.password, 10, (err, hash) => {
        if (err) {
          console.log("Error while hashing password ", err);
        } else {
          const newUser = {
            username: req.body.name,
            password: hash,
          };
          user.create(newUser, (err, usr) => {
            if (err) {
              console.log(`Error while creating new user ${err}`);
            } else {
              console.log("User created");
              res.send("new user created");
            }
          });
        }
      });
    }
  });
});

app.post("/login", (req, res) => {
  user.findOne({ username: req.body.name }, (err, User) => {
    if (err) {
      console.log("Error while comparing username", err);
    } else if (User) {
      bcrypt.compare(req.body.password, User.password, (err, user) => {
        if (err) {
          console.log("Error while comparing password");
        } else if (user == true) {
          res.send(User);
        } else {
          res.send("Incorrect username or password");
        }
      });
    } else {
      res.send("Incorrect username or password");
    }
  });
});

app.post("/:user/:id/newblog", (req, res) => {
  upload(req, res, (err) => {
    console.log("Request ---", req.body.title);
    console.log("Request file ---", req.file.filename); //Here you get file.
    /*Now do where ever you want to do*/
    if (!err) {
      console.log("no errprrrr");
    } else if (err) {
      console.log("error whi;e uploading ", err);
    }
    var todayDateTime = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    console.log(todayDateTime);

    const img = {
      title: req.body.title,
      body: req.body.body,
      img: {
        contentType: "image/jpg",
        data: fs.readFileSync(
          path.join(__dirname + "/public/uploads/" + req.file.filename)
        ),
      },
    };
    console.log("img :", img);
    user.findByIdAndUpdate(
      req.params.id,
      { $push: { blogs: img } },
      (err, doc) => {
        if (err) {
          console.log("Error on post ", err);
        } else {
          console.log("Docasdfadsfa: ");
        }
      }
    );
  });
});

const port = process.env.PORT || 4000;
app.listen(port, console.log(`App is listening on port ${port}`));

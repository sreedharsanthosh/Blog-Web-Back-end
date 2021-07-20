const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

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
      date: Number,
    },
  ],
});

const user = mongoose.model("users", userSchema);

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
              res.send(usr);
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

const port = process.env.PORT || 4000;
app.listen(port, console.log(`App is listening on port ${port}`));

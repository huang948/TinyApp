var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
var cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
var cookieSession = require('cookie-session')

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.use(cookieSession({
  name: 'session',
  keys: ['key1']
}));

app.set("view engine", "ejs")

var urlDatabase = {
  "b2xVn2": {userID: "test", datecreated: "TODAY", url: "http://www.lighthouselabs.ca"},
  "9sm5xK": {userID: "test", datecreated: "YESTERDAY", url: "http://www.google.com"}
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10)
  },
  "test": {
    id: "test",
    email: "t@t.com",
    password: bcrypt.hashSync("password", 10)
  }
};

function urlsForUser(userID) {
  let output = {};
  for (var key in urlDatabase) {
    if (urlDatabase[key]['userID'] === userID) {
      output[key] = urlDatabase[key];
    }
  }
  return output;
}

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.render("error");
  } else {
    var newDatabase = urlsForUser(req.session.user_id);
    var templateVars = { urls: newDatabase, user: users[req.session.user_id] };
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.session.user_id] };
  if (req.session.user_id) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.post("/urls", (req, res) => {
  let temp = generateRandomString();
  urlDatabase[temp] = {userID: req.session.user_id, datecreated: "TODAY", url: req.body.longURL};
  res.redirect('/urls');
});

app.post("/urls/:id/delete", (req, res) => {
  let item = req.params.id;
  delete urlDatabase[item];
  res.redirect('/urls');
});

app.get("/urls/:id", (req, res) => {
  if (!req.session.user_id || urlDatabase[req.params.id].userID !== req.session.user_id) {
    res.render('error');
  } else {
    if (req.session.user_id === urlDatabase[req.params.id]['userID']) {
      let templateVars = { shortURL: req.params.id, urls: urlDatabase, user: users[req.session.user_id] };
      res.render("urls_show", templateVars);
    } else {
      res.send("The matching url id does not belong to you! Please sign in before proceeding.");
    }
  }
});

app.post("/urls/:id", (req, res) => {
  let id = req.params.id;
  urlDatabase[id]['url'] = req.body.longURL;
  res.redirect('/urls');
});

app.get("/u/:shortURL", (req, res) => {
   if (req.params.shortURL in urlDatabase) {
    let longURL = urlDatabase[req.params.shortURL]['url'];
    res.redirect(longURL);
  } else {
    res.render('error');
  }
});

app.get("/login", (req, res) => {
  res.render("login")
});

app.post("/login", (req, res) => {
  let pass = false;

  for (let key in users) {
    if (users[key].email === req.body.email && bcrypt.compareSync(req.body.password, users[key].password)) {
      req.session.user_id = users[key].id;
      pass = true;
      res.redirect('/urls');
    }
  }

  if(!pass) {
    res.status(403).send("Invalid Email or Password");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.get("/register", (req, res) => {
  res.render('registration');
});

app.post("/register", (req, res) => {
  const newUserId = generateRandomString();

  for (let userId in users) {
    if (users[userId].email === req.body.email) {
      res.status(400).send("Email already taken!");
    }
  }

  users[newUserId] = {
    id: newUserId,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  };
  req.session.user_id = newUserId
  res.redirect('/urls');

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i <= 6; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}


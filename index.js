const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

app.use(function(req, res, next){
  console.log (req.method + " " + req.path + " - " + req.ip);
  next();
})

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, required: true },
});

let User = mongoose.model("User", userSchema);

app.post("/api/users", function(req, res){
  let newUser = new User({ username: req.body.username })
  newUser.save((err, createdUser) => {
    if (err) return console.log(err);
    res.json({ username: createdUser.username, _id: createdUser._id })
  })
})

app.get("/api/users", function(req, res){
  User.find()
      .select({username: 1, id: 1})
      .exec((err, users) => {
        if (err) return console.log(err);
        res.json(users);
      })
})
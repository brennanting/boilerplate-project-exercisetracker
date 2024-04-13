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
  if (!req.body.username) {
    res.json({error: "missing username"})
  } else {
    let newUser = new User({ username: req.body.username })
    newUser.save((err, createdUser) => {
      if (err) return console.log(err);
      res.json({ username: createdUser.username, _id: createdUser._id })
    })
  }
})

app.get("/api/users", function(req, res){
  User.find()
      .select({username: 1, id: 1})
      .exec((err, users) => {
        if (err) return console.log(err);
        res.json(users);
      })
})

const exerciseSchema = new Schema({
  _userid: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: String, required: true, default: new Date().toDateString() }
})

let Exercise = mongoose.model("Exercise", exerciseSchema);

app.post("/api/users/:_id/exercises", function(req, res) {
  if (!req.params._id || !req.body.description || !req.body.duration) {
    res.json({error: "Missing fields"})
  } else {
    User.findById(req.params._id, (err, UserFound) => {
      if (err) return console.log(err);
      if (!UserFound) {
        res.json({error: "Invalid User"})
      } else {
        var datetoset = "new Date";
        if (!req.body.date) {
          datetoset = new Date().toDateString();
        } else{
          datetoset = new Date(req.body.date).toDateString();
        }
        let newExercise = new Exercise({
          _userid: req.params._id,
          description: req.body.description,
          duration: req.body.duration,
          date: datetoset
        });
        newExercise.save((err, createdExercise) => {
          if (err) return console.log(err);
          res.json({
            username: UserFound.username,
            description: createdExercise.description,
            duration: createdExercise.duration,
            date: createdExercise.date,
            _id: createdExercise._userid
          })
        })
      }
    });
  }
})

app.get("/api/users/:id/logs/", (req, res) => {
  if (new Date(req.query.from) > new Date(req.query.to)) {
    res.json({error: "Invalid parameters"})
    } else {
    User.findById(req.params.id, (err, UserFound) => {
      if (err) return console.log(err)
      if (!UserFound) {
        res.json({error: "Invalid user"})
      } else {
        Exercise.find({_userid: req.params.id})
                .select({description: 1, duration: 1, date: 1})
                .exec((err, exercisesFound) => {
                  if (err) return console.log(err);
                  if (req.query.from) {
                    var inputfrom = new Date(req.query.from);
                    exercisesFound = exercisesFound.filter((exercise) => {
                      return new Date(exercise.date) >= inputfrom;
                    })
                  }
                  if (req.query.to) {
                    var inputto = new Date(req.query.to);
                    exercisesFound = exercisesFound.filter((exercise) => {
                      return new Date(exercise.date) <= inputto;
                    })
                  }
                  if (req.query.limit) {
                    var inputlimit = Number(req.query.limit)
                    if (exercisesFound.length > inputlimit) {
                      exercisesFound.length = inputlimit;
                    }
                  }
                  var totalcount = exercisesFound.length;
                  res.json({
                    username: UserFound.username,
                    count: totalcount,
                    _id: UserFound._id,
                    log: exercisesFound
                  })
                })
      }
    })
  }
})
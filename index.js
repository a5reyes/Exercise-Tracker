const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const Schema = mongoose.Schema;
const userSchema = new Schema({
  username: String
});
const User = mongoose.model("User", userSchema);
const exerciseSchema = new Schema({
  user_id: { type: String, required: true },
  description: String,
  date: Date,
  duration: Number,
});
const ExerciseUser = mongoose.model("Excerise User", exerciseSchema);

app.post("/api/users", async(req, res) => {
  const user = new User({ username: req.body.username });
  try{
    const newUser = await user.save();
    res.json(newUser);
  } catch(err){
    console.log(err);
  }
});

app.get("/api/users", async(req, res) => {
  try{
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.log(err);
  }
});

app.post("/api/users/:_id/exercises", async(req, res) => {
  try{
    const foundUser = await User.findById(req.params._id);
    if (!foundUser){
      res.send("Couldn't find user")
    } else {
      const exerciseUser = new ExerciseUser({ 
        user_id: foundUser._id,
        description: req.body.description,
        duration: req.body.duration, 
        date: req.body.date ? new Date(req.body.date) : new Date() 
      });
      const newExerciseUser = await exerciseUser.save();
      res.json({
        _id: foundUser._id,
        username: foundUser.username,
        description: newExerciseUser.description,
        duration: newExerciseUser.duration,
        date: new Date(newExerciseUser.date).toDateString()
      });
    }
  } catch(err){
    console.log(err);
  }
});

app.get("/api/users/:_id/logs", async(req, res) => {
  const { from, to, limit } = req.query;
  const id = req.params._id;
  const user = await User.findById(id);
  if(!user){
    res.send("Could not find user");
  }
  let dateObj = {}
  if (from){
    dateObj["$gte"] = new Date(from);
  }
  if (to){
    dateObj["$lte"] = new Date(to);
  }
  let filter = {
    user_id: id
  }
  if(from || to){
    filter.date = dateObj;
  }
  const exercises = await ExerciseUser.find(filter).limit(+limit ?? 500);
  const log = exercises.map(e => ({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString()
  }));
  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});


import {Record, text, bool, StableBTreeMap, Vec, Server} from "azle";
import express from 'express';
import { v4 as uuidv4 } from 'uuid';

 // defining the structure of the goal
 const Goal = Record({
    goal:text,
    description:text,
    day:text,
    location:text,
    completed:bool,
 });
 const UserGoal = Record({
    id:text,
    userGoal:Vec(Goal),
 })
type Goal = typeof Goal
type UserGoal = typeof UserGoal

 // storing all the goals
 let goalList = StableBTreeMap<text, UserGoal>(0);

 // creating a server
 export default Server(() => {
   const app = express();
   app.use(express.json());

 // Create a new goal
 app.post("/user-goals", (req, res) => {
   const userId = uuidv4() as text;
   const newUserGoal: UserGoal = { id: userId, userGoal: [] };
   goalList.insert(userId, newUserGoal);
   res.json(newUserGoal);
});

// Add a goal to a user's goal list
app.post("/user-goals/:userId/goals", (req, res) => {
   const userId = req.params.userId;
   const userGoalOpt = goalList.get(userId);
   if ("None" in userGoalOpt) {
       res.status(404).send(User with id=${userId} not found);
   } else {
       const userGoal = userGoalOpt.Some;
       const newGoal: Goal = { ...req.body, completed: false };
       userGoal.userGoal.push(newGoal);
       goalList.insert(userId, userGoal);
       res.json(userGoal);
      }
   });

   // Get all goals for a user
   app.get("/user-goals/:userId", (req, res) => {
       const userId = req.params.userId;
       const userGoalOpt = goalList.get(userId);
       if ("None" in userGoalOpt) {
           res.status(404).send(User with id=${userId} not found);
       } else {
           res.json(userGoalOpt.Some);
       }
   });

   // Update a goal
   app.put("/user-goals/:userId/goals/:index", (req, res) => {
       const userId = req.params.userId;
       const index = parseInt(req.params.index);
       const userGoalOpt = goalList.get(userId);
       if ("None" in userGoalOpt) {
         res.status(404).send(User with id=${userId} not found);
      } else {
          const userGoal = userGoalOpt.Some;
          if (index < 0 || index >= userGoal.userGoal.length) {
              res.status(400).send(Invalid goal index);
          } else {
              userGoal.userGoal[index] = { ...userGoal.userGoal[index], ...req.body };
              goalList.insert(userId, userGoal);
              res.json(userGoal);
          }
      }
  });

  // Delete a goal
  app.delete("/user-goals/:userId/goals/:index", (req, res) => {
      const userId = req.params.userId;
      const index = parseInt(req.params.index);
      const userGoalOpt = goalList.get(userId);
      if ("None" in userGoalOpt) {
         res.status(404).send(User with id=${userId} not found);
      } else {
          const userGoal = userGoalOpt.Some;
          if (index < 0 || index >= userGoal.userGoal.length) {
              res.status(400).send(Invalid goal index);
          } else {
              userGoal.userGoal.splice(index, 1);
              goalList.insert(userId, userGoal);
              res.json(userGoal);
          }
      }
  });

  // Get goals sorted by day of the week
  app.get("/user-goals/:userId/sorted", (req, res) => {
      const userId = req.params.userId;
      const userGoalOpt = goalList.get(userId);
      if ("None" in userGoalOpt) {
         res.status(404).send(User with id=${userId} not found);
        } else {
            const userGoal = userGoalOpt.Some;
            const sortedGoals = userGoal.userGoal.sort((a, b) => {
                const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                return days.indexOf(a.day) - days.indexOf(b.day);
            });
            res.json({ ...userGoal, userGoal: sortedGoals });
        }
    });

    return app.listen();
});
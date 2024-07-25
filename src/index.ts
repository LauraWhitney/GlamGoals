import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic } from 'azle';
import { v4 as uuidv4 } from 'uuid';

// Define the structure of the goal
const Goal = Record({
    id: String,
    goal: String,
    description: String,
    day: String,
    location: String,
    completed: Boolean,
});

const UserGoal = Record({
    id: String,
    userGoal: Vec(Goal),
});

type Goal = typeof Goal;
type UserGoal = typeof UserGoal;

// Store all the goals
let goalList = new StableBTreeMap<string, UserGoal>(0);

// Create a new user goal list
$update
export function createUserGoal(): Result<UserGoal, string> {
    const userId = uuidv4();
    const newUserGoal: UserGoal = { id: userId, userGoal: [] };
    goalList.insert(userId, newUserGoal);
    return Result.Ok(newUserGoal);
}

// Add a goal to a user's goal list
$update
export function addGoal(userId: string, goal: string, description: string, day: string, location: string): Result<UserGoal, string> {
    return match(goalList.get(userId), {
        Some: (userGoal) => {
            const newGoal: Goal = { 
                id: uuidv4(),
                goal, 
                description, 
                day, 
                location, 
                completed: false 
            };
            userGoal.userGoal.push(newGoal);
            goalList.insert(userId, userGoal);
            return Result.Ok(userGoal);
        },
        None: () => Result.Err(`User with id=${userId} not found`),
    });
}

// Get all goals for a user
$query
export function getUserGoals(userId: string): Result<UserGoal, string> {
    return match(goalList.get(userId), {
        Some: (userGoal) => Result.Ok(userGoal),
        None: () => Result.Err(`User with id=${userId} not found`),
    });
}

// Update a goal
$update
export function updateGoal(userId: string, goalId: string, updatedGoal: Goal): Result<UserGoal, string> {
    return match(goalList.get(userId), {
        Some: (userGoal) => {
            const index = userGoal.userGoal.findIndex(g => g.id === goalId);
            if (index === -1) {
                return Result.Err(`Goal with id=${goalId} not found`);
            }
            userGoal.userGoal[index] = { ...userGoal.userGoal[index], ...updatedGoal };
            goalList.insert(userId, userGoal);
            return Result.Ok(userGoal);
        },
        None: () => Result.Err(`User with id=${userId} not found`),
    });
}

// Delete a goal
$update
export function deleteGoal(userId: string, goalId: string): Result<UserGoal, string> {
    return match(goalList.get(userId), {
        Some: (userGoal) => {
            const index = userGoal.userGoal.findIndex(g => g.id === goalId);
            if (index === -1) {
                return Result.Err(`Goal with id=${goalId} not found`);
            }
            userGoal.userGoal.splice(index, 1);
            goalList.insert(userId, userGoal);
            return Result.Ok(userGoal);
        },
        None: () => Result.Err(`User with id=${userId} not found`),
    });
}

// Get goals sorted by day of the week
$query
export function getSortedGoals(userId: string): Result<UserGoal, string> {
    return match(goalList.get(userId), {
        Some: (userGoal) => {
            const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const sortedGoals = [...userGoal.userGoal].sort((a, b) => 
                days.indexOf(a.day) - days.indexOf(b.day)
            );
            return Result.Ok({ ...userGoal, userGoal: sortedGoals });
        },
        None: () => Result.Err(`User with id=${userId} not found`),
    });
}
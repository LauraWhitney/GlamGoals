import { $query, $update, Record, StableBTreeMap, Vec, match, Result } from 'azle';
import { v4 as uuidv4 } from 'uuid';

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

type GoalType = typeof Goal;
type UserGoalType = typeof UserGoal;

// Store all the goals
let goalList = new StableBTreeMap<string, UserGoalType>(0);

function isValidDay(day: string): boolean {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days.includes(day);
}

function logError(message: string): void {
    console.error(message); // Replace with appropriate logging mechanism
}

function getUserGoalById(userId: string): Result<UserGoalType, string> {
    return match(goalList.get(userId), {
        Some: (userGoal) => Result.Ok(userGoal),
        None: () => Result.Err(`User with id=${userId} not found`),
    });
}

// Create a new user goal list
$update
export function createUserGoal(): Result<UserGoalType, string> {
    const userId = uuidv4();
    const newUserGoal: UserGoalType = { id: userId, userGoal: [] };
    goalList.set(userId, newUserGoal);
    return Result.Ok(newUserGoal);
}

// Add a goal to a user's goal list
$update
export function addGoal(userId: string, goal: string, description: string, day: string, location: string): Result<UserGoalType, string> {
    if (!isValidDay(day)) {
        const errorMsg = `Invalid day: ${day}`;
        logError(errorMsg);
        return Result.Err(errorMsg);
    }
    return match(goalList.get(userId), {
        Some: (userGoal) => {
            const newGoal: GoalType = { 
                id: uuidv4(),
                goal, 
                description, 
                day, 
                location, 
                completed: false 
            };
            const updatedUserGoal = { ...userGoal, userGoal: [...userGoal.userGoal, newGoal] };
            goalList.set(userId, updatedUserGoal);
            return Result.Ok(updatedUserGoal);
        },
        None: () => {
            const errorMsg = `User with id=${userId} not found`;
            logError(errorMsg);
            return Result.Err(errorMsg);
        },
    });
}

// Get all goals for a user
$query
export function getUserGoals(userId: string): Result<UserGoalType, string> {
    return getUserGoalById(userId);
}

// Update a goal
$update
export function updateGoal(userId: string, goalId: string, updatedGoal: GoalType): Result<UserGoalType, string> {
    if (updatedGoal.day && !isValidDay(updatedGoal.day)) {
        const errorMsg = `Invalid day: ${updatedGoal.day}`;
        logError(errorMsg);
        return Result.Err(errorMsg);
    }
    return match(goalList.get(userId), {
        Some: (userGoal) => {
            const index = userGoal.userGoal.findIndex(g => g.id === goalId);
            if (index === -1) {
                const errorMsg = `Goal with id=${goalId} not found`;
                logError(errorMsg);
                return Result.Err(errorMsg);
            }
            const updatedGoals = userGoal.userGoal.map(g => g.id === goalId ? { ...g, ...updatedGoal } : g);
            const updatedUserGoal = { ...userGoal, userGoal: updatedGoals };
            goalList.set(userId, updatedUserGoal);
            return Result.Ok(updatedUserGoal);
        },
        None: () => {
            const errorMsg = `User with id=${userId} not found`;
            logError(errorMsg);
            return Result.Err(errorMsg);
        },
    });
}

// Delete a goal
$update
export function deleteGoal(userId: string, goalId: string): Result<UserGoalType, string> {
    return match(goalList.get(userId), {
        Some: (userGoal) => {
            const index = userGoal.userGoal.findIndex(g => g.id === goalId);
            if (index === -1) {
                const errorMsg = `Goal with id=${goalId} not found`;
                logError(errorMsg);
                return Result.Err(errorMsg);
            }
            const updatedGoals = userGoal.userGoal.filter(g => g.id !== goalId);
            const updatedUserGoal = { ...userGoal, userGoal: updatedGoals };
            goalList.set(userId, updatedUserGoal);
            return Result.Ok(updatedUserGoal);
        },
        None: () => {
            const errorMsg = `User with id=${userId} not found`;
            logError(errorMsg);
            return Result.Err(errorMsg);
        },
    });
}

// Get goals sorted by day of the week
$query
export function getSortedGoals(userId: string): Result<UserGoalType, string> {
    return match(goalList.get(userId), {
        Some: (userGoal) => {
            const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const sortedGoals = [...userGoal.userGoal].sort((a, b) => 
                days.indexOf(a.day) - days.indexOf(b.day)
            );
            return Result.Ok({ ...userGoal, userGoal: sortedGoals });
        },
        None: () => {
            const errorMsg = `User with id=${userId} not found`;
            logError(errorMsg);
            return Result.Err(errorMsg);
        },
    });
}

// Update the completion status of a goal
$update
export function updateGoalCompletion(userId: string, goalId: string, completed: boolean): Result<UserGoalType, string> {
    return match(goalList.get(userId), {
        Some: (userGoal) => {
            const index = userGoal.userGoal.findIndex(g => g.id === goalId);
            if (index === -1) {
                const errorMsg = `Goal with id=${goalId} not found`;
                logError(errorMsg);
                return Result.Err(errorMsg);
            }
            const updatedGoals = userGoal.userGoal.map(g => g.id === goalId ? { ...g, completed } : g);
            const updatedUserGoal = { ...userGoal, userGoal: updatedGoals };
            goalList.set(userId, updatedUserGoal);
            return Result.Ok(updatedUserGoal);
        },
        None: () => {
            const errorMsg = `User with id=${userId} not found`;
            logError(errorMsg);
            return Result.Err(errorMsg);
        },
    });
}

import {
  FamilyMember,
  Appointment,
  Chore,
  Recipe,
  MealPlanDay,
  GroceryItem,
  PinnedNote,
  Reward,
} from '../../types';

export interface CopilotFamilyData {
  familyName: string;
  members: FamilyMember[];
  appointments: Appointment[];
  chores: Chore[];
  recipes: Recipe[];
  mealPlans: MealPlanDay[];
  groceries: GroceryItem[];
  notes?: PinnedNote[];
  rewards?: Reward[];
  loggedInMember?: FamilyMember | null;
  currentMemberId?: string | 'all' | null;
}

export function normalizeCopilotData(data?: Partial<CopilotFamilyData>): CopilotFamilyData {
  return {
    familyName: data?.familyName || 'Familie',
    members: Array.isArray(data?.members) ? data.members.filter(Boolean) : [],
    appointments: Array.isArray(data?.appointments) ? data.appointments.filter(Boolean) : [],
    chores: Array.isArray(data?.chores) ? data.chores.filter(Boolean) : [],
    recipes: Array.isArray(data?.recipes) ? data.recipes.filter(Boolean) : [],
    mealPlans: Array.isArray(data?.mealPlans) ? data.mealPlans.filter(Boolean) : [],
    groceries: Array.isArray(data?.groceries) ? data.groceries.filter(Boolean) : [],
    notes: Array.isArray(data?.notes) ? data.notes.filter(Boolean) : [],
    rewards: Array.isArray(data?.rewards) ? data.rewards.filter(Boolean) : [],
    loggedInMember: data?.loggedInMember || null,
    currentMemberId: data?.currentMemberId || 'all',
  };
}

export interface CopilotAction {
  type:
    | 'SCHEDULE_CHORE'
    | 'ADD_CHORE'
    | 'COMPLETE_CHORE'
    | 'DELETE_CHORE'
    | 'ADD_GROCERY'
    | 'CHECK_GROCERY'
    | 'DELETE_GROCERY'
    | 'CLEAR_CHECKED_GROCERIES'
    | 'ADD_ALWAYS_IN_STOCK'
    | 'SET_MEAL'
    | 'CLEAR_MEAL'
    | 'ADD_RECIPE_TO_GROCERIES'
    | 'ADD_RECIPE'
    | 'FAVORITE_RECIPE'
    | 'ADD_APPOINTMENT'
    | 'DELETE_APPOINTMENT'
    | 'ADD_NOTE'
    | 'DELETE_NOTE'
    | 'UPDATE_CHILD_DETAILS'
    | 'AWARD_STARS'
    | 'ADD_REWARD'
    | 'CLAIM_REWARD'
    | 'CLEAN_SHOPPING_LIST'
    | 'SET_MORNING_BRIEFING'
    | 'NAVIGATE'
    | 'SAVE_MEMORY'
    | 'DELETE_MEMORY';
  payload: any;
  description: string;
  autoExecuted?: boolean;
}

export interface CopilotResponse {
  text: string;
  actions?: CopilotAction[];
  source: 'ai' | 'local';
}

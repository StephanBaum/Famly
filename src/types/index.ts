export interface CustomInfoField {
  id: string;
  label: string;
  value: string;
  category?: 'sizes' | 'health' | 'school' | 'other';
}

export interface ChildDetails {
  clothingSize?: string;
  shoeSize?: string;
  pantsSize?: string;
  doctorName?: string;
  doctorPhone?: string;
  doctorAddress?: string;
  dentistName?: string;
  dentistPhone?: string;
  dentistAddress?: string;
  allergies?: string;
  bloodType?: string;
  schoolName?: string;
  grade?: string;
  emergencyContact?: string;
  customFields?: CustomInfoField[];
}

export interface FamilyMember {
  id: string;
  name: string;
  role: string;
  isChild?: boolean; // True for children/kids
  avatar: string; // URL or emoji
  color: string; // Tailwind color class or hex
  bgLight: string;
  borderClass: string;
  textClass: string;
  birthday?: string;
  notes?: string;
  pin?: string; // 4-digit login passcode
  childDetails?: ChildDetails;
  customFields?: CustomInfoField[]; // Custom fields for adults or kids
}

export type AppointmentCategory = 'school' | 'health' | 'sports' | 'family' | 'work' | 'social';

export interface Appointment {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // "14:30" or "All Day"
  durationMinutes?: number;
  location?: string;
  memberIds: string[]; // which family members are attending
  category: AppointmentCategory;
  notes?: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface Ingredient {
  name: string;
  amount: string;
  category: GroceryCategory;
}

export interface Recipe {
  id: string;
  title: string;
  prepTime: string;
  servings: number;
  category: 'quick' | 'comfort' | 'healthy' | 'baking' | 'family-favorite';
  imageUrl: string;
  ingredients: Ingredient[];
  notes?: string;
  instructions?: string[];
  tags?: string[];
  sourceUrl?: string;
  sourceType?: 'link' | 'photo' | 'describe' | 'manual';
  isFavorite?: boolean;
  theme?: 'healthy' | 'fresh' | 'warming' | 'quick' | 'kids';
  mainProtein?: 'fish' | 'poultry' | 'meat' | 'vegetarian' | 'pasta';
  estimatedCost?: number;
  synergyBase?: 'rice' | 'potatoes' | 'veggies' | 'pasta' | 'chicken';
  synergyRole?: 'cook-extra' | 'use-leftovers';
  synergyTip?: string;
  timeSavedMinutes?: number;
}

export interface MealPlanDay {
  date: string; // YYYY-MM-DD
  breakfast?: { title: string; recipeId?: string; chefId?: string };
  lunch?: { title: string; recipeId?: string; chefId?: string };
  dinner?: { title: string; recipeId?: string; chefId?: string };
}

export interface PhotoItem {
  id: string;
  imageUrl: string;
  caption?: string;
  uploadedByMemberId: string;
  uploadedAt: string;
  likes: string[]; // memberIds
}

export interface GuestReaction {
  id: string;
  author: string; // e.g. "Grandma Elena", "Uncle Marc"
  message: string;
  emoji: string;
  timestamp: string;
}

export interface GalleryAlbum {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  coverPhotoUrl: string;
  category: 'vacation' | 'birthday' | 'sports' | 'everyday' | 'milestones' | 'holidays';
  createdByMemberId: string;
  photos: PhotoItem[];
  isPublicShared: boolean;
  shareCode: string;
  guestReactions?: GuestReaction[];
}

export interface PhotoMemory {
  id: string;
  title: string;
  caption: string;
  imageUrl: string;
  date: string; // YYYY-MM-DD
  uploadedByMemberId: string;
  taggedMemberIds: string[];
  likes: string[]; // memberIds who liked
  album: string; // e.g. "Summer Holiday", "Weekend", "Milestones", "Everyday"
}

export type GroceryCategory = 'produce' | 'dairy' | 'bakery' | 'meat' | 'pantry' | 'household' | 'snacks' | 'drugstore' | 'pharmacy';

export interface StoreDefinition {
  id: string;
  name: string;
  icon: string;
  badgeColor: string;
  borderColor: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  amount?: string;
  store: string; // e.g. "Rewe", "dm", "Bakery", "Pharmacy"
  category?: GroceryCategory;
  checked: boolean;
  addedByMemberId?: string;
  targetDate?: string; // YYYY-MM-DD when the meal/dish is planned
  recipeTitle?: string; // e.g. "Honig-Lachs mit Brokkoli"
  recipeId?: string; // ID of the source recipe (e.g. "r1", "r_...")
  mealSlot?: 'dinner' | 'lunch' | 'breakfast';
  isPerishable?: boolean; // true for fresh fish, poultry, minced meat, delicate greens, fresh berries
}

export type ChoreFrequency = 'once' | 'daily' | '2x_weekly' | 'weekly' | 'biweekly' | 'monthly';

export interface Chore {
  id: string;
  title: string;
  assignedMemberId?: string; // backwards compatibility / primary assignee
  assignedMemberIds?: string[]; // Empty/undefined = "Wer zuerst kommt / Offen für alle"
  completedByMemberId?: string; // Which member completed it and was credited the stars
  completedAt?: string;
  frequency: ChoreFrequency;
  completed: boolean;
  stars: number;
  dueDate?: string;
}

export const isChoreRelevantForMember = (chore: Chore, memberId: string | 'all'): boolean => {
  if (memberId === 'all') return true;
  const ids = chore.assignedMemberIds && chore.assignedMemberIds.length > 0
    ? chore.assignedMemberIds
    : (chore.assignedMemberId ? [chore.assignedMemberId] : []);
  if (ids.length === 0) return true; // Open to everyone / Wer zuerst kommt
  return ids.includes(memberId);
};

export interface PinnedNote {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  tag: 'urgent' | 'info' | 'fun' | 'wifi';
  authorMemberId: string;
  createdAt: string;
}

export interface Reward {
  id: string;
  title: string;
  icon: string;
  starsCost: number;
  description?: string;
  targetMemberId?: string; // specific child or undefined for all
}

export interface RewardClaim {
  id: string;
  rewardId: string;
  rewardTitle: string;
  rewardIcon: string;
  memberId: string;
  starsSpent: number;
  claimedAt: string; // ISO date string
  status: 'pending' | 'approved' | 'redeemed' | 'rejected';
}


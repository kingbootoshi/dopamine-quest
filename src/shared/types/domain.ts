/**
 * Domain types shared between main and renderer processes
 */

/**
 * @interface Task
 * @description Represents a user's task with XP reward
 */
export interface Task {
  id: string;
  title: string;
  category: string;
  xp: number;
  createdAt: string;
}

/**
 * @interface Profile
 * @description Represents a user's profile information
 */
export interface Profile {
  name: string;
  lifeStage: string;
  goals: string;
}

/**
 * @interface XpRange
 * @description Defines the structure for an XP range, including category and min/max values
 */
export interface XpRange {
  category: string;
  min_xp: number;
  max_xp: number;
}
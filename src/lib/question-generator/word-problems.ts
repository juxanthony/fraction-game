/**
 * Realistic Mathematics Education (RME) word-problem templates.
 * Every template references everyday Malaysian contexts: food, shopping,
 * sports, school activities, travel and daily life. The localized text for
 * each template lives in the locale files under the key `wp.<id>`.
 */

export interface WordProblemTemplate {
  id: string;
  op: "add" | "sub";
  context: "food" | "shopping" | "sports" | "school" | "travel" | "daily";
  /** Subtraction from one whole (e.g. "how much of the book is left?"). */
  fromWhole?: boolean;
}

export const WORD_PROBLEM_TEMPLATES: WordProblemTemplate[] = [
  { id: "cake", op: "add", context: "food" },
  { id: "nasiLemak", op: "add", context: "food" },
  { id: "ribbon", op: "add", context: "shopping" },
  { id: "jog", op: "add", context: "sports" },
  { id: "homework", op: "add", context: "school" },
  { id: "recycling", op: "add", context: "school" },
  { id: "pizza", op: "sub", context: "food" },
  { id: "juice", op: "sub", context: "daily" },
  { id: "sugar", op: "sub", context: "shopping" },
  { id: "journey", op: "sub", context: "travel" },
  { id: "reading", op: "sub", context: "school", fromWhole: true },
  { id: "garden", op: "sub", context: "daily", fromWhole: true },
];

/** Common Malaysian pupil names (Chinese, Malay, Indian) for story contexts. */
export const PUPIL_NAMES = [
  "Mei Ling",
  "Wei Jie",
  "Xin Yi",
  "Jia Hao",
  "Ahmad",
  "Siti",
  "Aisyah",
  "Farid",
  "Kumar",
  "Devi",
  "Arjun",
  "Priya",
];

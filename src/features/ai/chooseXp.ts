import OpenAI from 'openpipe/openai';
import type { ChatCompletionTool, ChatCompletionMessageParam } from 'openai/resources';
import dotenv from 'dotenv';
import { getLogger } from '../../core/logger';
import type { Profile, XpRange } from '../../shared/types/domain';

dotenv.config();

// Create a logger instance specific to the AI module
const logger = getLogger('ai');

/**
 * @const {Record<string, [number, number]>} DEFAULT_RANGES
 * @description Default XP ranges categorized by size (tiny, small, medium, large, huge).
 */
const DEFAULT_RANGES: Record<string, [number, number]> = {
  tiny: [1, 5],
  small: [6, 15],
  medium: [16, 30],
  large: [31, 60],
  huge: [61, 100],
};

// Initialize the OpenAI client with OpenRouter and OpenPipe configurations
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || 'missing-api-key', // Use OpenRouter API key with fallback
  baseURL: 'https://openrouter.ai/api/v1', // Point to OpenRouter endpoint
  // Configure OpenPipe (optional, for logging/analytics)
  openpipe: process.env.OPENPIPE_API_KEY ? {
    apiKey: process.env.OPENPIPE_API_KEY, // Only include if the key is available
  } : undefined,
});

/**
 * @async
 * @function callOpenRouter
 * @description Makes a call to the OpenRouter API via the OpenPipe SDK to determine an XP range for a task.
 * @param {ChatCompletionMessageParam[]} messages - The array of messages to send to the AI model.
 * @returns {Promise<XpRange | null>} A promise that resolves to the determined XP range or null if unsuccessful.
 * @throws {Error} Throws an error if the API call fails.
 */
async function callOpenRouter(messages: ChatCompletionMessageParam[]): Promise<XpRange | null> {
  // Define the tool for the AI to use for picking the XP range
  const tools: ChatCompletionTool[] = [
    {
      type: 'function',
      function: {
        name: 'pick_xp_range',
        description:
          'Pick an XP range for the provided user task based on the user profile and task significance',
        parameters: {
          type: 'object',
          properties: {
            internal_thoughts: {
              type: 'string',
              description: "Based on the user's profile and their goals, reason out what XP range that task they just entered deserves"
            },
            category: {
              type: 'string',
              enum: ['tiny', 'small', 'medium', 'large', 'huge'],
            },
            min_xp: { type: 'integer', minimum: 1 },
            max_xp: { type: 'integer', minimum: 1 },
          },
          required: ['internal_thoughts', 'category', 'min_xp', 'max_xp'],
        },
      },
    },
  ];

  try {
    logger.debug('Calling OpenRouter with messages:', messages);
    // Make the chat completion request to OpenRouter via the SDK
    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-4o-mini', // Specify the model to use
      messages, // Pass the conversation messages
      tools, // Provide the available tools
      tool_choice: 'required', // Force the model to use the specified tool
      // Optional metadata for tracking/analytics via OpenPipe
      metadata: {
        agent: 'xp_giver',
        user: 'test', // TODO: Replace with actual user identifier if available
      },
      // Enable data collection via OpenPipe (defaults to true)
      // store: true,
    });

    // Log the raw response before parsing
    logger.debug('Received raw response from OpenRouter:', completion.choices[0]?.message);

    // Extract the tool call information from the response
    const toolCalls = completion.choices[0]?.message?.tool_calls;
    if (toolCalls?.length) {
      const args = toolCalls[0].function.arguments;
      try {
        // Parse the arguments, which might be a string or an object
        return typeof args === 'string' ? JSON.parse(args) : args;
      } catch (parseError) {
        console.error('Error parsing tool call arguments:', parseError);
        logger.error('Error parsing tool call arguments:', { arguments: args, error: parseError });
        return null; // Return null if parsing fails
      }
    }

    // Fallback: Attempt to parse raw content if no tool call is present (shouldn't happen with tool_choice: 'required')
    try {
      const raw = completion.choices[0]?.message?.content;
      if (raw) return JSON.parse(raw);
    } catch {
      /* ignore potential parsing errors for raw content */
    }

    console.warn('No valid tool call or parsable content found in response.');
    logger.warn('No valid tool call or parsable content found in OpenRouter response.', { response: completion.choices[0]?.message });
    return null; // Return null if no valid response structure is found
  } catch (error) {
    console.error('Error calling OpenRouter via OpenPipe SDK:', error);
    logger.error('Error calling OpenRouter via OpenPipe SDK:', { error });
    // Re-throw the error to be caught by the calling function (chooseXp) for retry logic
    throw error;
  }
}

/**
 * @async
 * @function chooseXp
 * @description Determines the XP category and value for a given task title and user profile.
 *              Attempts to call the AI model up to 3 times with exponential backoff on failure.
 *              Falls back to a random default range if all attempts fail.
 * @param {string} title - The title or description of the task.
 * @param {Profile | null} profile - The user's profile information, or null if not available.
 * @returns {Promise<{ category: string; xp: number }>} A promise resolving to the chosen category and XP amount.
 */
export async function chooseXp(
  title: string,
  profile: Profile | null,
): Promise<{ category: string; xp: number }> {
  // Log the input task details that trigger the AI
  logger.info(`Choosing XP for task: "${title}"`, { profile });

  // Retry mechanism with exponential backoff
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      // Construct the system prompt instructing the AI with the user profile included
      const systemPrompt = `
You are QuestXP, a gamification engine for personal productivity.
Based on the user's profile and the provided task, decide how significant the task is.
Respond **only** by calling the "pick_xp_range" function.

${profile ? `USER PROFILE:
Name: ${profile.name}
Life stage: ${profile.lifeStage}
Goals: ${profile.goals}` : 'User profile not provided.'}`;

      // Assemble the messages array for the API call
      const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Task: "${title}"` }, // The specific task to evaluate
      ];

      // Call the AI model to get the XP range
      const range = await callOpenRouter(messages);

      // Process the response if valid
      if (range && range.min_xp && range.max_xp && range.min_xp <= range.max_xp) {
        // Calculate a random XP value within the determined range
        const xp =
          Math.floor(Math.random() * (range.max_xp - range.min_xp + 1)) +
          range.min_xp;
        // Return the category and calculated XP
        return { category: range.category, xp };
      } else {
        // Log a warning if the range is invalid (e.g., min_xp > max_xp)
        console.warn('Received invalid range from AI:', range);
        logger.warn('Received invalid or incomplete range from AI', { range });
        // Continue to the next attempt (or fallback if this was the last attempt)
      }
    } catch (error) {
      // Log the error during the attempt
      console.error(`Attempt ${attempt + 1} failed:`, error);
      logger.error(`Attempt ${attempt + 1} to call OpenRouter failed`, { error });
      // Wait before retrying, increasing the delay each time
      if (attempt < 2) { // Only wait if there are more attempts left
         await new Promise((r) => setTimeout(r, (attempt + 1) * 1000)); // Increased backoff time
      }
    }
  }

  // Ultimate fallback: If all attempts fail, use a random default range
  console.warn('All attempts to call AI failed. Using default fallback XP range.');
  logger.warn('All attempts to call AI failed. Using default fallback XP range.');
  const [category, [min, max]] = Object.entries(DEFAULT_RANGES)[
    Math.floor(Math.random() * Object.keys(DEFAULT_RANGES).length)
  ] as [string, [number, number]];
  const xp = Math.floor(Math.random() * (max - min + 1)) + min;
  return { category, xp };
}
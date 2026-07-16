/**
 * aiApi.js — AI Chat API service
 * Calls the real POST /chat backend endpoint which uses the authenticated
 * user's actual dashboard metrics, recommendations, and model data.
 * No fake/mock responses.
 */
import axiosClient from './axios.js';

/**
 * Send a message to the AI Marketing Consultant.
 * @param {string} message - The user's question
 * @param {object} context - Optional context (unused — backend fetches live data)
 * @param {Array} history - Previous messages [{role, text}]
 * @returns {{ reply: string, suggestedQuestions: string[] }}
 */
export async function sendAIChat(message, context = {}, history = []) {
  const res = await axiosClient.post('/chat', {
    message
  });

  return {
    reply: res.data.reply || res.data.message || '',
    suggestedQuestions: res.data.suggested_questions || []
  };
}

export async function getChatMessages() {
  const res = await axiosClient.get('/chat/messages');
  return res.data;
}

export async function clearChatMessages() {
  const res = await axiosClient.delete('/chat/messages');
  return res.data;
}

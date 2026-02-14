import type { ChatMessage } from "./types.ts";

export function formatTranscript(messages: ChatMessage[]): string {
  if (messages.length === 0) return "";

  const date = messages[0].timestamp.slice(0, 10);
  const usernames = [...new Set(messages.map((m) => m.username))];

  const lines = messages.map((m) => `**${m.username}:** ${m.message}`);

  return [
    "Here is the full meeting transcript:",
    "",
    "---",
    "",
    "## Meeting Chat",
    "",
    `**Date:** ${date}`,
    `**Attendees:** ${usernames.join(", ")}`,
    "",
    ...lines,
    "",
    "---",
  ].join("\n");
}

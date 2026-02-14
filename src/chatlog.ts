import { appendFile, readFile } from "node:fs/promises";
import type { ChatMessage } from "./types.ts";

const CHATLOG_PATH = new URL("../output/chat.jsonl", import.meta.url);

export async function appendChatMessage(msg: ChatMessage): Promise<void> {
  await appendFile(CHATLOG_PATH, JSON.stringify(msg) + "\n");
}

export async function readChatMessages(): Promise<ChatMessage[]> {
  let raw: string;
  try {
    raw = await readFile(CHATLOG_PATH, "utf-8");
  } catch {
    return [];
  }
  return raw
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as ChatMessage);
}

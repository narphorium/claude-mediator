import { readFile, writeFile } from "node:fs/promises";
import type { InboxEntry } from "./types.ts";

export async function pushToInbox(
  inboxPath: string,
  entry: InboxEntry,
): Promise<void> {
  let inbox: InboxEntry[] = [];
  try {
    const raw = await readFile(inboxPath, "utf-8");
    inbox = JSON.parse(raw) as InboxEntry[];
  } catch {
    // File doesn't exist or is empty — start fresh
  }

  inbox.push(entry);
  await writeFile(inboxPath, JSON.stringify(inbox, null, 2) + "\n");
}

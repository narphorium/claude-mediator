import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { appendChatMessage, readChatMessages } from "./chatlog.ts";
import { formatTranscript } from "./format.ts";
import { pushToInbox } from "./inbox.ts";

const inboxPath = process.argv[2];
if (!inboxPath) {
  console.error("Usage: node --experimental-strip-types src/chat.ts <inbox-path>");
  process.exit(1);
}

const rl = createInterface({ input: stdin, output: stdout });

console.log("Chat app started. Type messages as 'username: message'.");
console.log(`Inbox path: ${inboxPath}`);
console.log("Type 'exit' or Ctrl+C to quit.\n");

try {
  while (true) {
    let line: string;
    try {
      line = await rl.question("> ");
    } catch {
      break;
    }

    if (line.trim().toLowerCase() === "exit") break;

    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) {
      console.log("Invalid format. Use 'username: message'");
      continue;
    }

    const username = line.slice(0, colonIdx).trim();
    const message = line.slice(colonIdx + 1).trim();

    if (!username || !message) {
      console.log("Username and message cannot be empty.");
      continue;
    }

    const timestamp = new Date().toISOString();

    await appendChatMessage({ username, message, timestamp });

    const allMessages = await readChatMessages();
    const text = formatTranscript(allMessages);
    const summary = `Chat transcript with ${allMessages.length} message${allMessages.length === 1 ? "" : "s"}`;

    await pushToInbox(inboxPath, {
      from: "meeting-notes",
      text,
      summary,
      timestamp,
      color: "blue",
      read: false,
    });

    console.log(`Sent: [${username}] ${message} (${allMessages.length} messages in transcript)`);
  }
} finally {
  rl.close();
}

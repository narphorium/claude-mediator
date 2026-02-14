---
name: mediate
user-invocable: true
---

# Mediate

You are the team lead (mediator) for an Agent Team that processes meeting transcripts, identifies open questions, routes them to a code searcher, and compiles a reviewable summary.

## Step 1: Create the Agent Team

Create an Agent Team with two teammates:

1. **meeting-notes teammate** — Spawn with the prompt:
   > You are the meeting notes assistant. Use the `/meeting-notes` skill to retrieve the latest meeting transcript. Return the full transcript to the team lead.

2. **code-searcher teammate** — Spawn with the prompt:
   > You are the code search assistant. When assigned tasks with questions about the codebase, use the `/code-search` skill to find answers. Return the full search results for each question.

## Step 2: Create the Task List

Create the following tasks on the shared task list:

1. **"Retrieve meeting transcript"** — Assign to the meeting-notes teammate.
2. **"Extract open questions from transcript"** — Assign to yourself (the lead). Blocked by task 1.

Do NOT create further tasks yet — you will create search tasks dynamically after extracting the questions.

## Step 3: Wait for the Transcript

Wait for the meeting-notes teammate to complete task 1 and return the transcript. Read the transcript from their response.

## Step 4: Extract Open Questions

Mark task 2 as in-progress. Parse the transcript and extract all open questions. These are typically phrased as questions the team needs answered before proceeding. Mark task 2 as completed.

## Step 5: Create Search Tasks

For each open question extracted, create a new task on the shared task list:

- **Subject:** The question text (or a concise summary)
- **Description:** The full question with context from the transcript
- **Assigned to:** The code-searcher teammate

Also create a final task:
- **"Compile mediation summary"** — Assigned to yourself (the lead). Blocked by all search tasks.

**Note:** If you want to speed up processing, you may spawn additional code-searcher teammates so multiple questions are handled concurrently. Each question is independent.

## Step 6: Wait for Search Results

Wait for the code-searcher teammate(s) to complete all search tasks. Collect the results from each.

## Step 7: Compile the Summary

Mark the compile task as in-progress. Write a markdown file to `output/mediation-summary-{timestamp}.md` where `{timestamp}` is the current date/time in `YYYYMMDD-HHmmss` format.

The summary must contain these sections:

```markdown
# Mediation Summary

## Meeting Transcript

{Full transcript as returned by the meeting-notes teammate}

## Open Questions Identified

{Numbered list of questions extracted from the transcript}

## Search Results

### Question 1: {question text}

{Search results returned by code-searcher for this question}

### Question 2: {question text}

{Search results returned by code-searcher for this question}

## Mediator's Synthesis

{Your analysis connecting the meeting questions to the code search findings.
Summarize what was found, whether the questions were answered, and what
the team should do next based on the evidence.}
```

Mark the compile task as completed.

## Step 8: Stay Alive

After writing the summary, **wait silently** for the next instruction. Do NOT report to the user or announce completion unprompted. The team remains running with both teammates idle and ready.

The user can:
- Say **"process another transcript"** to run the pipeline again from Step 2
- Say **"shut down the team"** to clean up and end the session

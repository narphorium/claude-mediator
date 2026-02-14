# Claude Mediator

An Agent Team where a team lead (mediator) orchestrates between specialized teammates to process meeting transcripts, identify open questions, search the codebase for answers, and compile everything into a reviewable summary.

## Team Structure

| Role | Agent | Skill |
|------|-------|-------|
| **Team Lead (Mediator)** | Orchestrates the workflow, extracts questions, compiles final summary | `/mediate` |
| **Meeting Notes Teammate** | Retrieves meeting transcripts | `/meeting-notes` |
| **Code Searcher Teammate** | Searches the codebase to answer open questions | `/code-search` |

## Workflow

1. The mediator spawns the meeting-notes teammate to retrieve the latest transcript
2. The mediator extracts open questions from the transcript
3. The mediator creates search tasks for each question and assigns them to the code-searcher teammate
4. The code-searcher uses `/code-search` to find answers
5. The mediator compiles all results into `output/mediation-summary-{timestamp}.md`
6. The team stays alive, waiting for the next transcript or a shutdown command

## Teammate Instructions

- **Meeting Notes teammate:** Use the `/meeting-notes` skill to retrieve transcripts
- **Code Searcher teammate:** Use the `/code-search` skill to find answers to assigned questions

## Output

Summaries are written to the `output/` directory with timestamped filenames. Each summary contains:

- Meeting Transcript
- Open Questions Identified
- Search Results (per question)
- Mediator's Synthesis

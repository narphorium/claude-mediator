# Mediation Summary

## Meeting Transcript

### Architecture Review — Batch Request Processing

**Date:** 2026-02-14
**Attendees:** Sarah (Tech Lead), Marcus (Backend), Priya (Platform), James (DevOps)

**Sarah:** Let's talk about the batch request processing redesign. We're seeing timeouts on large payloads and the current sequential approach doesn't scale.

**Marcus:** I've been looking at this. The main bottleneck is that we process each request in the batch one at a time. A 500-item batch takes 45 seconds on average. We need to parallelize.

**Priya:** Agreed. I think we should also introduce a middleware pipeline for the batch processor. Right now validation, auth checks, and rate limiting are all tangled together in one function. If we had a clean middleware chain, each concern could be isolated and tested independently.

**James:** From the ops side, I'd love to see better observability baked into this. If we go with a middleware approach, we could add logging and metrics as middleware stages rather than sprinkling them throughout the code.

**Sarah:** That's a good point. So the proposal is: refactor batch processing to use a middleware pipeline, and parallelize the actual request execution within each batch. Marcus, can you estimate the work?

**Marcus:** The parallelization piece is straightforward — we fan out the requests, process concurrently with a configurable concurrency limit, and aggregate results. Maybe 3-4 days. The middleware refactor depends on whether we already have patterns for this.

**Priya:** I think I've seen something in the core module but I'm not sure if it's generic enough for our use case.

**Sarah:** Let's find out before we commit to a timeline. We have two open questions we need answered:

1. **Does our codebase already have middleware patterns we should reuse, or do we need to build this from scratch?**
2. **Are there any existing batch processing utilities that handle fan-out and result aggregation?**

**Marcus:** If we already have infrastructure for both, this could be a 2-day task instead of a week.

**Sarah:** Exactly. Let's get answers to those questions and reconvene tomorrow.

## Open Questions Identified

1. Does our codebase already have middleware patterns we should reuse, or do we need to build this from scratch?
2. Are there any existing batch processing utilities that handle fan-out and result aggregation?

## Search Results

### Question 1: Does our codebase already have middleware patterns we should reuse, or do we need to build this from scratch?

**Yes, the codebase has a well-established middleware pattern.** Three relevant files were found:

- **`src/core/pipeline.ts`** — A generic `Pipeline<T>` class with a `Middleware<T>` interface. Supports typed contexts, composable middleware stages, and sequential `next()` chaining. This is the foundation.

- **`src/auth/auth-middleware.ts`** — An `AuthMiddleware` implementation that validates authorization tokens and attaches user context. Demonstrates the pattern in production use.

- **`src/validation/request-validator.ts`** — A `RequestValidator` middleware that performs schema-based request validation. Another production implementation of the same `Middleware<T>` interface.

New middleware stages (logging, metrics, rate limiting) can be added by implementing the `Middleware<T>` interface and calling `pipeline.use()`. No need to build from scratch.

### Question 2: Are there any existing batch processing utilities that handle fan-out and result aggregation?

**Yes, the codebase has an existing batch processing utility.** One key file was found:

- **`src/utils/batch-processor.ts`** — A generic `BatchProcessor<TInput, TOutput>` class that provides:
  - **Configurable concurrency** — controls how many items process in parallel
  - **Per-item timeouts** — prevents individual items from blocking the batch
  - **Result aggregation** — separates results into succeeded/failed buckets using `Promise.allSettled`
  - **Chunked execution** — processes items in controlled batches rather than all at once

This can be used directly for the batch request processing redesign. It can also be combined with the `Pipeline<T>` middleware chain so that each batch item passes through a middleware pipeline before execution.

## Mediator's Synthesis

Both open questions from the meeting have clear, affirmative answers: **the codebase already has the infrastructure needed for the batch request processing redesign.**

### Key Findings

1. **Middleware pipeline exists and is production-ready.** The `Pipeline<T>` class in `src/core/pipeline.ts` provides exactly the composable middleware architecture Priya and James described. Auth and validation middleware are already implemented against this interface, proving it works. Adding logging, metrics, and rate limiting middleware is a matter of writing new `Middleware<T>` implementations — the pipeline infrastructure is already there.

2. **Batch processing with fan-out exists.** The `BatchProcessor` in `src/utils/batch-processor.ts` already handles the concurrency-limited parallel execution and result aggregation that Marcus described. It supports configurable concurrency limits and per-item timeouts, which directly addresses the 45-second timeout issue on large payloads.

3. **The two can be combined.** The `Pipeline<T>` can handle per-item processing (validation, auth, rate limiting) while the `BatchProcessor` handles fan-out across items. This is a natural composition: build a middleware pipeline for each request's processing stages, then use `BatchProcessor` to run those pipelines concurrently across the batch.

### Recommendation

Marcus's optimistic estimate of 2 days (rather than a week) appears justified. The team should:

1. Create a `BatchRequestContext` type that works with the existing `Middleware<T>` interface
2. Implement new middleware stages for logging, metrics, and rate limiting
3. Wire the `Pipeline<T>` as the handler function passed to `BatchProcessor`
4. Configure concurrency limits and timeouts appropriate for production load

No new infrastructure needs to be built — this is primarily a wiring and integration task.

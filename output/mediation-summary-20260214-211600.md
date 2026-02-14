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

**Answer: Yes, the codebase already has middleware infrastructure. No need to build from scratch.**

**Findings:**

- **`src/core/pipeline.ts` — Generic Pipeline with Middleware Interface.** A generic `Pipeline<T>` class already exists in core (this is likely what Priya remembered). It supports typed contexts and composable middleware stages via a `Middleware<T>` interface with `name` and `execute(context, next)` methods. This is a classic chain-of-responsibility / middleware pattern.

- **`src/auth/auth-middleware.ts` — AuthMiddleware Implementation.** An existing auth middleware that implements `Middleware<RequestContext>`. Validates auth tokens and attaches user context. Already plugs into the Pipeline class.

- **`src/validation/request-validator.ts` — RequestValidator Middleware.** Schema-based request validation as a middleware stage. Also implements the same `Middleware<RequestContext>` interface.

The generic `Pipeline<T>` can be reused directly. New stages (logging, metrics, rate limiting) just need to implement the `Middleware<T>` interface. Two existing implementations (`AuthMiddleware`, `RequestValidator`) demonstrate the pattern.

### Question 2: Are there any existing batch processing utilities that handle fan-out and result aggregation?

**Answer: Yes, there is an existing `BatchProcessor` utility that directly addresses this need.**

**Findings:**

- **`src/utils/batch-processor.ts` — BatchProcessor with Fan-Out/Aggregation.** A generic `BatchProcessor<TInput, TOutput>` class already exists with exactly the capabilities the team needs:
  - **Configurable concurrency** — constructor accepts `{ concurrency: number; timeout: number }`
  - **Fan-out via chunked `Promise.allSettled`** — items are split into chunks matching the concurrency limit and processed in parallel
  - **Per-item timeouts** — via `executeWithTimeout` method
  - **Result aggregation** — returns a `BatchResult<TOutput>` with separate `succeeded` and `failed` arrays
  - **Error isolation** — uses `Promise.allSettled` so one failed item doesn't abort the batch

- The `Pipeline<T>` from `src/core/pipeline.ts` can be composed with the `BatchProcessor`. A middleware pipeline could handle validation/auth/rate-limiting before items are fanned out through the batch processor.

For the 45-second sequential bottleneck, tuning the `concurrency` option (e.g., to 10-50) should significantly reduce processing time.

## Mediator's Synthesis

Both open questions from the meeting have been definitively answered — the codebase already has the infrastructure the team needs.

**Key findings:**

1. **Middleware pipeline exists and is reusable.** The `Pipeline<T>` class in `src/core/pipeline.ts` provides a generic, typed middleware pattern with `use()` composition and `execute()` dispatch. Two production implementations (`AuthMiddleware`, `RequestValidator`) already demonstrate the pattern. Priya's recollection about the core module was correct.

2. **Batch processing with fan-out exists and is reusable.** The `BatchProcessor<TInput, TOutput>` in `src/utils/batch-processor.ts` already handles configurable concurrency, per-item timeouts, and succeeded/failed result aggregation — exactly what Marcus described needing.

**Impact on timeline:** Marcus estimated 3-4 days for parallelization and noted the middleware refactor "depends on whether we already have patterns." Since both exist, his optimistic estimate of a 2-day task is realistic. The work reduces to:

- Composing the existing `Pipeline<T>` with new middleware stages for logging, metrics, and rate limiting (implementing the `Middleware<T>` interface)
- Wiring the existing `BatchProcessor` into the batch request handler with appropriate concurrency settings
- Adding observability middleware stages as James requested

**Recommended next steps for the team:**

1. Marcus should review `src/core/pipeline.ts` and `src/utils/batch-processor.ts` to confirm they meet requirements
2. Create new middleware implementations for logging, metrics, and rate limiting using the existing `Middleware<T>` interface
3. Compose the pipeline so that middleware runs per-request, then fan out through `BatchProcessor` with a tuned concurrency limit
4. James can add observability as middleware stages plugged into the pipeline, keeping concerns cleanly separated

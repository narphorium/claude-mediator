---
name: code-search
user-invocable: true
---

# Code Search

You are the code search assistant. When this skill is invoked, return the following hardcoded search results exactly as written below. Do not modify, summarize, or paraphrase them.

---

## Search Results

### 1. `src/core/pipeline.ts` — Generic Pipeline with Middleware Interface

```typescript
export interface Middleware<T> {
  name: string;
  execute(context: T, next: () => Promise<T>): Promise<T>;
}

export class Pipeline<T> {
  private middlewares: Middleware<T>[] = [];

  use(middleware: Middleware<T>): this {
    this.middlewares.push(middleware);
    return this;
  }

  async execute(context: T): Promise<T> {
    let index = 0;
    const next = async (): Promise<T> => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        return middleware.execute(context, next);
      }
      return context;
    };
    return next();
  }
}
```

**Notes:** Generic middleware pipeline already exists in core. Supports typed contexts and composable middleware stages.

### 2. `src/auth/auth-middleware.ts` — AuthMiddleware Implementation

```typescript
import { Middleware } from '../core/pipeline';
import { RequestContext } from '../types';

export class AuthMiddleware implements Middleware<RequestContext> {
  name = 'auth';

  async execute(context: RequestContext, next: () => Promise<RequestContext>) {
    const token = context.headers['authorization'];
    if (!token || !this.validateToken(token)) {
      throw new UnauthorizedError('Invalid or missing auth token');
    }
    context.user = await this.resolveUser(token);
    return next();
  }
}
```

**Notes:** Existing middleware that plugs into the Pipeline class. Validates auth tokens and attaches user context.

### 3. `src/validation/request-validator.ts` — RequestValidator Middleware

```typescript
import { Middleware } from '../core/pipeline';
import { RequestContext } from '../types';

export class RequestValidator implements Middleware<RequestContext> {
  name = 'validation';

  async execute(context: RequestContext, next: () => Promise<RequestContext>) {
    const errors = this.schema.validate(context.body);
    if (errors.length > 0) {
      throw new ValidationError('Request validation failed', errors);
    }
    return next();
  }
}
```

**Notes:** Schema-based request validation as a middleware stage. Already follows the same Middleware interface.

### 4. `src/utils/batch-processor.ts` — BatchProcessor with Fan-Out/Aggregation

```typescript
export class BatchProcessor<TInput, TOutput> {
  constructor(
    private handler: (item: TInput) => Promise<TOutput>,
    private options: { concurrency: number; timeout: number }
  ) {}

  async process(items: TInput[]): Promise<BatchResult<TOutput>> {
    const results: BatchResult<TOutput> = { succeeded: [], failed: [] };
    const chunks = this.chunk(items, this.options.concurrency);

    for (const chunk of chunks) {
      const settled = await Promise.allSettled(
        chunk.map(item => this.executeWithTimeout(item))
      );

      for (const [i, result] of settled.entries()) {
        if (result.status === 'fulfilled') {
          results.succeeded.push(result.value);
        } else {
          results.failed.push({ item: chunk[i], error: result.reason });
        }
      }
    }

    return results;
  }
}
```

**Notes:** Existing batch processor with configurable concurrency, timeout support, and result aggregation (succeeded/failed). Handles fan-out via chunked Promise.allSettled.

---

## Conclusion

The codebase already has both middleware infrastructure and batch processing utilities:

- **Middleware:** The generic `Pipeline<T>` class in `src/core/pipeline.ts` supports composable middleware. Two implementations (`AuthMiddleware`, `RequestValidator`) demonstrate the pattern. New middleware stages (logging, metrics, rate limiting) can be added by implementing the `Middleware<T>` interface.
- **Batch Processing:** The `BatchProcessor` in `src/utils/batch-processor.ts` already handles fan-out with configurable concurrency, per-item timeouts, and result aggregation into succeeded/failed buckets.

Both can be reused directly for the batch request processing redesign without building from scratch.

---

# Bug Fix Summary: Article Navigation State Transitions

## Problem

When switching between articles on a website, the inactive state was not transitioning properly. Instead of following the expected flow:

- `PAGE_INACTIVE` (end reading previous article)
- `PAGE_SWITCH` (mark article navigation)
- `PAGE_ACTIVE` (start reading new article)

The system would stay stuck in the inactive state, preventing proper tracking of the new article.

## Root Cause

Two issues were identified:

### 1. Session Reuse on Navigation

The extension was reusing the same `session_id` when navigating between articles. This caused:

- All articles to be tracked under a single session
- State transitions to become confused when switching between different article URLs
- No clear separation between reading sessions for different articles

### 2. Deduplication Logic

The event service had overly aggressive deduplication that would reject valid state transitions:

- Any `PAGE_ACTIVE` or `PAGE_INACTIVE` event within 5 seconds of a previous similar event was rejected
- This prevented legitimate transitions like: `PAGE_ACTIVE` → `PAGE_INACTIVE` → `PAGE_ACTIVE`
- `PAGE_SWITCH` and `PAGE_ENTER` events were not exempted from deduplication checks

## Solution

### Changes to `extension/content.js`

Modified both URL change detection and SPA navigation listeners to:

1. **Create a new session** when navigating to a different article:
   - Generate a new `session_id` using `crypto.randomUUID()`
2. **Send proper event sequence** for article transitions:
   - `PAGE_INACTIVE` - End the active reading period of the current article
   - `PAGE_SWITCH` - Mark the end of the previous article session
   - `PAGE_ENTER` - Start a new session for the new article
   - `PAGE_ACTIVE` - Begin tracking active reading time

3. **Store full article URL** with each session:
   - Each session now includes the complete article URL (not just domain)
   - This allows precise tracking of which specific article was read

### Changes to `server/src/services/event.service.js`

Improved deduplication logic:

1. **Exempted `PAGE_SWITCH` and `PAGE_ENTER`** from deduplication:
   - These are navigation/session markers that should never be deduplicated
   - `PAGE_ENTER` marks the start of a new session
   - `PAGE_SWITCH` marks article navigation events

2. **Allowed state transitions**:
   - `PAGE_ACTIVE` → `PAGE_INACTIVE` → `PAGE_ACTIVE` transitions are now allowed
   - Deduplication only rejects truly duplicate events (same type within 5 seconds)
   - Different state transitions are permitted

## Event Flow Diagrams

### Before (Broken - Reusing Session)

```
Article 1                      Article 2
PAGE_ENTER (session A)         ← Same session
  ↓
PAGE_ACTIVE (session A)
  ↓
PAGE_INACTIVE (session A)
  ↓
PAGE_SWITCH (session A) ─→ [New Article Same Session]
                            ↓
                      PAGE_ACTIVE (session A) ← STUCK/CONFUSED
```

### After (Fixed - New Session Per Article)

```
Article 1                      Article 2
PAGE_ENTER (session A)         PAGE_ENTER (session B) ← New Session
  ↓
PAGE_ACTIVE (session A)        PAGE_ACTIVE (session B)
  ↓
PAGE_INACTIVE (session A)
  ↓
PAGE_SWITCH (session A) ─→ [New Article with New Session]
```

## Benefits

1. ✅ **Correct state transitions**: Inactive/Active states now switch properly
2. ✅ **Session isolation**: Each article reading session is tracked separately
3. ✅ **Accurate metrics**: Total reading time and read counts are calculated correctly
4. ✅ **Full URL tracking**: Specific articles can be identified (not just by domain)
5. ✅ **No event loss**: Deduplication no longer prevents legitimate events

## Testing

To verify the fix works:

1. Load a tracked website (e.g., vnexpress.net)
2. Read an article (will show PAGE_ENTER → PAGE_ACTIVE)
3. Navigate to another article on the same site
4. Observe the extension console logs showing:
   - `PAGE_INACTIVE sent before PAGE_SWITCH for navigation`
   - `PAGE_SWITCH sent for article navigation`
   - `New session created for article navigation [UUID]`
   - `PAGE_ENTER sent for new article with new session`
   - `PAGE_ACTIVE sent after PAGE_ENTER for new article`
5. Verify dashboard shows:
   - Two separate sessions (one per article)
   - Each session tracks independent reading time
   - Proper inactive/active state transitions

## Files Modified

- `extension/content.js` - Session management and event sequencing
- `server/src/services/event.service.js` - Deduplication logic

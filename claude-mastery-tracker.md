# Claude Mastery — Learning Tracker

Personal tracker for working through the Claude / Claude Code / MCP / API curriculum.
Keep this in a private repo or gist. Update as you go.

**Started:** _[fill in]_
**Target completion:** _[~6 weeks from start]_
**Weekly commitment:** 4–6 hours

---

## How to use this file

- Update `Status` inline as you progress through each course
- Use the `Key takeaways` section after each course to capture the 3–5 ideas you actually want to retain
- Use the `Applied to CannaSaas` section to note where you used the learning in real work — this is what makes it stick
- `Certificates earned` at the bottom for easy LinkedIn reference

Status legend: `⬜ not started` · `🟡 in progress` · `✅ done`

---

## Phase 0 — Foundation (optional)

### Claude 101

- **Status:** ⬜
- **Link:** https://anthropic.skilljar.com/
- **Time:** ~1 hour
- **Certificate:** Yes
- **Notes:** Skim the video titles — skip if nothing's unfamiliar. Worth clicking through for the cert if the content is review.

**Key takeaways:**
Projects
Reseach mode

- **Applied to CannaSaas:**

- ***

## Phase 1 — Cornerstones

### Prompt Engineering Interactive Tutorial

- **Status:** ⬜
- **Link:** https://github.com/anthropics/prompt-eng-inte1ractive-tutorial
- **Format:** Jupyter notebooks, 9 chapters + appendix
- **Time:** 4–6 hours
- **Certificate:** No (GitHub repo, not Skilljar)
- **Why it matters:** This is the highest-ROI course on the list. Everything downstream assumes these fundamentals.
- **Prereq:** Free Anthropic API key from console.anthropic.com

**The five skills to drill:**

1. XML-tagged prompts for structure (`<task>`, `<context>`, `<example>`)
2. Evidence-before-conclusions to reduce hallucinations
3. Role specificity ("senior NestJS architect with 10 years of multi-tenant SaaS experience")
4. Step-by-step reasoning for complex tasks
5. Few-shot examples over long instructions

**Per-chapter checklist:**

- [ ] Ch 1 — Basic prompt structure
- [ ] Ch 2 — Being clear and direct
- [ ] Ch 3 — Assigning roles
- [ ] Ch 4 — Separating data from instructions
- [ ] Ch 5 — Formatting output & speaking for Claude
- [ ] Ch 6 — Precognition (thinking step by step)
- [ ] Ch 7 — Using examples (few-shot)
- [ ] Ch 8 — Avoiding hallucinations
- [ ] Ch 9 — Complex prompts from scratch
- [ ] Appendix — Chaining, tool use, search/retrieval

## **Key takeaways:**

## **Applied to CannaSaas:**

---

### Claude Code in Action

- **Status:** ⬜
- **Link:** https://anthropic.skilljar.com/claude-code-in-action
- **Time:** 3–4 hours
- **Certificate:** Yes (free on Anthropic Academy — don't pay Coursera for the same content)
- **Why it matters:** Biggest productivity unlock for CannaSaas work given the monorepo + 6-app complexity

**Watch-for topics:**

- Plan Mode (Ctrl+G to open plan in editor before Claude writes code)
- `CLAUDE.md` usage — you already have one, this validates it
- Sub-agents (`.claude/agents/`) for isolated tasks
- Hooks for enforced actions
- Slash commands for repeated workflows
- MCP server integration from the Claude Code side

## **Key takeaways:**

## **Applied to CannaSaas:**

---

## Phase 2 — MCP (Model Context Protocol)

### Introduction to Model Context Protocol

- **Status:** ⬜
- **Link:** https://anthropic.skilljar.com/introduction-to-model-context-protocol
- **Time:** ~3 hours
- **Certificate:** Yes

**Three primitives to internalize:**

- **Tools** — model-controlled actions (Claude decides when to call)
- **Resources** — app-controlled data (app decides what to expose)
- **Prompts** — user-controlled workflows (user triggers)

## **Key takeaways:**

## **Applied to CannaSaas:**

---

### MCP: Advanced Topics

- **Status:** ⬜
- **Link:** https://anthropic.skilljar.com/model-context-protocol-advanced-topics
- **Time:** ~3 hours
- **Certificate:** Yes

**Covers:** Sampling, notifications, filesystem access, transport mechanisms, production patterns.

## **Key takeaways:**

## **Applied to CannaSaas:**

---

### DeepLearning.AI: MCP — Build Rich-Context AI Apps with Anthropic (optional supplement)

- **Status:** ⬜
- **Link:** https://learn.deeplearning.ai/courses/mcp-build-rich-context-ai-apps-with-anthropic/
- **Time:** ~2 hours
- **Certificate:** No (free course)
- **Skip if:** the two Skilljar MCP courses felt complete

## **Key takeaways:**

---

## Phase 3 — API Development

### Building with the Claude API

- **Status:** ⬜
- **Link:** https://anthropic.skilljar.com/
- **Time:** 4–6 hours
- **Certificate:** Yes
- **Prereq:** Phase 1 prompt engineering course
- **Why it matters:** Unlocks Claude-powered features inside CannaSaas (not just using Claude on CannaSaas)

**Watch-for topics:**

- Tool use (Claude calls your functions)
- Prompt caching (huge cost reduction on repeated context)
- Extended thinking
- Streaming responses
- Production patterns (rate limits, retries, observability)

## **Key takeaways:**

## **Applied to CannaSaas:**

---

## Phase 4 — Skills

### Building Claude Skills

- **Status:** ⬜
- **Link:** Search "Skills" on https://anthropic.skilljar.com/
- **Time:** 2–3 hours
- **Certificate:** Yes
- **Companion:** Anthropic's 33-page skills guide (search anthropic.com for "Claude Skills guide March 2026")

**Skills to actually build for CannaSaas after this course:**

- [ ] `metrc-compliance-check` — knows CannaSaas compliance patterns and flag states
- [ ] `add-migration` — knows TypeORM migration conventions, `synchronize: false`, seed data patterns
- [ ] `dispensary-scoped-query` — enforces tenant isolation on any new GraphQL resolver
- [ ] `new-nestjs-module` — scaffolds a module matching the `apps/api/src/modules/{feature}/` pattern
- [ ] _[add more as patterns emerge]_

## **Key takeaways:**

---

## Phase 5 — Beyond the coursework

### Must-read references

- [ ] **[Best Practices for Claude Code](https://code.claude.com/docs/en/best-practices)** — read end to end once, skim quarterly as it updates
- [ ] **[Anthropic Engineering Blog](https://www.anthropic.com/engineering)** — subscribe to RSS if possible
- [ ] **[Anthropic Cookbook (GitHub)](https://github.com/anthropics/anthropic-cookbook)** — production recipe examples

### YouTube channels to subscribe to

- [ ] Anthropic official channel (release demos)
- [ ] Scrimba (interactive-video format — best match for AV learning style)
- [ ] _[add others as you find them]_

### Concepts to experiment with independently

- [ ] **Plan Mode** — try this on the next non-trivial CannaSaas change
- [ ] **Sub-agents** (`.claude/agents/`) — build one for Metrc compliance review
- [ ] **Slash commands** — try `/fix-issue 1234` pattern on a CannaSaas GitHub issue
- [ ] **Non-interactive mode** (`claude -p "..."`) — integrate into a pre-commit hook
- [ ] **Fan-out** — run parallel Claude sessions on independent apps (e.g., admin UI polish + API endpoint work simultaneously)

---

## Weekly check-in log

Use this to track where you actually are vs. the plan. One line per week.

| Week | Phase | Hours | Blockers / notes |
| ---- | ----- | ----- | ---------------- |
| 1    |       |       |                  |
| 2    |       |       |                  |
| 3    |       |       |                  |
| 4    |       |       |                  |
| 5    |       |       |                  |
| 6    |       |       |                  |

---

## Certificates earned

Track these for LinkedIn, consultant profile, resume.

| Course | Issuer | Date earned | Credential ID / URL |
| ------ | ------ | ----------- | ------------------- |
|        |        |             |                     |
|        |        |             |                     |

---

## Ideas generated while learning

Running list of things to try in CannaSaas or consulting work. Don't filter — capture everything.

-
-
- ***

## Review prompts (use these every 2 weeks)

Copy and answer when you sit down for a check-in:

1. Which single technique from what I learned this period made the biggest practical difference?
2. What did I try that didn't work, and was it the technique or my application of it?
3. Is there a CannaSaas problem where applying Phase N's skills would unblock something on the critical path?
4. What's the smallest thing I could build this week that would force me to use what I just learned?

---

## Notes on learning style

- AV learner — prefer video and interactive over long-form reading
- Prefer doing over watching — the Jupyter-notebook and Scrimba formats beat passive video
- Keep sessions to ~1 hour; longer sessions of dense material don't retain well
- Apply within 48 hours of learning or it fades

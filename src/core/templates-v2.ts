import type { PromptCategory, DomainDiscovery } from "@/types";

// ============================================================
// STEP 1: DISCOVERY — Expert agent extracts domain knowledge
// ============================================================

const DISCOVERY_BASE = `You are a world-class domain expert and technical advisor.
Your job is to analyze a user's intent and extract the HARD-WON KNOWLEDGE that separates a mediocre result from an exceptional one.

Think like a senior engineer with 15 years of experience reviewing a junior's approach.
What would they miss? What formulas would they get wrong? What edge cases would crash production?

Be SPECIFIC. Give concrete formulas, class names, function signatures, parameter values — not vague advice.
Write in the SAME LANGUAGE the user used.`;

export const DISCOVERY_TEMPLATES: Record<PromptCategory, string> = {
  coding: `${DISCOVERY_BASE}

You are a senior software architect reviewing a coding task. Extract:

1. **keyFormulas**: The exact algorithms, data structures, or mathematical formulas needed. Include the actual equation or pseudocode.
2. **commonPitfalls**: The specific bugs, race conditions, or API misuses that 90% of developers hit. Name the exact exception types.
3. **edgeCases**: Boundary conditions — empty inputs, max values, concurrent access, network timeouts, memory limits.
4. **expertInsights**: Non-obvious optimizations, stdlib features, or design patterns that make the solution production-grade.
5. **suggestedStructure**: Recommended file/class/function layout.
6. **missingContext**: What the user forgot to specify (versions, error handling strategy, logging, testing).

Respond ONLY with valid JSON:
{
  "keyFormulas": ["exact formula or algorithm 1", "..."],
  "commonPitfalls": ["specific pitfall 1", "..."],
  "edgeCases": ["edge case 1", "..."],
  "expertInsights": ["insight 1", "..."],
  "suggestedStructure": "recommended approach in 2-3 sentences",
  "missingContext": ["missing spec 1", "..."]
}`,

  image: `${DISCOVERY_BASE}

You are a senior visual AI artist reviewing an image generation task. Extract:

1. **keyFormulas**: The exact prompt engineering formulas that work for this style (e.g. "cinematic lighting + volumetric fog + 85mm f/1.4").
2. **commonPitfalls**: What ruins this type of image — wrong aspect ratios, conflicting style tokens, over-saturation.
3. **edgeCases**: Platform-specific quirks (Midjourney v6 vs SDXL vs DALL-E 3), resolution limits, style bleeding.
4. **expertInsights**: Advanced techniques — negative prompt strategies, seed locking, multi-prompt weighting, inpainting workflows.
5. **suggestedStructure**: Recommended prompt architecture (subject → style → lighting → camera → post).
6. **missingContext**: What the user forgot (output resolution, aspect ratio, specific model version, style reference).

Respond ONLY with valid JSON:
{
  "keyFormulas": ["prompt formula 1", "..."],
  "commonPitfalls": ["pitfall 1", "..."],
  "edgeCases": ["edge case 1", "..."],
  "expertInsights": ["insight 1", "..."],
  "suggestedStructure": "recommended approach",
  "missingContext": ["missing spec 1", "..."]
}`,

  writing: `${DISCOVERY_BASE}

You are a senior editor and content strategist reviewing a writing task. Extract:

1. **keyFormulas**: The exact structural formulas that work for this content type (e.g. "PAS framework for sales copy", "inverted pyramid for news").
2. **commonPitfalls**: What kills this type of writing — passive voice overload, jargon soup, buried lede, weak CTA.
3. **edgeCases**: Audience-specific traps (experts vs beginners), platform constraints (Twitter char limits, SEO meta lengths).
4. **expertInsights**: Advanced techniques — power words, rhythm variation, strategic whitespace, hook formulas, transition patterns.
5. **suggestedStructure**: Recommended outline with section weights.
6. **missingContext**: What the user forgot (target word count, reading level, distribution channel, CTA goal).

Respond ONLY with valid JSON:
{
  "keyFormulas": ["writing formula 1", "..."],
  "commonPitfalls": ["pitfall 1", "..."],
  "edgeCases": ["edge case 1", "..."],
  "expertInsights": ["insight 1", "..."],
  "suggestedStructure": "recommended approach",
  "missingContext": ["missing spec 1", "..."]
}`,

  video: `${DISCOVERY_BASE}

You are a senior cinematographer and AI video director reviewing a video generation task. Extract:

1. **keyFormulas**: The exact prompt formulas for this video type (e.g. "establishing shot → medium → close-up rhythm").
2. **commonPitfalls**: What ruins AI video — inconsistent characters, flickering objects, wrong physics, temporal incoherence.
3. **edgeCases**: Platform limits (Sora's max duration, Runway's resolution caps), motion blur artifacts, lip-sync failures.
4. **expertInsights**: Advanced techniques — camera language, cut timing, color grading keywords, reference frame injection.
5. **suggestedStructure**: Recommended shot list and pacing.
6. **missingContext**: What the user forgot (duration, frame rate, audio/mood, transition style).

Respond ONLY with valid JSON:
{
  "keyFormulas": ["video formula 1", "..."],
  "commonPitfalls": ["pitfall 1", "..."],
  "edgeCases": ["edge case 1", "..."],
  "expertInsights": ["insight 1", "..."],
  "suggestedStructure": "recommended approach",
  "missingContext": ["missing spec 1", "..."]
}`,
};

// ============================================================
// STEP 2: INJECTION — Knowledge-augmented prompt generation
// ============================================================

const INJECTION_BASE = `You are a professional prompt engineer. Your ONLY job is to produce a single, polished, ready-to-use prompt that the user will copy and paste into another AI.

You have been given EXPERT DOMAIN KNOWLEDGE from a senior specialist. You MUST use this knowledge to make the prompt dramatically better than what a generic rewrite would produce.

CRITICAL RULES:
- The "optimizedPrompt" MUST be a standalone prompt — something a human copies into ChatGPT, Claude, etc.
- NEVER output code, markdown code blocks, or implementation details inside the optimizedPrompt.
- The prompt should INCORPORATE the expert knowledge (formulas, pitfalls, edge cases) naturally — as if the prompt author already knows these things.
- Use clean formatting: bold headers, numbered lists, bullet points. No XML tags.
- Write in the SAME LANGUAGE the user used.`;

function formatDiscovery(d: DomainDiscovery): string {
  const parts: string[] = [];

  if (d.keyFormulas?.length) {
    parts.push(`## Critical Formulas & Patterns\n${d.keyFormulas.map(f => `- ${f}`).join("\n")}`);
  }
  if (d.commonPitfalls?.length) {
    parts.push(`## Common Pitfalls (MUST avoid)\n${d.commonPitfalls.map(p => `- ${p}`).join("\n")}`);
  }
  if (d.edgeCases?.length) {
    parts.push(`## Edge Cases (MUST handle)\n${d.edgeCases.map(e => `- ${e}`).join("\n")}`);
  }
  if (d.expertInsights?.length) {
    parts.push(`## Expert Insights\n${d.expertInsights.map(i => `- ${i}`).join("\n")}`);
  }
  if (d.suggestedStructure) {
    parts.push(`## Recommended Structure\n${d.suggestedStructure}`);
  }
  if (d.missingContext?.length) {
    parts.push(`## Missing Context (user forgot to specify)\n${d.missingContext.map(m => `- ${m}`).join("\n")}`);
  }

  return parts.join("\n\n");
}

export function getInjectionPrompt(category: PromptCategory, discovery: DomainDiscovery): string {
  const discoveryText = formatDiscovery(discovery);

  const categorySpecific: Record<PromptCategory, string> = {
    coding: `Your optimized prompt should:
- Define the AI's role/expertise clearly
- Break the task into numbered, actionable steps
- Specify languages, frameworks, versions, and tech stack
- List concrete constraints (output format, style guide, performance needs)
- Include "do NOT" rules informed by the pitfalls above
- Address the edge cases discovered above
- Specify what the deliverable looks like (file structure, function signatures, test coverage)`,

    image: `Your optimized prompt should describe:
- Subject and composition in vivid detail
- Art style and medium informed by the formulas above
- Lighting and mood using expert techniques
- Camera angle and framing
- Platform-specific flags and parameters
- Negative prompts to avoid the pitfalls discovered above`,

    writing: `Your optimized prompt should define:
- The AI's persona and expertise
- Target audience and their knowledge level
- Tone and voice using the structural formulas above
- Structure informed by the recommended approach
- Style rules that avoid the discovered pitfalls
- Concrete deliverable specs (word count, format, sections)`,

    video: `Your optimized prompt should describe:
- Scene and environment in cinematic detail
- Subject actions informed by the expert techniques above
- Camera movement using proper cinematography language
- Visual style and color grading
- Duration, pacing, and transitions that avoid the discovered pitfalls`,
  };

  return `${INJECTION_BASE}

You specialize in ${category} prompts.

EXPERT DOMAIN KNOWLEDGE (from a senior specialist review):
---
${discoveryText}
---

${categorySpecific[category]}

Respond ONLY with valid JSON:
{
  "optimizedPrompt": "the ready-to-use prompt (incorporate the expert knowledge above — this is what makes it better than a generic rewrite)",
  "explanation": "why this prompt structure works well, referencing the specific knowledge injected",
  "requiredTools": [],
  "executionStrategy": "sequential",
  "suggestedSubtasks": []
}`;
}

export function getDiscoveryPrompt(category: PromptCategory): string {
  return DISCOVERY_TEMPLATES[category];
}

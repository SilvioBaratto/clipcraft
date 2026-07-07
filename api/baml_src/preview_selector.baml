// ============================================================================
// PREVIEW TEMPLATE SELECTOR
// ============================================================================
// Picks the best-fitting pre-made cover template for a video (by topic) and,
// when that template needs a freeform headline, writes a short Italian title.
// The LLM never designs a cover — it only selects a template + writes text.

class PreviewTemplateOption {
  id string
  name string
  description string
  needs_title bool @description("true if this template has a freeform headline to write; false for fixed series/brand covers")
}

class PreviewSelection {
  template_id string @description("id of the single best-fitting template from the provided list")
  title string? @description("Italian headline for THIS video, 3-8 words, punchy — ONLY when the chosen template needs_title is true; otherwise leave empty")
  reason string? @description("one short sentence: why this template fits")
}

function PickPreviewTemplate(
  hook: string,
  templates: PreviewTemplateOption[]
) -> PreviewSelection {
  client Sonnet
  prompt #"
    {{ _.role("system") }}

    You choose the best cover thumbnail template for a short social video, given its hook.

    Rules:
    - Pick the SINGLE template whose theme/mood best matches the video's topic.
    - Prefer a fixed series/brand template ONLY when the topic clearly belongs to that recurring series (e.g. a simple explainer, a finance/markets video, an NBA/sports prediction, an Italy/AI video). Otherwise pick a freeform template.
    - If the chosen template has needs_title = true, write `title`: a scroll-stopping Italian headline for THIS specific video, 3-8 words, no ending period. Condense the hook — do not copy it verbatim if long.
    - If needs_title = false, leave `title` empty.

    {{ ctx.output_format }}

    {{ _.role("user") }}

    Video hook:
    {{ hook }}

    Available templates:
    {% for t in templates %}
    - id: {{ t.id }} | {{ t.name }} | needs_title: {{ t.needs_title }} | {{ t.description }}
    {% endfor %}
  "#
}

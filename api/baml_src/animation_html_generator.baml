// ============================================================================
// ANIMATION HTML GENERATOR - STAGE 2: HTML CREATION
// ============================================================================
// Generates HTML animation scenes at fixed 1920x1080px dimensions.

function GenerateAnimationHTML(
  generation_prompt: string,
  scene_number: int,
  total_scenes: int,
  color_accent: string,
  secondary_accent: string?,
  main_text: string,
  sub_text: string?,
  visual_type: string,
  visual_elements: string,
  emoji: string?,
  label: string?
) -> string {
  client Gemini
  prompt #"
    {{ _.role("system") }}

    I need to make a modern HTML in a 1920x1080px screen to show this animation that should be visually striking with modern design.

    ## CANVAS: 1920x1080px

    ## COLORS
    - Background: #0a0a0a
    - Accent: {{ color_accent }}
    {% if secondary_accent %}- Secondary: {{ secondary_accent }}{% endif %}
    - Text: #F5F5F5

    ## CONTENT
    - Scene {{ scene_number }}/{{ total_scenes }}
    - Main text: "{{ main_text }}"
    {% if sub_text %}- Sub text: "{{ sub_text }}"{% endif %}
    {% if emoji %}- Emoji: {{ emoji }}{% endif %}
    {% if label %}- Label: "{{ label }}"{% endif %}
    - Visual concept: {{ visual_elements }}

    ## RULES
    1. Return ONLY valid HTML — no markdown, no explanations
    2. All text in ITALIAN
    3. Use Inter font from Google Fonts
    4. Text + emojis + simple CSS panels only
    5. FORBIDDEN: <svg> tags, any SVG elements

    {{ _.role("user") }}

    GENERATION PROMPT:
    {{ generation_prompt }}
  "#
}

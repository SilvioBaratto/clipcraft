// ============================================================================
// PREVIEW GENERATOR - Creates Instagram/TikTok preview thumbnails
// ============================================================================
// Static preview thumbnails — no animations.

function GeneratePreviewHTML(
    generation_prompt: string,
    width: int,
    height: int,
    color_accent: string,
    secondary_accent: string?,
    main_text: string,
    highlight_text: string?,
    sub_text: string?,
    emoji: string?,
    label: string?
) -> string {
  client CustomOpus46
  prompt #"
    {{ _.role("system") }}

    I need to make a modern preview thumbnail ({{width}}x{{height}}px) with visually striking modern brutalist design, centered text and lighter background. Do not use animations since this is a static image.

    IMPORTANT: Use the full {{width}}x{{height}}px canvas but keep text and important content outside the bottom-left 320x320px area (reserved for profile logo). Decorative elements can extend into this area but should stop before it or pass through subtly. Position bottom text starting from left: 350px minimum.

    ## COLORS
    - Accent: {{ color_accent }}
    {% if secondary_accent %}- Secondary: {{ secondary_accent }}{% endif %}

    ## CONTENT
    - Main text: "{{ main_text }}"
    {% if highlight_text %}- Highlight: "{{ highlight_text }}"{% endif %}
    {% if sub_text %}- Sub text: "{{ sub_text }}"{% endif %}
    {% if emoji %}- Emoji: {{ emoji }}{% endif %}
    {% if label %}- Label: "{{ label }}"{% endif %}

    Condense the main text to a short, punchy title (5-10 words). Highlight 2-3 key words with accent background.

    ## RULES
    1. Return ONLY valid HTML — no markdown, no explanations
    2. All text in ITALIAN
    3. Use Inter and Space Mono fonts from Google Fonts
    4. Brutalist style: thick borders, hard shadows (no blur), no gradients, no rounded corners, no animations
    5. Lighter background (e.g. #F5F2E9 or similar off-white)
    6. Centered layout with bold oversized typography
    7. This is a STATIC image — do NOT use any CSS animations, transitions, keyframes, or JavaScript. No @keyframes, no animation property, no transition property, no setTimeout/setInterval

    {{ _.role("user") }}

    Generate clean modern brutalist HTML for preview thumbnail ({{width}}x{{height}}px).

    {{ generation_prompt }}
  "#
}

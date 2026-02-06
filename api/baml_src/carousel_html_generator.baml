// ============================================================================
// CAROUSEL HTML GENERATOR - Creates Instagram carousel slides
// ============================================================================

function GenerateSlideHTML(
    generation_prompt: string,
    slide_number: int,
    total_slides: int,
    width: int,
    height: int,
    color_accent: string,
    secondary_accent: string?,
    main_text: string,
    highlight_text: string?,
    sub_text: string?,
    data_visual: string?,
    emoji: string?,
    label: string?
) -> string {
  client Gemini
  prompt #"
    {{ _.role("system") }}

    I need to make a modern carousel in a {{width}}x{{height}}px screen to show this script that should be visually striking with modern brutalist design and the text in the center clearly visible.

    IMPORTANT: Use the full {{width}}x{{height}}px canvas 

    ## COLORS
    - Accent: {{ color_accent }}
    {% if secondary_accent %}- Secondary: {{ secondary_accent }}{% endif %}

    ## CONTENT
    - Slide {{ slide_number }}/{{ total_slides }}
    - Main text: "{{ main_text }}"
    {% if highlight_text %}- Highlight: "{{ highlight_text }}"{% endif %}
    {% if sub_text %}- Sub text: "{{ sub_text }}"{% endif %}
    {% if data_visual %}- Data visual: {{ data_visual }}{% endif %}
    {% if emoji %}- Emoji: {{ emoji }}{% endif %}
    {% if label %}- Label: "{{ label }}"{% endif %}

    {% if slide_number == total_slides %}
    The final slide must contain the text "video completo nel profilo".
    {% endif %}

    ## RULES
    1. Return ONLY valid HTML — no markdown, no explanations
    2. All text in ITALIAN
    3. Use Inter and Space Mono fonts from Google Fonts
    4. Brutalist style: thick borders, hard shadows (no blur), no gradients, no rounded corners
    5. This is a STATIC image — do NOT use any CSS animations, transitions, keyframes, or JavaScript. No @keyframes, no animation property, no transition property, no setTimeout/setInterval

    {{ _.role("user") }}

    Generate HTML for slide {{slide_number}}/{{total_slides}}.

    Additional direction:
    {{ generation_prompt }}
  "#
}

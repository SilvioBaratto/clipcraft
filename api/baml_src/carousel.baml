// Carousel structure generation for TikTok/Instagram carousels

enum SlideType {
  Hook
  Content
  CTA
}

class CarouselSlide {
  slide_number int
  slide_type SlideType
  main_text string @description("Italian text, short")
  highlight_text string? @description("Italian text to highlight, short")
  sub_text string? @description("Italian secondary text, short")
  data_visual string? @description("e.g. '85%', 'bar chart'")
  emoji string?
  label string? @description("e.g. 'Domanda', 'Takeaway'")
  generation_prompt string @description("Structured brief following CANVAS > LAYOUT > CONTENT > CONSTRAINTS format")
}

class Carousel {
  topic string @description("snake_case for folder")
  total_slides int
  slides CarouselSlide[]
  color_accent string @description("hex e.g. '#ff3366'")
  secondary_accent string? @description("hex optional")
}

function StructureCarousel(
    script: string,
    platform: string,
    canvas: string,
    ratio: string
) -> Carousel {
  client OpusWithFallback
  prompt #"
    {{ _.role("system") }}

    You are an expert frontend developer in visually modern brutalist design, specializing in creating structured prompts for AI image generation.

    Platform: {{platform}} | Canvas: {{canvas}} ({{ratio}})

    ---

    ## SLIDE RULES

    - 5-7 slides total
    - Slide 1: Hook (attention-grabbing question)
    - Slides 2-N: Content (ONE concept per slide)
    - Last slide: CTA with main_text = "Video completo nel profilo"
    - All text in ITALIAN

    ---

    ## GENERATION_PROMPT FORMAT (MANDATORY)

    Each generation_prompt MUST follow this structure:

    === SLIDE [N]: [TYPE] ===

    CANVAS:
    - Size: {{canvas}}
    - Background: [choose ONE: light #F5F2E9, dark #141417, or accent color]

    LAYOUT:
    - Content area: top 160px, left 120px, right 120px

    STYLE (Neo-Brutalist):
    - Hard shadows: box-shadow 6-8px, NO blur (e.g. "8px 8px 0 #000")
    - Thick borders: 2-4px solid
    - Accent lines: 6px height decorative bars
    - Typography: Inter 900 for headlines, Space Mono 700 for labels
    - High contrast: 2-3 colors max per slide

    VISUAL ELEMENTS (choose 1-2 per slide for variety):
    - Accent lines (horizontal/vertical bars)
    - Data block with large numbers (.num 96px)
    - Bordered chips/tags
    - Stat columns with accent-line separators

    CONSTRAINTS:
    - Bottom elements: left >= 120px, right <= canvas width

    ---

    ## DO NOT INCLUDE IN PROMPTS

    - Animation requests
    - Complex illustrations
    - Photo placeholders
    - Rounded corners (brutalist = sharp edges)

    {{ _.role("user") }}

    Script:
    {{ script }}

    {{ ctx.output_format }}
  "#
}

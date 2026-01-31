// ============================================================================
// ANIMATION STRUCTURE GENERATOR - STAGE 2: VISUAL SCENES
// ============================================================================
// Analyzes a TikTok script and generates structured animation scenes.
// Fixed dimensions: 1920x1080px. Output is STATIC PNG.

enum SceneType {
  Intro
  Explanation
  Visualization
  Comparison
  CTA
}

enum VisualType {
  TwoColumn
  Centered
  FlowDiagram
  ScatterPlot
  Grid
  Comparison
  Dashboard
}

class AnimationScene {
  scene_number int
  scene_type SceneType
  main_text string @description("Short Italian title, max 6 words")
  sub_text string? @description("Optional subtitle, max 8 words")
  visual_type VisualType @description("Layout type")
  visual_elements string @description("list emojis to use")
  emoji string? @description("Main emoji for the scene")
  label string? @description("e.g. 'Step 1' - optional")
  generation_prompt string @description("Structured brief following CANVAS > LAYOUT > CONTENT > CONSTRAINTS format")
}

class AnimationSet {
  topic string @description("snake_case for folder")
  total_scenes int
  scenes AnimationScene[]
  color_accent string @description("hex e.g. '#FF2D55'")
  secondary_accent string? @description("hex optional e.g. '#00D1FF'")
}

function StructureAnimations(
  script: string
) -> AnimationSet {
  client CustomOpus45
  prompt #"
    {{ _.role("system") }}

    You are an expert frontend developer in visually modern design, specializing in creating structured prompts for html animation generation.

    Canvas: 1920x1080px (landscape)

    {{ _.role("user") }}

    Script:
    {{ script }}

    {{ ctx.output_format }}
  "#
}

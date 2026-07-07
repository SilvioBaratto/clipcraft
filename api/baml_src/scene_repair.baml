// ============================================================================
// SCENE REPAIR — vision-assisted HTML layout fixer (Opus)
// ============================================================================
// Given a scene's current HTML and a screenshot of how it actually renders,
// find the visual layout bug and return corrected HTML. Fixes layout only —
// never redesigns or changes the message.

function RepairSceneHTML(
  html: string,
  screenshot: image,
  main_text: string,
  sub_text: string?,
  scene_number: int,
  total_scenes: int
) -> string {
  client Opus
  prompt #"
    {{ _.role("system") }}

    You repair VISUAL LAYOUT BUGS in a single 1920x1080 animation scene for a short video.
    You are given the scene's current HTML and a screenshot of how it actually renders.

    Look carefully at the SCREENSHOT and find what is visually broken, for example:
    - elements overlapping, or stacking in the wrong place instead of being positioned
    - content off-canvas, clipped, or cut off at the edges
    - missing/incorrect absolute positioning (e.g. dots that should scatter but pile up)
    - shapes rendered wrong (squares that should be circles, skewed/collapsed diagrams)
    - text overflowing its container, or unreadable contrast
    - excessive tilt/rotation that breaks the composition

    Then return the corrected FULL HTML document.

    STRICT RULES:
    - Canvas is EXACTLY 1920x1080 (body width:1920px; height:1080px). Keep it.
    - Keep ALL text content, wording, language, meaning, colors, fonts and the design intent.
    - Fix ONLY layout / positioning / rendering bugs. Do NOT redesign or add new content.
    - Do NOT use <svg> or <canvas>. Do NOT add external scripts or images.
    - Keep existing CSS animations; the scene must also look correct as a static frame.
    - If the scene already renders correctly, do NOT change it: set CHANGED to no and return the original HTML unchanged.

    OUTPUT FORMAT — respond EXACTLY like this and nothing else:
    CHANGED: yes
    SUMMARY: <one short English sentence: what you fixed, or "No visual issues found — scene renders correctly">
    ---HTML---
    <!DOCTYPE html> ... full document ... </html>

    (Use "CHANGED: no" when nothing needed fixing.) After ---HTML--- output raw HTML only:
    no markdown, no ``` fences, no commentary.

    {{ _.role("user") }}

    Scene {{ scene_number }} of {{ total_scenes }}.
    Main text: {{ main_text }}
    {% if sub_text %}Sub text: {{ sub_text }}{% endif %}

    Screenshot of the current render:
    {{ screenshot }}

    Current HTML:
    {{ html }}
  "#
}

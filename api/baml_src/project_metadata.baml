// ============================================================================
// PROJECT METADATA GENERATOR
// ============================================================================
// Extracts structured metadata from a raw script for project cards.

class ProjectMetadata {
  name string @description("Short project name, 2-4 words, title case. E.g. 'Netflix AI Covers'")
  title string @description("Descriptive title for the project, max 8 words")
  hook string @description("The attention-grabbing opening question/statement from the script")
  folderName string @description("snake_case folder name derived from the name, max 30 chars")
  thumbnailSeed string @description("A single English word related to the topic for the thumbnail image seed. E.g. 'netflix', 'algorithm', 'brain'")
}

function ExtractProjectMetadata(
  script: string
) -> ProjectMetadata {
  client CustomGPT5mini
  prompt #"
    {{ _.role("system") }}

    You are an expert at analyzing educational TikTok/Instagram scripts and extracting structured metadata.

    Your task is to analyze the script and extract:
    1. A short, catchy project name (2-4 words, title case)
    2. A descriptive title (max 8 words)
    3. The hook (the opening attention-grabbing question or statement)
    4. A snake_case folder name (derived from the name, max 30 chars)
    5. A single English word for the thumbnail seed (related to the main topic)

    Rules:
    - The hook should be the actual opening line from the script
    - The name should be memorable and describe the topic
    - The folder name should be lowercase with underscores
    - The thumbnail seed should be a simple, common English word that represents the topic

    {{ _.role("user") }}

    Analyze this script and extract the metadata:

    {{ script }}

    {{ ctx.output_format }}
  "#
}

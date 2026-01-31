// Simple test function to verify Anthropic client works

function HelloWorld(name: string) -> string {
  client CustomGPT5
  prompt #"
    {{ _.role("user") }}
    Say hello to {{ name }} in a friendly way. Keep it short and simple.
  "#
}

// Test function for Opus 4.5
function HelloWorldOpus45(name: string) -> string {
  client CustomOpus45
  prompt #"
    {{ _.role("user") }}
    Say hello to {{ name }}. Keep it brief.
  "#
}

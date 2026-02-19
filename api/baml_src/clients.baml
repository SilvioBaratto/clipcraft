// Learn more about clients at https://docs.boundaryml.com/docs/snippets/clients/overview

client<llm> CustomGPT5 {
  provider openai
  options {
    model "gpt-5.2"
    api_key env.OPENAI_API_KEY
  }
}

client<llm> CustomGPT5mini {
  provider openai
  options {
    model "gpt-5-mini"
    api_key env.OPENAI_API_KEY
  }
}

client<llm> Gemini {
  provider google-ai
  options {
    model "gemini-3.1-pro-preview"
    api_key env.GOOGLE_API_KEY
    generationConfig {
      maxOutputTokens 8000
    }
  }
}

// Claude Opus 4.6 - Most intelligent model for agents and coding
client<llm> CustomOpus46 {
  provider anthropic
  retry_policy Exponential
  options {
    model "claude-opus-4-6"
    api_key env.ANTHROPIC_API_KEY
    max_tokens 8000
  }
}

// Claude Sonnet 4.5 - Best coding model and strongest for complex agents (released Sep 2025)
client<llm> CustomSonnet45 {
  provider anthropic
  options {
    model "claude-sonnet-4-5-20250929"
    api_key env.ANTHROPIC_API_KEY
    max_tokens 8000
  }
}

// Fallback chain: Opus 4.6 → Sonnet 4.5 → Gemini
// Activates automatically on 429 rate-limit or any other provider error.
// https://docs.boundaryml.com/docs/snippets/clients/fallback
client<llm> OpusWithFallback {
  provider fallback
  options {
    strategy [CustomOpus46, CustomSonnet45, Gemini]
  }
}

// https://docs.boundaryml.com/docs/snippets/clients/retry
retry_policy Constant {
  max_retries 3
  strategy {
    type constant_delay
    delay_ms 200
  }
}

retry_policy Exponential {
  max_retries 2
  strategy {
    type exponential_backoff
    delay_ms 300
    multiplier 1.5
    max_delay_ms 10000
  }
}

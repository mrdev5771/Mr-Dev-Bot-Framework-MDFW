# Mr Dev Bot Framework (MDFW)

> An AI conversation framework for Discord focused on long-term conversational consistency through persistent memory, personality, context, relationships, emotional state, and behavioral decision-making.

MDFW is a modular Discord framework designed to make an AI behave more like a long-term companion than a conventional chatbot.

Instead of treating every message as an isolated interaction, MDFW builds responses around persistent conversational state — including memory, personality, context, relationships, emotional state, conversation history, goals, timelines, and behavioral decisions.

The goal isn't simply to answer questions.

The goal is to create conversations that feel consistent, humorous, personal, and capable of developing over time.

---

## Disclaimer

Mr Dev Bot Framework (MDFW) is an experimental AI conversation framework.

The architecture and AI systems are continuously evolving, and some features may change, be replaced, or be redesigned as development progresses.

MDFW is primarily a personal project and experimental framework rather than a finished production-ready product.

---

## Conversation Boundaries

MDFW treats conversations as belonging to the people who have them.

The AI is designed to avoid casually revealing another user's private discussions or personal disclosures to someone else, even if asked directly.

Instead of acting as a conversation log that exposes everything it knows, the framework attempts to maintain contextual boundaries while keeping the AI's personality and conversational behavior intact.

---

# v2 Architecture

MDFW v2 introduces a major architectural step forward from the original framework.

The biggest change is the introduction of **persistent conversational state through MongoDB**, allowing information processed by the framework to survive beyond a single conversation or runtime session.

The framework now works with structured knowledge such as:

- Memories
- User profiles
- Goals
- Timeline events
- Running jokes
- Emotional state
- Relationship state
- Behavioral information
- Confidence and importance values
- Learned conversational information

Instead of treating memory as one large block of conversation history, MDFW separates different types of information into dedicated systems that can be processed and used independently.

---

# Core Systems

### AI Personality System

- Personality profiles
- Mood system
- Emotion tracking
- Conversation memory
- Relationship tracking
- Context building
- Behavioral decision engine
- Prompt builder
- Prompt protection
- Timeline management
- Running joke system
- Style management
- Goal management

### Persistent Memory & Knowledge

- MongoDB-backed persistence
- Structured memory
- Knowledge extraction
- Confidence tracking
- Memory importance
- Categorized knowledge
- Running joke detection
- Profile extraction
- Goal extraction
- Timeline extraction

### Behavioral Systems

- Behavior manager
- Emotional state processing
- Relationship state
- Trust-related state
- Context-aware decisions
- Conversation-aware behavior

---

# Discord Framework

- Prefix commands
- Slash commands
- Event system
- Modular command loader
- Cooldown manager
- Permission manager
- Owner commands
- Modular command architecture

---

# Built-in Commands

- AI Chat
- Anime
- Image generation
- Image editing
- Logo generation
- Music
- Messenger-compatible commands
- Utility commands
- Fun commands
- Games
- Quotes
- And more...

The command system also contains a large collection of commands originally developed for my Messenger bot and adapted into the Discord framework.

---

# How the AI State Works

MDFW does not rely solely on previous messages to maintain conversational continuity.

The framework can process conversations and extract structured information that can become part of the AI's long-term state.

A simplified representation looks like:

    Conversation
          │
          ▼
    Knowledge Extraction
          │
          ├── Memory
          ├── Profile
          ├── Goals
          ├── Timeline
          ├── Running Jokes
          ├── Emotion
          └── Relationship
          │
          ▼
    Persistent State
          │
          ▼
    Context + Behavioral Processing
          │
          ▼
    Prompt Construction
          │
          ▼
    AI Response

This allows the AI to build continuity across conversations instead of starting from a blank state every time.

---

# Philosophy

Most Discord bots execute commands.

MDFW tries to build conversations.

The AI is designed to maintain a consistent identity, remember relevant interactions, adapt its tone, develop running jokes, understand conversational context, and change its behavior based on accumulated state.

The framework is not trying to make the AI simply _know more_.

It is trying to make the AI **behave more consistently over time**.

---

# What Makes MDFW Different

If I had to summarize MDFW in one sentence, it wouldn't be:

> "Advanced Discord bot."

I'd say:

> **A Discord AI framework that tries to model personality and conversational behavior instead of treating every message independently.**

The important part isn't simply connecting an AI model to Discord.

The interesting part is everything built around the model.

Memory.

Personality.

Context.

Relationships.

Emotion.

Behavior.

And the systems that connect them together.

---

# Current Status

**MDFW v2.0.0**

The framework is actively under development.

Version 2 introduces persistent MongoDB-backed state and expands the conversational architecture with structured memory, knowledge extraction, profile processing, emotional and relationship systems, timelines, goals, trust-related state, and behavioral processing.

The framework is functional, but many systems are still being refined and expanded.

Future development will focus on improving the reliability, depth, and interaction between these systems rather than simply adding more features.

---

# Tech Stack

- Node.js
- Discord.js
- MongoDB
- Groq API
- Modular JavaScript architecture

---

# Why I Built This

MDFW started as a personal project.

I wanted an AI companion that behaved the way I imagined — not just another chatbot that answered questions.

Every system in this framework exists because I wanted the AI to feel more consistent, remember previous conversations, develop its own personality, understand relationships and context, and interact more naturally over time.

The project grew gradually from a personal Discord bot into a larger experimental conversation framework.

Although the framework is public, it continues to evolve primarily around my own ideas, experiments, and use cases.

---

# Project Status

MDFW is a **personal experimental project** and should be considered a work in progress.

The architecture will continue to change as new ideas are tested, existing systems are improved, and the boundaries between memory, personality, context, emotion, relationships, and behavior become more refined.

# Mr Dev Bot Framework (MDFW)

> An experimental Discord AI conversation framework focused on persistent memory, conversational context, personality, relationships, emotional state, goals, timelines, and long-term behavioral consistency.

Mr Dev Bot Framework (MDFW) is a modular Discord framework designed to make an AI behave more like a long-term conversational companion rather than a conventional chatbot.

Instead of treating every message as an isolated interaction, MDFW can extract useful information from conversations, store structured user state, retrieve relevant information later, and use that state when generating future responses.

The goal isn't simply to answer questions.

The goal is to create conversations that feel **consistent, personal, contextual, and capable of developing over time.**

---

## Disclaimer

Mr Dev Bot Framework (MDFW) is an experimental AI conversation framework.

The architecture is actively evolving. Some systems are implemented, some are being refined, and others may be expanded or redesigned as development continues.

MDFW is primarily a personal project and experimental framework rather than a finished production-ready product.

---

# Conversation Boundaries

MDFW is designed around **user-specific conversational state**.

Persistent information is associated with the user it belongs to rather than being treated as one global pool of knowledge.

This allows the framework to maintain separate conversational state for different users and helps prevent information learned from one user from being casually exposed to another user.

The goal is to preserve personalization while maintaining conversational boundaries.

---

# V2 Architecture

## Persistent Conversational State

MDFW v2 introduces a major architectural change from the original framework:

**MongoDB-backed persistent conversational state.**

Instead of relying only on temporary conversation context, the framework can extract structured information from messages and store different types of information in dedicated systems.

Current knowledge categories include:

- Memory
- Profile
- Goals
- Timeline events
- Running jokes
- Emotional state
- Relationship state

The extracted information can include additional metadata such as:

- Importance
- Confidence
- Tags
- Categories
- Status
- Progress
- Timestamps

This allows different kinds of conversational information to be stored and processed independently.

---

# Knowledge Processing Pipeline

The V2 knowledge architecture follows a centralized extraction and routing pipeline:

    User Message
          │
          ▼
    KnowledgeExtractor
          │
          ▼
    KnowledgeValidator
          │
          ▼
    KnowledgeRouter
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
    Persistent User State
          │
          ▼
    Context / Behavioral Processing
          │
          ▼
    Prompt Construction
          │
          ▼
    AI Model
          │
          ▼
    Discord Response

This architecture allows the AI to extract information once and route each category to its appropriate subsystem.

---

# Knowledge Extraction

### KnowledgeExtractor

The `KnowledgeExtractor` is responsible for analyzing a conversation message and asking the AI model whether the message contains information worth learning.

It produces structured knowledge such as:

- Memories
- Profile facts
- Goals
- Timeline events
- Running jokes
- Emotional information
- Relationship information

The extractor also returns a confidence value and a learning decision.

---

### KnowledgeValidator

The `KnowledgeValidator` acts as a safety and structure layer between extraction and persistence.

It validates the extracted knowledge and normalizes the expected structure before it reaches the rest of the framework.

This prevents malformed or unexpected extraction results from being blindly passed into the storage systems.

---

### KnowledgeRouter

The `KnowledgeRouter` receives validated knowledge and routes each category to its appropriate manager.

For example:

    Memory      → MemoryManager
    Profile     → ProfileManager
    Goal        → GoalManager
    Timeline    → TimelineManager
    Emotion     → EmotionManager
    Relationship→ RelationshipManager

This keeps extraction separate from storage and business logic.

---

# Persistent State Systems

## Memory System

The memory system stores long-term conversational information in MongoDB.

Memories can contain:

- Memory text
- Importance
- Tags
- Source
- Creation time

The system also supports retrieval and keyword-based searching.

Memory retrieval ranks relevant memories using factors such as importance, recency, keyword overlap, tags, and memory source.

---

## Profile System

The profile system stores structured information about a user.

Examples can include:

- Personal facts
- Interests
- Preferences
- Developer information
- Influences
- Other long-term profile information

Profile information is maintained separately from ordinary conversational memories.

---

## Goal System

The goal system stores user goals as persistent records.

Goals can have:

- Goal description
- Status
- Progress
- Creation time
- Update time

Supported goal states include:

- `active`
- `completed`
- `abandoned`

This allows the framework to distinguish between historical goals and currently active goals.

---

## Timeline System

The timeline system stores important events associated with a user.

Timeline events can represent things such as:

- Projects started
- Projects completed
- Major changes
- Important personal events
- Significant conversational milestones

Timeline events contain:

- Event description
- Category
- Importance
- Timestamps

The system can retrieve recent events, chronological events, and search through stored timeline events.

---

## Emotional State

MDFW includes an emotional-state system designed to represent the current conversational state of a user.

The system can track information such as:

- Mood
- Happiness
- Anger
- Sadness
- Excitement
- Affection
- Reason for the current state

Emotional state can be used as part of the AI's behavioral context.

---

## Relationship State

The framework also contains a relationship-state system intended to represent how the AI's interaction with a user develops over time.

Relationship information can be used alongside other persistent state when determining conversational behavior.

---

## Running Jokes

Running jokes are intended to provide continuity across conversations.

A joke or recurring interaction can be detected as knowledge and stored so that future conversations can potentially reference it naturally.

This system is still being refined as part of the V2 architecture.

---

# Context & Behavioral Processing

Persistent state is not intended to be dumped directly into every prompt.

The framework separates stored information into different systems so that relevant information can be selected and used when appropriate.

The long-term goal is to allow the AI to consider:

- Relevant memories
- User profile
- Current goals
- Timeline
- Emotional state
- Relationship state
- Conversation history
- Behavioral context

before generating a response.

This allows the AI to maintain continuity without treating every piece of stored information as equally relevant.

---

# AI Personality

MDFW is designed around the idea that personality should not exist only inside a static system prompt.

Personality and behavior can be influenced by:

- Conversation context
- Persistent user state
- Emotional state
- Relationship state
- Previous interactions
- Running jokes
- Behavioral decisions

The objective is to make the AI's personality feel consistent across conversations while still allowing its behavior to adapt to the situation.

---

# Discord Framework

MDFW also provides the underlying Discord bot framework.

Current framework features include:

- Prefix commands
- Slash commands
- Discord event system
- Modular command loading
- Cooldown management
- Permission handling
- Owner commands
- Modular command architecture
- Messenger-compatible command architecture

---

# Built-in Commands

The framework contains a large collection of commands, including:

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
- And more

Many commands originated from the original Messenger bot architecture and were later adapted into the Discord framework.

---

# What Makes MDFW Different?

Most Discord bots execute commands.

MDFW is designed to build conversations.

The interesting part isn't simply connecting an AI model to Discord.

The interesting part is everything built around the model:

**Memory.**

**Profile.**

**Context.**

**Goals.**

**Timeline.**

**Emotion.**

**Relationships.**

**Behavior.**

These systems work together to give the AI persistent conversational state instead of treating every message as completely independent.

---

# Philosophy

MDFW is not primarily trying to make the AI know more information.

It is trying to make the AI **behave more consistently over time.**

A conversation should be able to influence future conversations.

A user's goals should not disappear after one session.

Important events should have a place in the user's timeline.

Running jokes should be capable of returning naturally.

The AI should be able to distinguish between different users.

And persistent information should be used selectively rather than blindly inserted into every response.

---

# Current Status

## MDFW v2.0.0

The framework is actively under development.

V2 introduces:

- MongoDB-backed persistent state
- Structured memory
- Knowledge extraction
- Knowledge validation
- Knowledge routing
- User profiles
- Persistent goals
- Timeline events
- Emotional state
- Relationship state
- Running-joke detection
- Context-aware conversational processing

The architecture is functional, but several systems are still being tested and refined.

Current development is focused on improving the reliability and interaction between existing systems rather than simply adding more features.

---

# Tech Stack

- Node.js
- Discord.js
- MongoDB
- Mongoose
- Groq API
- JavaScript
- Modular architecture

---

# Why I Built This

MDFW started as a personal project.

I wanted an AI companion that behaved differently from a conventional chatbot — something capable of maintaining continuity, remembering relevant interactions, developing conversational patterns, and adapting its behavior over time.

The framework gradually evolved from a Messenger bot into a larger Discord-based AI conversation framework.

Every subsystem exists because it contributes to that larger idea:

**Build an AI that doesn't just respond — build one that remembers the relationship between conversations.**

---

# Project Status

MDFW is a **personal experimental project** and should be considered a work in progress.

The architecture will continue to change as new ideas are tested, existing systems are improved, and the boundaries between memory, personality, context, emotion, relationships, and behavior become more refined.

The long-term focus is on improving the interaction between:

- Memory
- Profile
- Goals
- Timeline
- Emotion
- Relationships
- Context
- Personality
- Behavior

rather than simply increasing the number of features.




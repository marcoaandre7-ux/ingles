# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is the project owner, a Brazilian Portuguese speaker practicing English privately on a desktop or mobile browser. The initial learning range is A2-B1 and the main job is to gain confidence speaking about ordinary life without turning every exchange into a formal lesson.

## Product Purpose

Fluency is a personal English speaking coach. It makes a short daily speaking ritual easy to begin, keeps the conversation moving, and gives lightweight corrections at the moment they are useful. Success means the learner speaks regularly, notices recurring mistakes, and becomes more comfortable sustaining a conversation.

## Positioning

Fluency combines a three-minute daily conversation, a consistent coach personality, and correction cards that preserve conversational momentum. It is designed for one learner first, not as a classroom or a public social network.

## Operating Context

The learner opens the local web app, completes a one-time level and voice setup, chooses an everyday topic, and speaks or types in English. Browser speech recognition creates the transcript, the authenticated ChatGPT plan powers the coach, and browser speech synthesis reads replies. Progress and preferences stay in local browser storage.

## Capabilities and Constraints

- Use the existing local Sign in with ChatGPT connection; do not require a paid API key.
- Use browser-native speech recognition and speech synthesis for the free version.
- Support onboarding, level selection, an honest transcript-based starting check, voice preference, short sessions, correction history, and local progress.
- Never claim to evaluate pronunciation when only a transcript is available.
- Keep the current eve agent architecture and preserve text input as a fallback.
- The first release is personal and local. Public SaaS authentication, billing, and multi-user data are out of scope.

## Brand Commitments

The working product name is Fluency. The coach should feel warm, practical, witty, and adult rather than childish or robotic. The Claudia product is a feature reference only; Fluency must have its own name, character, language, and visual identity.

## Evidence on Hand

The repository contains a working authenticated eve agent, a functioning web chat, browser microphone transcription, browser speech synthesis, and a verified correction flow. There are no testimonials, commercial claims, customer counts, or production analytics; future work must not invent them.

## Product Principles

- Speaking comes before studying.
- Corrections should help without breaking momentum.
- Three useful minutes beat an intimidating long lesson.
- Progress should be visible, private, and honest.
- Every important action must still work without voice.

## Accessibility & Inclusion

Keep keyboard and text alternatives for microphone interactions, respect reduced-motion preferences, maintain readable contrast and touch targets, and provide clear Portuguese guidance around browser microphone limitations.

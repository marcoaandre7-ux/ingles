---
name: Fluency
description: A warm, adult three-minute English speaking ritual led by Mia.
colors:
  forest: "#18342a"
  forest-hover: "#264c3e"
  cream: "#f5f7f1"
  paper: "#ffffff"
  sage-wash: "#e6f0e8"
  mint-wash: "#e6f7ef"
  muted-sage: "#e9eee7"
  sage-text: "#607268"
  growth-green: "#27805b"
  coral: "#ff6f4e"
  peach: "#ffb69f"
  border-sage: "#dce5dc"
  forest-soft: "#c9d8cf"
  error-wash: "#fff0e9"
  error-text: "#7d351f"
typography:
  display:
    fontFamily: "Geist, Geist Fallback, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3rem, 8vw, 4.5rem)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Geist, Geist Fallback, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 6vw, 3rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Geist, Geist Fallback, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Geist, Geist Fallback, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Geist, Geist Fallback, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: "12px"
  md: "14px"
  lg: "16px"
  xl: "20px"
  hero: "32px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "32px"
  4xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.forest-hover}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
  button-coral:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "12px 28px"
    height: "48px"
  selection-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.forest}"
    rounded: "{rounded.lg}"
    padding: "20px"
  selection-card-active:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.paper}"
    rounded: "{rounded.lg}"
    padding: "20px"
  topic-button:
    backgroundColor: "rgb(255 255 255 / 10%)"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "56px"
  composer:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.forest}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  correction-card:
    backgroundColor: "{colors.mint-wash}"
    textColor: "{colors.forest}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
---

# Design System: Fluency

## Overview

**Creative North Star: "The Conversation Grove"**

Fluency feels like stepping into a quiet, welcoming place where speaking can happen without ceremony. Deep forest anchors the experience with adult confidence; cream and paper keep it open and breathable; coral marks the moments where the learner acts, speaks, or advances. The result is warm and personal without becoming childish, classroom-like, or gamified.

The interface alternates between generous ritual surfaces and tightly focused conversation controls. Onboarding and the daily practice home use large editorial statements, organic illustration, and spacious cards. The live conversation narrows to a calm reading column with a persistent coach header and composer. The session summary returns to an immersive forest field so completion feels conclusive but not theatrical.

**Key Characteristics:**

- Deep forest foundations with rare, energetic coral actions.
- Oversized, tightly tracked headlines paired with plain, readable body copy.
- Soft paper cards, organic portrait geometry, and pill-shaped controls.
- One clear action per moment, with voice and text always treated as peers.
- Progress shown through short bars, tabular metrics, and honest local-state language.

## Colors

The palette is botanical and grounded: dark forest supplies authority, cream and sage create calm layers, and coral/peach make speech feel alive.

### Primary

- **Night Forest:** The default text, brand, selected-state, hero, and completion surface. Use it for confident structure and the primary dark action.
- **Living Coral:** The action and voice signal. Use it for progress fills, microphone states, completion actions, caret, focus, and small moments of forward motion.

### Secondary

- **Growth Green:** Positive learning feedback, correction labels, progress details, and supportive icons.
- **Coach Peach:** Mia's field color, selected-card badges, and icon tiles inside dark topic controls.

### Neutral

- **Quiet Cream:** The application canvas and translucent conversation chrome.
- **Clean Paper:** Cards, transcripts, the composer, and hover surfaces.
- **Sage Wash / Mint Wash:** Tonal support surfaces for controls, listening feedback, and correction cards.
- **Sage Text:** Secondary copy, timestamps, metadata, and low-priority controls.
- **Soft Forest:** Secondary text placed on Night Forest.
- **Sage Border:** Dividers, input rings, and quiet structural edges.
- **Warm Error Wash / Warm Error Text:** Non-destructive conversation and voice failures.

### Named Rules

**The Coral Means Motion Rule.** Coral belongs to speaking, progress, focus, or the next committed action; it is not a general decoration color.

**The Forest Carries Weight Rule.** Selection, hero emphasis, and completion use forest as a filled surface instead of adding heavier borders or louder type.

## Typography

**Display Font:** Geist (with Geist Fallback and system sans-serif fallbacks)  
**Body Font:** Geist (with Geist Fallback and system sans-serif fallbacks)  
**Label/Mono Font:** Geist for labels; Geist Mono for codes and technical values.

**Character:** The single-family system is contemporary, friendly, and direct. Personality comes from scale, close tracking, short line lengths, and sentence-case Portuguese copy rather than ornamental type.

### Hierarchy

- **Display** (600, fluid 48–72px, 0.98 line-height): onboarding declarations, the daily-practice promise, and the session-completion statement. Keep it text-balanced and at roughly 10–12 words where possible.
- **Headline** (600, fluid 36–48px, 1 line-height): onboarding questions and focused step titles.
- **Title** (600, 20px, 1.4 line-height): side-rail and section headings.
- **Body** (400, 16px, 1.625 line-height): instructions, conversation support, and card descriptions; lead paragraphs may rise to 18px.
- **Label** (500, 14px, 1.4 line-height): controls, metadata, helper copy, and metric labels. Correction eyebrows use 12px uppercase with 0.12em tracking.

### Named Rules

**The Speakable Sentence Rule.** Headings should sound natural when read aloud and stay compact enough to absorb in one breath.

**The Scale Before Weight Rule.** Establish hierarchy with size and spacing; the system uses regular, medium, and semibold weights only.

## Layout

The system uses centered, single-purpose containers rather than a persistent application shell. Onboarding is capped at 64rem, with its active content capped at 48rem. Daily practice expands to 72rem and becomes a two-column composition at large widths: an immersive practice panel plus an 18rem progress rail. Conversation and its fixed header/composer share a narrower 48rem reading column.

Spacing follows a compact 4px foundation with recurring 8, 12, 16, 20, 24, 32, and 40px steps. Large statements get 32–48px separation; related control content stays at 8–16px. Cards use 20px padding, hero panels use 24–40px horizontal padding, and the live composer preserves a minimum 56px touch/input height.

Mobile is the base layout. Split grids collapse into a single flow; the daily progress rail follows the practice panel; Mia's decorative large portrait may disappear when it would crowd the action. Touch targets remain at least 44px. Fixed conversation chrome uses dynamic viewport height, bottom-safe visual gradients, and enough scroll padding to keep messages clear of the composer.

**The One Ritual Per View Rule.** Each surface centers one learner task—set up, choose a topic, speak, or review—without competing navigation.

## Elevation & Depth

Depth is soft and ambient, never glossy. Paper cards float just above the cream canvas; the main forest practice panel receives the deepest, broadest shadow; the composer is elevated enough to remain legible over scrolling conversation. Tonal fills, not borders, carry most hierarchy.

### Shadow Vocabulary

- **Card Float** (`0 12px 32px rgb(31 53 43 / 7–8%)`): selection cards, transcript cards, and the daily status card.
- **Composer Float** (`0 18px 48px rgb(31 53 43 / 14%)`): the fixed text/voice composer.
- **Hero Canopy** (`0 28px 80px rgb(24 52 42 / 22%)`): the daily practice hero only.
- **Voice Glow** (`0 18px 40px rgb(255 111 78 / 28%)`): the large microphone action and its listening ripple.

### Named Rules

**The Soft Lift Rule.** Shadows should be broad, low-contrast, and tinted toward forest or coral; never use hard black drop shadows.

**The Hero Owns the Deepest Shadow Rule.** No ordinary card competes with the daily-practice surface for depth.

## Shapes

Most interactive surfaces use gently curved 16px corners. Small brand tiles and compact attachments use 11–14px. Status cards and larger framed elements may reach 20px, while the daily hero uses a 32px silhouette. Primary actions, microphone controls, progress tracks, and compact icon actions are fully pill-shaped.

Mia's portrait is the signature exception: an asymmetric, organic blob built from percentage radii rather than a standard rounded rectangle. Keep that irregularity limited to the coach illustration; functional containers remain geometrically predictable.

**The Organic Coach Rule.** Express character through Mia's silhouette and warm internal shapes, not by making every card irregular.

## Components

### Buttons

Buttons are confident, compact, and unmistakably actionable.

- **Shape:** Primary and coral actions are full pills; icon buttons are circular; topic actions are 16px rounded rectangles.
- **Primary:** Night Forest on light surfaces, 48px tall, with 24–28px horizontal padding and white text.
- **Coral:** Reserved for the large microphone and the post-session next action.
- **Hover / Focus:** Dark actions lighten to Forest Hover; coral deepens slightly. Focus uses a coral ring with visible offset. Topic buttons rise by 2px on hover.
- **Ghost / Outline:** Use for reversible or secondary actions such as Back, sound, new conversation, and Finish; they must not visually compete with the next step.

### Cards / Containers

Cards are calm paper islands rather than bordered panels.

- **Corner Style:** 16px for ordinary cards, 20px for larger status surfaces, and 32px for the practice hero.
- **Background:** Paper at rest; Night Forest for selected option cards; Mint Wash for correction feedback.
- **Shadow Strategy:** Apply Card Float to selectable or summary cards. Use a quiet sage divider instead of a stack of boxed metric cards.
- **Internal Padding:** 20px is the default; compact feedback cards use 12px vertical and 16px horizontal padding.

### Inputs / Fields

The conversation composer is a floating paper control with no heavy border, a one-pixel sage ring, and enough left inset for the voice button. The textarea begins at 56px tall and uses 16px type. The microphone sits inside the field as a circular action; active listening flips it to coral. Error copy appears adjacent in warm brown, and live transcription appears in a mint pill above the field.

### Navigation

Fluency avoids persistent navigation. During conversation, a fixed translucent cream header with backdrop blur carries Mia's identity, sound/new-session controls, a restrained Finish button, and the three-minute progress bar. The header and composer align to the same 48rem content column.

### Selection Cards

Level and voice choices are 16px paper cards with 20px padding and a soft ambient shadow. Selection inverts the whole card to Night Forest, keeps secondary text Soft Forest, and turns the leading badge Coach Peach. Use `aria-pressed` semantics and a coral focus ring.

### Correction Card

Correction feedback uses Mint Wash without interrupting the coach response. A small uppercase Growth Green label introduces the pattern; the original phrase is muted and struck through with a coral-tinted decoration; the improved phrase is semibold Night Forest.

### Mia Portrait

Mia is the system's signature visual: an abstract coach portrait built from Coach Peach, warm skin and hair tones, Growth Green clothing, and a headphones outline. Use the small version for presence in chat, medium for setup support, and large only as an onboarding, daily-practice, or completion anchor.

### Session Metrics

Metrics use tabular numerals and very little chrome. On cream, separate rows with Sage Border dividers. On Night Forest, place three values in a border-y band with Soft Forest labels. Keep labels short and factual.

## Do's and Don'ts

### Do:

- **Do** keep the experience adult, warm, and practical through restrained color, direct copy, and generous breathing room.
- **Do** use Coral to show voice, progress, focus, or the next committed action.
- **Do** preserve a text path for every voice interaction and a clear voice-state label.
- **Do** align conversation header, message stream, and composer to one narrow reading column.
- **Do** use Mia's organic portrait as the recurring human anchor across setup, practice, conversation, and completion.
- **Do** respect reduced-motion preferences by removing the listening ripple and nonessential shimmer.

### Don't:

- **Don't** turn progress into points, badges, confetti, or a childish game layer.
- **Don't** use Coral as a large background when Night Forest or Quiet Cream should carry the structure.
- **Don't** box every metric or message; prefer dividers, spacing, and tonal hierarchy.
- **Don't** invent pronunciation scoring or visual language that implies analysis beyond the transcript.
- **Don't** introduce hard black shadows, sharp rectangular primary actions, or crowded persistent navigation.
- **Don't** let decorative portraits reduce the available space for the primary action on small screens.

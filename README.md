# Before the Face — Chapter One

An expanded playable prototype of a modern dating game. Meet people gradually, choose whom to spend time with, and keep early connections open. Faces stay hidden until the first in-person meeting.

## Play

Open `index.html` in a browser, or run `python3 -m http.server 4317 --bind 127.0.0.1` from this folder and visit http://127.0.0.1:4317.

`../output/Before the Face.html` is the complete single-file offline version. No account, installation, AI model, API key, or network connection is required for the downloaded file.

Choose a person from the calendar. Click a reply or press 1–5. The entire conversation stays in the same time slot, and the transcript remains scrollable. Finish with a goodbye to return to the calendar. Text replies send first, show a delivered/read status, then arrive in separate bubbles after a short typing pause. Longer messages take a little longer (at most 2.6 seconds per bubble). Choose “Show reply now” to skip the remaining delivery. Pause freezes the wait; resuming continues it. Reloading restores the completed exchange without resending your choice. In-person conversations do not use phone typing indicators.

## Included in this chapter

- An illustrated neighborhood title screen and photo covers on the calendar.
- Six authored photo messages (one per character), introduced in relevant conversation moments. Tap a photo to enlarge it; shared photos remain in conversation history. Photos contain everyday objects and places, never an early face reveal.
- Six adults: Alex, Ben, Morgan, Maya, Daniel, and Sam.
- Thirty authored conversations, five per character. Each has a greeting, four reply decisions, and a closing. The fifth is a full in-person conversation.
- Five answer options at each decision: 120 decisions and 600 authored options in total, with some contextual variants.
- Independent progress for every person. No route selection locks out other characters.
- An afternoon and evening per day. People have busy days and space between catch-ups. They do not send automatic pressure messages when ignored.
- Earlier preferences and decisions referenced in later dialogue; warmth, discomfort, flirting, friendship, incompatible futures, apologies, and characters choosing to stop.
- Coffee appointments with specific dates, automatic avoidance of overlapping bookings, advance rescheduling, and a small relationship consequence for missing a booked meeting. Unbooked rest has no penalty.
- Optional explicit exclusivity discussion after a successful first meeting and enough romantic interest. Other connections remain available as friendships.
- A phone interface with a handset frame, status bar, animated outgoing/incoming bubbles, typing dots, and a skippable reply delay. Reduced-motion settings disable moving dots and bubble transitions.
- A skippable first-person café approach, hidden portraits until arrival, and reduced-motion support.
- Conversation history, text export, browser-local saves, replay, and a month summary. The summary lets you continue unfinished conversations after day 28.

## Scope

This is a finite first chapter and relationship-system prototype, not a finished life simulation. There are no playable second dates, ongoing employment/home systems, long-term partnership stories, or simulated conversations beyond the authored material. The calendar provides freedom to choose people and timing; each character's five major conversations occur in order, with answers and outcomes that respond to decisions.

There is no visible relationship score. Internally the story tracks trust, expressed interest, and particular decisions to support consequences; it is not a personality assessment. No unrestricted AI chat is used. Audio and voice acting are not included.

## Saves and previous versions

This chapter uses a new save slot (`before-the-face-v3`). The earlier prototype's slot is left untouched because its single-person progress cannot faithfully map to the new calendar. Resetting this chapter asks for confirmation. Export any chats you want to keep first.

Browser storage is per origin. `localhost`, `127.0.0.1`, and a downloaded file can have separate saves. If storage is unavailable, play continues for the session. The v2 project archive was preserved as `../output/before-the-face-v2.zip`.

## Assets and provenance

The interface, abstract avatars, room scene, and animation are custom HTML/CSS, with no purchased theme or game asset pack. The approach uses layered scenery and camera movement, not a rigged walking character or freely navigable 3D world.

Portraits and café art depict fictional people and were generated with the built-in `image_gen` tool. Original artwork and prompts are retained. Three new portraits are saved at:

- `assets/maya.png`
- `assets/daniel.png`
- `assets/sam.png`

Their exact final prompts and generation mode are in `new-character-prompts.json`. Earlier café/Alex/Ben/Morgan art uses `assets/cafe.png`, `assets/alex.png`, `assets/jamie.png`, and `assets/rowan.png`; the original filenames are preserved. Their original prompts are in `asset-prompts.json`.

## Editing and verification

- `conversations.js`: all dialogue, response choices, and decision-specific variants.
- `story.js`: character definitions, calendar, per-person state, consequences, save validation.
- `app.js`: screens, controls, history, and animation controller.
- `style.css`: responsive visual design and animation.
- `package.py`: rebuilds the offline HTML and source ZIP in `../output/`.

Run `node tests/photos.test.js` for all six photo moments, save compatibility, history, and attachment validation. Run `node tests/story.test.js` for all 600 answer checks and targeted calendar/relationship/save tests. Run `node tests/animation.test.js` for animation completion, skipping, cancellation, resume, and reduced motion. Run `node tests/messaging.test.js` for delivery order, skipping, rapid input, pause/resume, saved reload, final replies, and in-person behavior. `tests/browser.test.js` is an optional Playwright regression runner with development-machine paths to adjust elsewhere. Live browser checks cover desktop/mobile layout, chat continuation and reload, independent connections, appointment booking, and reveal.

## Neighborhood and message photos

Seven new assets were generated with the built-in `image_gen` tool. Exact prompts are in `photo-prompts.json`. Final files are `assets/neighborhood.png`, `assets/alex-books.png`, `assets/ben-noodles.png`, `assets/morgan-chair.png`, `assets/maya-cupboard.png`, `assets/daniel-walk.png`, and `assets/sam-cat.png`. They are embedded in the offline version. Photo IDs are saved alongside the introducing message; older saves without photos still load unchanged. Already-completed conversations are not rewritten.

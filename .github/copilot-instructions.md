# Copilot Instructions for Fighter Game

## Project goals

- Build a browser-based fighting game with simple, readable architecture.
- Keep gameplay logic separate from UI rendering.
- Prefer small, focused modules with single responsibility.
- Maintain clean state flow: data -> game logic -> render -> user input.

## Architecture rules

- App bootstrap is only for loading app state and starting screens.
- UI components are responsible only for DOM rendering and user events.
- Game logic must live in a pure domain layer and must not depend on DOM or browser APIs.
- Service layer is responsible only for fetching or transforming data.
- Styles are separate from logic; do not mix CSS and gameplay logic in the same module.

## Required separation

### 1. App layer

- Files like app.js or entry points may bootstrap the app.
- They can initialize the page, load data, and start the game.
- They should not contain combat rules.

### 2. Game / domain layer

- Place pure battle logic here.
- Handle:
  - hit power
  - block power
  - damage calculation
  - critical hits
  - winner detection
  - fighter state updates
- This layer must not use:
  - document.querySelector
  - addEventListener
  - DOM element manipulation
  - CSS classes

### 3. UI layer

- Components render fighters, health bars, modal windows, and arena.
- They may:
  - read DOM
  - update classes
  - animate elements
  - react to keyboard input
- They should call the game engine and use its results to render state.

### 4. Service layer

- Fetch fighter data, details, and other application data.
- Keep service code focused on API/data access.
- Do not include battlefield rules or animation logic here.

## Coding rules

- Prefer small functions with clear names.
- Keep functions pure where possible.
- Avoid huge monolithic files.
- Use descriptive names for fighter state, damage logic, and winner logic.
- Keep domain rules testable without the browser.
- Do not introduce random DOM logic into battle calculations.

## Combat logic rules

- Damage must be calculated from attack, defense, and randomness.
- Blocking must reduce incoming damage.
- Critical hits must be a special branch of attack resolution.
- Health should never go below 0.
- Winner must be determined once a fighter reaches 0 HP.

## Styling rules

- Use CSS for positioning, animation, and visual state.
- Do not create gameplay logic inside CSS or inline scripts.
- Use semantic CSS classes such as:
  - arena\_\_\_fighter
  - arena\_\_\_fighter--hit
  - arena\_\_\_fighter--block
  - arena\_\_\_fighter--critical

## Refactoring expectations

- When a file mixes UI and gameplay logic, split it.
- Prefer extracting battle logic into a dedicated module before adding new features.
- Do not add new DOM-dependent logic inside combat rules.

## Output expectations

- Keep code simple and maintainable.
- Prefer deterministic logic and clear state transitions.
- Preserve current game mechanics while improving structure.

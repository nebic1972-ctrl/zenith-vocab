# Reading Engines

This directory contains modular, swappable reading engine implementations.

## Architecture Philosophy

- **Isolation**: Each engine is self-contained
- **Interchangeability**: Engines can be swapped without touching UI code
- **Testability**: Engines are pure logic, easy to test
- **Extensibility**: New engines can be added without modifying existing code

## Current Engines

### RSVPEngine (Planned)
- Rapid Serial Visual Presentation
- Word-by-word display with ORP (Optimal Recognition Point)
- Current implementation: `src/app/page.tsx` (to be refactored)

## Future Engines

### BionicEngine (Planned)
- Bionic Reading paradigm
- Partial word highlighting
- Guided eye movement

### AdaptiveEngine (Planned)
- Multi-engine wrapper
- Automatic engine selection based on user performance
- Seamless engine switching

## Usage Pattern

```typescript
// Example: Future engine interface
interface IReadingEngine {
  initialize(content: string, config: EngineConfig): void;
  start(): void;
  pause(): void;
  stop(): void;
  getCurrentWord(): string;
  getProgress(): number;
  subscribe(callback: (word: string) => void): () => void;
}
```

## Migration Path

1. Extract RSVP logic from `page.tsx` → `RSVPEngine.ts`
2. Create engine factory/registry
3. Update `page.tsx` to use engine interface
4. Add new engines incrementally

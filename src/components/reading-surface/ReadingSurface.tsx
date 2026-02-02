/**
 * ReadingSurface Component
 * 
 * Primary reading interface with cognitive flow design.
 * Optimized for focus, minimal distractions, stable rendering.
 */

'use client';

interface ReadingSurfaceProps {
  readonly content: string;
  readonly className?: string;
}

export function ReadingSurface({
  content,
  className,
}: ReadingSurfaceProps): JSX.Element {
  return (
    <div
      className={`reading-surface reading-optimized px-6 py-8 rounded-lg ${className ?? ''}`}
    >
      <div className="prose prose-slate max-w-none">
        <p className="text-reading-text leading-relaxed">{content}</p>
      </div>
    </div>
  );
}

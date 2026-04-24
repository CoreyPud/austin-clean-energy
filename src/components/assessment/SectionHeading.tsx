interface SectionHeadingProps {
  emoji: string;
  title: string;
  subtitle?: string;
}

const SectionHeading = ({ emoji, title, subtitle }: SectionHeadingProps) => (
  <div className="flex items-end gap-3 pt-2">
    <div className="flex items-center gap-2">
      <span className="text-2xl leading-none" aria-hidden="true">
        {emoji}
      </span>
      <div>
        <h2 className="text-xl font-bold text-foreground leading-tight">{title}</h2>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
    <div className="flex-1 h-px bg-gradient-to-r from-primary/30 via-border to-transparent" />
  </div>
);

export default SectionHeading;

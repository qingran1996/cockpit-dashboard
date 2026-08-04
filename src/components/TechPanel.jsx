export function TechPanel({ tone = 'cyan', title, className = '', children }) {
  return (
    <section className={`tech-panel ${className}`} data-tone={tone}>
      <i className="tech-corner tech-corner--tl" />
      <i className="tech-corner tech-corner--tr" />
      <i className="tech-corner tech-corner--bl" />
      <i className="tech-corner tech-corner--br" />
      {title && (
        <header className="tech-panel__header">
          <span className="tech-panel__flare" />
          <h2>{title}</h2>
          <span className="tech-panel__tracks"><b /><b /><b /></span>
        </header>
      )}
      <div className="tech-panel__body">{children}</div>
    </section>
  )
}

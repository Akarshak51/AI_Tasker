import { useState, useRef, useEffect } from 'react';
import { useTheme, THEMES } from '../context/ThemeContext.jsx';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const current = THEMES.find((t) => t.id === theme) || THEMES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-8 h-8 rounded-full border border-theme flex items-center justify-center transition-transform hover:scale-105"
        style={{ backgroundColor: current.swatch }}
        aria-label="Change theme"
      />
      {open && (
        <div className="absolute right-0 mt-2 w-40 surface border border-theme rounded-xl shadow-lg overflow-hidden animate-popIn">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTheme(t.id);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent-soft transition-colors"
            >
              <span className="w-4 h-4 rounded-full border border-theme" style={{ backgroundColor: t.swatch }} />
              {t.label}
              {t.id === theme && <span className="ml-auto text-accent text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

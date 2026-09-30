import { useEffect, useRef, useState } from 'react';

export default function ProfileMenu({ onSignOut }) {
  const [open, setOpen] = useState(false);
  const container = useRef(null);
  const trigger = useRef(null);
  useEffect(() => {
    if (!open) return;
    const dismiss = event => {
      if (!container.current?.contains(event.target)) setOpen(false);
    };
    const escape = event => {
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  return <div className="profile-menu" ref={container} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <button ref={trigger} type="button" className="profile profile-trigger"
      aria-label="Account options" aria-expanded={open} aria-controls="account-options"
      onClick={() => setOpen(value => !value)}>
      <div>AY</div><span><b>Admin User</b><small>Administrator</small></span>
      <i aria-hidden="true">{open ? '▴' : '▾'}</i>
    </button>
    {open && <div className="profile-dropdown" id="account-options">
      <p>Admin User<small>Administrator</small></p>
      <button type="button" onClick={onSignOut}>Sign out <span aria-hidden="true">↗</span></button>
    </div>}
  </div>;
}

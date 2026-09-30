import { useEffect, useRef, useState } from 'react';

export default function WorkspaceBackground() {
  const video = useRef(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPlayback = () => {
      if (!video.current) return;
      if (paused || preference.matches || document.hidden) video.current.pause();
      else video.current.play().catch(() => {});
    };
    syncPlayback();
    preference.addEventListener('change', syncPlayback);
    document.addEventListener('visibilitychange', syncPlayback);
    return () => {
      preference.removeEventListener('change', syncPlayback);
      document.removeEventListener('visibilitychange', syncPlayback);
    };
  }, [paused]);
  return <>
    <div className="workspace-video" aria-hidden="true">
      <video ref={video} muted loop playsInline preload="metadata" poster="/media/master-waves.jpg">
        <source src="/media/master-waves.mp4" type="video/mp4" />
      </video>
    </div>
    <button className="background-toggle" onClick={() => setPaused(value => !value)} aria-pressed={paused} aria-label={paused ? 'Play background animation' : 'Pause background animation'}>
      {paused ? '▶ Play background' : 'Ⅱ Pause background'}
    </button>
  </>;
}

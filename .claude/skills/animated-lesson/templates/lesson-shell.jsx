// lesson-shell.jsx — loads lesson JSON, validates it, mounts <Stage> with
// the rendered scenes. Persistent chrome (wordmark, scene label, progress dots,
// scene counter) overlays on top.

function loadLessonContent() {
  const node = document.getElementById('lesson-content');
  if (!node) {
    console.error('[lesson-shell] No <script id="lesson-content"> found in HTML.');
    return null;
  }
  try {
    return JSON.parse(node.textContent);
  } catch (e) {
    console.error('[lesson-shell] Failed to parse lesson JSON:', e);
    return null;
  }
}

function Chrome({ lesson }) {
  const t = useTime();
  const scenes = lesson.scenes;
  const currentIdx = scenes.findIndex(sc => t >= sc.start && t < sc.start + sc.duration);
  const safeIdx = currentIdx < 0 ? scenes.length - 1 : currentIdx;
  const currentLabel = scenes[safeIdx].label || scenes[safeIdx].id;
  const brandLabel = lesson.lesson.brandLabel || 'Sample Academy';

  return (
    <>
      <div style={{
        position: 'absolute', left: 56, top: 40,
        display: 'flex', alignItems: 'baseline', gap: 0,
        fontFamily: BRAND.font, fontSize: 22, fontWeight: 700,
        letterSpacing: '-0.02em', color: BRAND.text, zIndex: 10,
      }}>
        <span style={{ color: BRAND.accent, fontWeight: 800 }}>
          {brandLabel.match(/^(\S+)/)?.[1] || brandLabel}
        </span>
        <span style={{ fontWeight: 400, marginLeft: 8, color: BRAND.textMuted, fontSize: 18 }}>
          {brandLabel.replace(/^\S+\s*/, '')}
        </span>
      </div>

      <SceneLabel label={currentLabel}/>

      <div style={{
        position: 'absolute', left: 56, bottom: 44,
        display: 'flex', gap: 8, zIndex: 10,
      }}>
        {scenes.map((sc, i) => {
          const isActive = i === safeIdx;
          const isDone = t >= sc.start + sc.duration;
          let fill = 0;
          if (isActive) fill = clamp((t - sc.start) / sc.duration, 0, 1);
          else if (isDone) fill = 1;
          return (
            <div key={sc.id || i} style={{
              position: 'relative',
              width: isActive ? 48 : 8, height: 8,
              borderRadius: 4,
              background: BRAND.borderStrong,
              transition: 'width 0.4s ease',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${fill * 100}%`,
                background: BRAND.accent,
              }}/>
            </div>
          );
        })}
      </div>

      <div style={{
        position: 'absolute', right: 56, bottom: 40,
        fontFamily: BRAND.mono, fontSize: 14,
        color: BRAND.textMuted, fontWeight: 500,
        letterSpacing: '0.05em', zIndex: 10,
      }}>
        {String(safeIdx + 1).padStart(2, '0')} / {String(scenes.length).padStart(2, '0')}
      </div>
    </>
  );
}

function SceneLabel({ label }) {
  const [shown, setShown] = React.useState(label);
  const [op, setOp] = React.useState(1);

  React.useEffect(() => {
    if (shown === label) return;
    setOp(0);
    const id = setTimeout(() => { setShown(label); setOp(1); }, 200);
    return () => clearTimeout(id);
  }, [label, shown]);

  return (
    <div style={{
      position: 'absolute', right: 56, top: 44,
      fontFamily: BRAND.font, fontSize: 14, fontWeight: 500,
      color: BRAND.textMuted, letterSpacing: '0.04em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      opacity: op,
      transition: 'opacity 0.25s',
      zIndex: 10,
    }}>{shown}</div>
  );
}

function App() {
  const lesson = React.useMemo(() => loadLessonContent(), []);

  React.useEffect(() => {
    if (lesson) validateLesson(lesson);
  }, [lesson]);

  if (!lesson) {
    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: '#1c1c1c', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'monospace', fontSize: 14, padding: 40, textAlign: 'center',
      }}>Failed to load lesson content. Check the &lt;script id="lesson-content"&gt; JSON block.</div>
    );
  }

  return (
    <Stage
      width={1920} height={1080}
      duration={lesson.lesson.duration}
      background={BRAND.bgBase}
      loop={true}
      autoplay={true}
      persistKey={`lesson-${lesson.id}`}
    >
      {lesson.scenes.map(scene => renderScene(scene))}
      <Chrome lesson={lesson}/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

// lesson-renderer.jsx — data-driven scene renderer.
// Takes a parsed lesson JSON and renders each scene as the appropriate
// component based on scene.type. All scenes read text/data from scene.content.
//
// To add a new scene type:
//   1. Add a function below following the pattern of the others.
//   2. Add a case to renderScene() at the bottom.
//   3. Document the content schema in references/03-scene-catalog.md.

const B = window.BRAND;

// ─── Parser: convert "Foo *bar* baz" → [<span>Foo </span>, <span accent>bar</span>, <span> baz</span>]
function parseAccents(text, accentColor = B.accent) {
  if (text == null) return null;
  const parts = String(text).split(/\*([^*]+)\*/g);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <span key={i} style={{ color: accentColor }}>{part}</span>
      : <React.Fragment key={i}>{part}</React.Fragment>
  );
}

// ─── SceneFrame: gates visibility + fades the whole scene in/out
function SceneFrame({ start, end, fadeIn = 0.5, fadeOut = 0.5, children, background, sceneId }) {
  return (
    <Sprite start={start - 0.05} end={end}>
      {({ localTime, duration }) => {
        const exitStart = duration - fadeOut;
        let op = 1;
        if (localTime < fadeIn) op = clamp(localTime / fadeIn, 0, 1);
        else if (localTime > exitStart) op = 1 - clamp((localTime - exitStart) / fadeOut, 0, 1);
        return (
          <div
            data-scene-id={sceneId}
            data-screen-label={sceneId}
            style={{
              position: 'absolute', inset: 0,
              background: background || B.bgBase,
              opacity: op,
            }}
          >{children}</div>
        );
      }}
    </Sprite>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCENE TYPE: cover
// ═══════════════════════════════════════════════════════════════════════════
function SceneCover({ scene, sceneStart: s }) {
  const c = scene.content;
  const titleLines = Array.isArray(c.title) ? c.title : [c.title];
  return (
    <SceneFrame start={s} end={s + scene.duration} sceneId={scene.id}>
      <FadeIn start={s + 0.3} duration={0.5} from="down" distance={12}
        style={{ position: 'absolute', left: 200, top: 220 }}>
        <Eyebrow>{c.eyebrow}</Eyebrow>
      </FadeIn>

      <div style={{ position: 'absolute', left: 200, top: 268, width: 1620 }}>
        {titleLines.map((line, i) => (
          <FadeIn key={i} start={s + 0.55 + i * 0.4} duration={0.7} from="down" distance={36}>
            <div data-beat-id={`title-line-${i + 1}`} style={{
              fontFamily: B.font, fontSize: 108, fontWeight: 700,
              letterSpacing: '-0.035em', lineHeight: 1.02,
              color: B.text, whiteSpace: 'nowrap',
              marginTop: i === 0 ? 0 : 4,
            }}>{parseAccents(line)}</div>
          </FadeIn>
        ))}
      </div>

      {c.sub && (
        <FadeIn start={s + 1.6} duration={0.6} from="down" distance={12}
          style={{ position: 'absolute', left: 200, top: 540, maxWidth: 1100 }}>
          <div data-beat-id="sub" style={{ fontSize: 26, color: B.textMuted, lineHeight: 1.5, fontWeight: 500 }}>
            {parseAccents(c.sub)}
          </div>
        </FadeIn>
      )}

      {c.stats && c.stats.length > 0 && (
        <FadeIn start={s + 2.4} duration={0.5} from="down" distance={20}
          style={{ position: 'absolute', left: 200, top: 720, width: 1320 }}>
          <div style={{
            display: 'grid', gridTemplateColumns: `repeat(${c.stats.length}, 1fr)`,
            borderTop: `1px solid ${B.borderStrong}`, borderBottom: `1px solid ${B.borderStrong}`,
          }}>
            {c.stats.map((stat, i) => (
              <div key={stat.id || i} data-beat-id={stat.id || `stat-${i}`} style={{
                padding: '36px 32px',
                borderRight: i < c.stats.length - 1 ? `1px solid ${B.border}` : 'none',
              }}>
                <div style={{
                  fontSize: 76, fontWeight: 600, color: B.accent,
                  letterSpacing: '-0.015em', lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  <CountUp from={0} to={stat.value} start={s + 2.6 + i * 0.25} duration={1.0}/>
                  {stat.suffix && (
                    <span style={{
                      fontSize: 30, fontWeight: 500, color: B.textMuted,
                      marginLeft: 4, letterSpacing: 0,
                    }}>{stat.suffix}</span>
                  )}
                </div>
                <div style={{
                  marginTop: 18, fontSize: 14, fontWeight: 500,
                  color: B.textMuted, textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </FadeIn>
      )}
    </SceneFrame>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCENE TYPE: journey-map
// ═══════════════════════════════════════════════════════════════════════════
function SceneJourneyMap({ scene, sceneStart: s }) {
  const c = scene.content;
  const stops = c.stops || [];
  const activeIdx = stops.findIndex(st => st.state === 'active');
  const activeFraction = activeIdx >= 0 ? (activeIdx) / (stops.length - 1) : 0;
  // Compute the fill width: center-to-center of stop column = (1 / stops.length).
  // We fill from the first center to the active center.
  return (
    <SceneFrame start={s} end={s + scene.duration} background={B.bgAlt} sceneId={scene.id}>
      <SceneTitle eyebrow={c.eyebrow} title={c.title} x={200} y={280} start={s + 0.2}/>
      {c.sub && (
        <FadeIn start={s + 0.9} duration={0.5} from="down" distance={12}
          style={{ position: 'absolute', left: 200, top: 460, maxWidth: 900 }}>
          <div style={{ fontSize: 24, color: B.textMuted, lineHeight: 1.5, fontWeight: 500 }}>
            {parseAccents(c.sub)}
          </div>
        </FadeIn>
      )}

      <div style={{
        position: 'absolute', left: 200, right: 200, top: 720,
        display: 'grid', gridTemplateColumns: `repeat(${stops.length}, 1fr)`,
      }}>
        <FadeIn start={s + 1.5} duration={0.4} from="left" distance={0}
          style={{
            position: 'absolute', left: `${(0.5 / stops.length) * 100}%`,
            right: `${(0.5 / stops.length) * 100}%`, top: 14,
            height: 2, background: B.borderStrong, zIndex: 0,
          }}> </FadeIn>
        <DrawLine start={s + 2.0} duration={1.0}
          style={{
            position: 'absolute', left: `${(0.5 / stops.length) * 100}%`, top: 14,
            height: 2, background: B.accent, zIndex: 1,
          }}
          targetWidth={`${activeFraction * (1 - 1 / stops.length) * 100}%`}/>

        {stops.map((stop, i) => (
          <FadeIn key={stop.id || i} start={s + 1.6 + i * 0.12} duration={0.45} from="down" distance={16}>
            <div data-beat-id={stop.id || `stop-${i}`} style={{
              position: 'relative', zIndex: 2,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              textAlign: 'center', padding: '0 12px',
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 15,
                background: stop.state === 'todo' ? B.bgBase : B.accent,
                border: `2px solid ${stop.state === 'todo' ? B.borderStrong : B.accent}`,
                boxShadow: stop.state === 'active' ? `0 0 0 8px ${B.accentSoft}` : 'none',
                marginBottom: 24,
              }}/>
              <div style={{
                fontSize: 13, fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: stop.state === 'active' ? B.accent : B.textMuted,
                marginBottom: 8,
              }}>{stop.label}</div>
              <div style={{
                fontSize: 18, fontWeight: 600, lineHeight: 1.25,
                color: stop.state === 'active' ? B.accent : B.text,
              }}>{stop.title}</div>
              {stop.state === 'active' && (
                <FadeIn start={s + 3.0} duration={0.4} from="down" distance={6}>
                  <div style={{
                    marginTop: 16, fontSize: 11, fontWeight: 700,
                    letterSpacing: '0.16em', textTransform: 'uppercase',
                    background: B.accent, color: B.bgCard,
                    padding: '5px 10px', borderRadius: 2,
                    display: 'inline-block',
                  }}>You are here</div>
                </FadeIn>
              )}
            </div>
          </FadeIn>
        ))}
      </div>
    </SceneFrame>
  );
}

function DrawLine({ start, duration, style, targetWidth }) {
  const t = useTime();
  const local = clamp((t - start) / duration, 0, 1);
  const eased = Easing.easeInOutCubic(local);
  return <div style={{ ...style, width: `calc(${targetWidth} * ${eased})` }}/>;
}

// ═══════════════════════════════════════════════════════════════════════════
// SCENE TYPE: comparison-chats (the tether scene)
// ═══════════════════════════════════════════════════════════════════════════
function SceneComparisonChats({ scene, sceneStart: s }) {
  const c = scene.content;
  const tools = c.tools || [];
  // Layout the chat windows side-by-side at standard positions.
  const totalWidth = 1920 - 360;             // 180 margin each side
  const gap = 36;
  const windowWidth = (totalWidth - gap * (tools.length - 1)) / tools.length;
  const startX = 180;

  return (
    <SceneFrame start={s} end={s + scene.duration} sceneId={scene.id}>
      <FadeIn start={s + 0.2} duration={0.5} from="down" distance={10}
        style={{ position: 'absolute', left: 200, top: 100 }}>
        <Eyebrow>{c.eyebrow}</Eyebrow>
      </FadeIn>
      <FadeIn start={s + 0.4} duration={0.6} from="down" distance={18}
        style={{ position: 'absolute', left: 200, top: 138, width: 1620 }}>
        <div style={{
          fontFamily: B.font, fontSize: 56, fontWeight: 700,
          letterSpacing: '-0.025em', lineHeight: 1.0, color: B.text,
        }}>{parseAccents(c.title)}</div>
      </FadeIn>

      {tools.map((tool, i) => (
        <GlidingChat
          key={tool.id || i}
          beatId={tool.id || `tool-${i}`}
          start={s + 1.0 + i * 0.25}
          x={startX + i * (windowWidth + gap)} y={280}
          width={windowWidth} height={620}
          title={tool.name} logoId={tool.logo}
          composerStart={s + 2.3 + i * 0.2}
          promptText={c.prompt}
          thinkStart={s + 5.0 + i * 0.2}
          responseStart={s + 7.0 + i * 0.2}
          response={tool.response}
        />
      ))}

      {c.tether && (
        <Tether
          d={`M ${startX + windowWidth/2} 875 C ${startX + windowWidth} 940, ${startX + windowWidth * 1.5 + gap} 940, ${startX + totalWidth/2} 875 C ${startX + totalWidth * 0.7} 830, ${startX + totalWidth * 0.85} 950, ${startX + totalWidth - windowWidth/2} 875`}
          start={s + 5.0} drawDur={1.4}
          strokeWidth={3} color={B.accent}
        />
      )}

      {c.caption && (
        <FadeIn start={s + scene.duration - 3.5} duration={0.5} from="down" distance={10}
          style={{ position: 'absolute', left: 0, right: 0, top: 970, textAlign: 'center' }}>
          <div data-beat-id="caption" style={{
            fontSize: 22, fontWeight: 500, color: B.text,
            letterSpacing: '-0.01em',
          }}>{parseAccents(c.caption)}</div>
        </FadeIn>
      )}
    </SceneFrame>
  );
}

function GlidingChat({ start, beatId, x, y, width, height, title, logoId,
  composerStart, promptText, thinkStart, responseStart, response }) {
  const t = useTime();
  const slideLocal = clamp((t - start) / 0.7, 0, 1);
  const slideEased = Easing.easeOutCubic(slideLocal);
  const ty = (1 - slideEased) * 80;
  const op = slideEased;

  const promptDur = 2.0;
  const typeLocal = clamp((t - composerStart) / promptDur, 0, 1);
  const chars = Math.floor(typeLocal * (promptText || '').length);
  const composerVisible = t >= composerStart;
  const sendTime = composerStart + promptDur + 0.25;
  const sent = t >= sendTime;
  const showCaret = composerVisible && !sent && (t - composerStart) < promptDur + 0.4;
  const blink = Math.floor(t * 2) % 2 === 0;

  const thinking = t >= thinkStart && t < responseStart;
  const respDur = 3.0;
  const respLocal = clamp((t - responseStart) / respDur, 0, 1);
  const respChars = Math.floor(Easing.easeOutCubic(respLocal) * (response || '').length);
  const respVisible = (response || '').slice(0, respChars);

  return (
    <div data-beat-id={beatId} style={{
      position: 'absolute', left: x, top: y,
      width, height,
      transform: `translateY(${ty}px)`, opacity: op,
      background: B.bgCard,
      border: `1px solid ${B.border}`,
      borderRadius: 14,
      boxShadow: '0 30px 60px -20px rgba(28,28,28,0.20), 0 8px 24px -8px rgba(28,28,28,0.08)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{
        padding: '16px 22px', borderBottom: `1px solid ${B.border}`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        {logoId && <svg width="26" height="26"><use href={`#${logoId}`}/></svg>}
        <div style={{
          fontSize: 17, fontWeight: 600, color: B.text,
          letterSpacing: '-0.01em', flex: 1,
        }}>{title}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0,1,2].map(i => <span key={i} style={{ width: 8, height: 8, borderRadius: 4, background: B.border }}/>)}
        </div>
      </div>

      <div style={{
        flex: 1, padding: '22px 22px',
        display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden',
      }}>
        {sent && (
          <FadeIn start={sendTime} duration={0.4} from="up" distance={10}>
            <div style={{
              alignSelf: 'flex-end', marginLeft: 'auto', maxWidth: '90%',
              padding: '11px 15px', borderRadius: 14,
              background: B.bgDark,
              border: `1px solid ${B.border}`,
              fontSize: 15, lineHeight: 1.45, fontWeight: 500,
              color: B.text,
            }}>{promptText}</div>
          </FadeIn>
        )}
        {thinking && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <ThinkingPinwheel size={26}/>
            <div style={{ fontSize: 14, color: B.textMuted, fontWeight: 500 }}>Thinking…</div>
          </div>
        )}
        {t >= responseStart && (
          <div style={{
            fontSize: 16, lineHeight: 1.6, fontWeight: 500,
            color: B.text, letterSpacing: '-0.005em',
          }}>{respVisible}</div>
        )}
      </div>

      <div style={{
        padding: '14px 22px 18px', borderTop: `1px solid ${B.border}`,
      }}>
        <div style={{
          padding: '12px 16px', background: B.bgBase,
          borderRadius: 22, fontSize: 14,
          color: (composerVisible && !sent) ? B.text : B.textDim,
          fontWeight: 500, minHeight: 22,
          display: 'flex', alignItems: 'center',
        }}>
          {sent ? 'Ask anything…'
            : composerVisible ? <>
                {(promptText || '').slice(0, chars)}
                {showCaret && (
                  <span style={{
                    display: 'inline-block', width: 2, height: 16,
                    marginLeft: 2, background: B.accent,
                    opacity: blink ? 1 : 0.25,
                  }}/>
                )}
              </>
            : 'Ask anything…'}
        </div>
      </div>
    </div>
  );
}

function ThinkingPinwheel({ size = 24 }) {
  const t = useTime();
  const segments = 8;
  const cx = size / 2, cy = size / 2, r = size / 2 - 3;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {Array.from({ length: segments }).map((_, i) => {
        const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
        const dx = cx + r * Math.cos(angle);
        const dy = cy + r * Math.sin(angle);
        const phase = ((t * 1.4) - i / segments) % 1;
        const opacity = phase < 0 ? phase + 1 : phase;
        return <circle key={i} cx={dx} cy={dy} r={size * 0.08}
          fill={B.accent} opacity={0.15 + opacity * 0.85}/>;
      })}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCENE TYPE: tool-card-reveal
// ═══════════════════════════════════════════════════════════════════════════
function SceneToolCardReveal({ scene, sceneStart: s }) {
  const c = scene.content;
  const tools = c.tools || [];
  const t = useTime();
  return (
    <SceneFrame start={s} end={s + scene.duration} background={B.bgAlt} sceneId={scene.id}>
      <SceneTitle eyebrow={c.eyebrow} title={c.title} x={200} y={180} start={s + 0.2}/>
      {c.sub && (
        <FadeIn start={s + 0.9} duration={0.5} from="down" distance={10}
          style={{ position: 'absolute', left: 200, top: 360, maxWidth: 920 }}>
          <div style={{ fontSize: 22, color: B.textMuted, lineHeight: 1.5, fontWeight: 500 }}>
            {parseAccents(c.sub)}
          </div>
        </FadeIn>
      )}
      <div style={{
        position: 'absolute', left: 180, right: 180, top: 480,
        display: 'grid', gridTemplateColumns: `repeat(${tools.length}, 1fr)`, gap: 18,
      }}>
        {tools.map((tool, i) => {
          const tt = 1.6 + i * 0.8;
          const local = t - (s + tt);
          const highlighted = local > 0 && local < 1.3;
          return (
            <FadeIn key={tool.id || i} start={s + tt} duration={0.55} from="down" distance={28}>
              <div data-beat-id={tool.id || `tool-${i}`} style={{
                background: B.bgCard,
                border: `1px solid ${highlighted ? B.accent : B.border}`,
                borderRadius: B.radius,
                padding: '34px 28px', minHeight: 340,
                display: 'flex', flexDirection: 'column',
                boxShadow: highlighted
                  ? '0 18px 40px rgba(28,28,28,0.12)'
                  : '0 4px 12px rgba(28,28,28,0.04)',
                transform: highlighted ? 'translateY(-6px)' : 'translateY(0)',
                transition: 'transform 0.4s, box-shadow 0.4s, border-color 0.4s',
              }}>
                {tool.logo && (
                  <div style={{ width: 44, height: 44, marginBottom: 24 }}>
                    <svg width="44" height="44"><use href={`#${tool.logo}`}/></svg>
                  </div>
                )}
                <div style={{
                  fontSize: 24, fontWeight: 700, color: B.text,
                  letterSpacing: '-0.015em', marginBottom: 10,
                }}>{tool.name}</div>
                {tool.tag && <div style={{
                  fontSize: 12, fontWeight: 700, color: B.accent,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  marginBottom: 14,
                }}>{tool.tag}</div>}
                {tool.oneliner && <div style={{
                  fontSize: 14, color: B.textMuted, lineHeight: 1.55,
                  fontWeight: 500, marginTop: 'auto',
                }}>{tool.oneliner}</div>}
              </div>
            </FadeIn>
          );
        })}
      </div>
    </SceneFrame>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCENE TYPE: capability-table
// ═══════════════════════════════════════════════════════════════════════════
function SceneCapabilityTable({ scene, sceneStart: s }) {
  const c = scene.content;
  return (
    <SceneFrame start={s} end={s + scene.duration} sceneId={scene.id}>
      <SceneTitle eyebrow={c.eyebrow} title={c.title} x={200} y={140} start={s + 0.2}/>

      <FadeIn start={s + 0.8} duration={0.5} from="down" distance={20}
        style={{ position: 'absolute', left: 200, right: 200, top: 320 }}>
        <div style={{
          background: B.bgCard, border: `1px solid ${B.border}`,
          borderRadius: B.radius, overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `2.2fr repeat(${c.headers.length}, 1fr)`,
            background: B.bgDark, fontSize: 16,
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            <div style={{ padding: '18px 22px' }}>Capability</div>
            {c.headers.map((h, i) => (
              <div key={i} style={{ padding: '18px 16px', textAlign: 'center' }}>{h}</div>
            ))}
          </div>
          {c.rows.map((row, ri) => (
            <CapRow key={row.id || ri} row={row} index={ri}
              cols={c.headers.length} startTime={s + 1.4 + ri * 0.32}/>
          ))}
        </div>
      </FadeIn>

      {c.footnote && (
        <FadeIn start={s + scene.duration - 4} duration={0.5} from="down" distance={10}
          style={{ position: 'absolute', left: 200, right: 200, top: 940 }}>
          <div data-beat-id="footnote" style={{
            fontSize: 16, color: B.textMuted, fontStyle: 'italic',
          }}>{c.footnote}</div>
        </FadeIn>
      )}
    </SceneFrame>
  );
}

function CapRow({ row, index, cols, startTime }) {
  const t = useTime();
  const local = clamp((t - startTime) / 0.4, 0, 1);
  const op = Easing.easeOutCubic(local);
  return (
    <div data-beat-id={row.id || `row-${index}`} style={{
      display: 'grid', gridTemplateColumns: `2.2fr repeat(${cols}, 1fr)`,
      borderTop: index === 0 ? 'none' : `1px solid ${B.border}`,
      opacity: op,
      transform: `translateY(${(1 - op) * 8}px)`,
    }}>
      <div style={{ padding: '16px 22px', fontWeight: 600, fontSize: 18 }}>{row.label}</div>
      {row.cells.map((cell, i) => (
        <div key={i} style={{
          padding: '16px 12px', textAlign: 'center',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Pill kind={cell}/>
        </div>
      ))}
    </div>
  );
}

function Pill({ kind }) {
  const map = {
    'B': { label: 'Best', bg: B.accent, color: B.bgCard, weight: 700 },
    'Y': { label: 'Yes', bg: B.bgDark, color: B.text, weight: 600 },
    'L': { label: 'Limited', bg: 'rgba(28,28,28,0.08)', color: B.textMuted, weight: 600 },
    '-': { label: '—', bg: 'transparent', color: B.textDim, weight: 500 },
  };
  const cell = map[kind] || map['-'];
  return (
    <span style={{
      display: 'inline-block', padding: '4px 14px',
      borderRadius: 14, background: cell.bg, color: cell.color,
      fontSize: 13, fontWeight: cell.weight, letterSpacing: '0.02em',
      minWidth: 56, textAlign: 'center',
    }}>{cell.label}</span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCENE TYPE: setup-checklist
// ═══════════════════════════════════════════════════════════════════════════
function SceneSetupChecklist({ scene, sceneStart: s }) {
  const c = scene.content;
  const items = c.items || [];
  return (
    <SceneFrame start={s} end={s + scene.duration} background={B.bgAlt} sceneId={scene.id}>
      <SceneTitle eyebrow={c.eyebrow} title={c.title} x={200} y={120} start={s + 0.2}/>
      {c.sub && (
        <FadeIn start={s + 0.9} duration={0.5} from="down" distance={10}
          style={{ position: 'absolute', left: 200, top: 290, maxWidth: 920 }}>
          <div style={{ fontSize: 22, color: B.textMuted, lineHeight: 1.5, fontWeight: 500 }}>
            {parseAccents(c.sub)}
          </div>
        </FadeIn>
      )}

      <div style={{
        position: 'absolute', left: 200, right: 200, top: 400,
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        {items.map((item, i) => (
          <SettingRow key={item.id || i} item={item} index={i} sceneStart={s}/>
        ))}
      </div>

      {c.cursor && (
        <Cursor start={s + 1.6} keyframes={[
          { t: 0,    x: 1620, y: 460 },
          ...items.map((item, i) => ({
            t: (item.activateAt || (1.8 + i * 1.9)) + 0.2,
            x: 1620, y: 470 + i * 90
          })),
          { t: scene.duration - 2, x: 1620, y: 470 + (items.length - 1) * 90 },
        ]}/>
      )}
    </SceneFrame>
  );
}

function SettingRow({ item, index, sceneStart }) {
  const t = useTime();
  const localStart = sceneStart + (item.activateAt != null ? item.activateAt : 1.8 + index * 1.9);
  const active = t >= localStart && t < localStart + 1.6;
  const done = t >= localStart + 1.6;
  return (
    <FadeIn start={sceneStart + 0.9 + (index + 1) * 0.12} duration={0.5} from="down" distance={16}>
      <div data-beat-id={item.id || `item-${index}`} style={{
        background: B.bgCard,
        border: `1px solid ${active ? B.accent : B.border}`,
        borderRadius: B.radius,
        padding: '22px 30px',
        display: 'grid',
        gridTemplateColumns: '54px 1fr auto',
        gap: 24, alignItems: 'center',
        boxShadow: active ? '0 12px 28px rgba(28,28,28,0.08)' : 'none',
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 20,
          background: done || active ? B.accent : B.accentSoft,
          color: done || active ? B.bgCard : B.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 16,
        }}>{index + 1}</div>
        <div>
          <div style={{
            fontSize: 22, fontWeight: 600, color: B.text,
            letterSpacing: '-0.01em',
          }}>{item.name}</div>
          {item.why && (
            <div style={{ fontSize: 15, color: B.textMuted, marginTop: 4, fontWeight: 500 }}>
              {item.why}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {done && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 13, fontWeight: 600, color: B.accent,
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="9" fill={B.accent}/>
                <path d="M5 9.5 L8 12 L13 6.5" stroke={B.bgCard} strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
              Done
            </div>
          )}
          {active && <ThinkingPinwheel size={22}/>}
          {!active && !done && (
            <div style={{
              width: 44, height: 24, borderRadius: 12,
              background: B.bgDark, position: 'relative',
            }}>
              <div style={{
                position: 'absolute', left: 2, top: 2,
                width: 20, height: 20, borderRadius: 10,
                background: B.bgCard,
                border: `1px solid ${B.border}`,
              }}/>
            </div>
          )}
        </div>
      </div>
    </FadeIn>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCENE TYPE: feature-grid
// ═══════════════════════════════════════════════════════════════════════════
function SceneFeatureGrid({ scene, sceneStart: s }) {
  const c = scene.content;
  const features = c.features || [];
  const t = useTime();
  const cols = features.length <= 3 ? features.length : 2;
  return (
    <SceneFrame start={s} end={s + scene.duration} sceneId={scene.id}>
      <SceneTitle eyebrow={c.eyebrow} title={c.title} x={200} y={140} start={s + 0.2}/>
      <div style={{
        position: 'absolute', left: 200, right: 200, top: 360,
        display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 22,
      }}>
        {features.map((feat, i) => {
          const focusAt = feat.focusAt != null ? feat.focusAt : (1.6 + i * 1.6);
          const local = t - (s + focusAt);
          const focused = local > 0 && local < 1.4;
          const anyFocused = features.some((f, j) => {
            const fa = f.focusAt != null ? f.focusAt : (1.6 + j * 1.6);
            const fl = t - (s + fa);
            return fl > 0 && fl < 1.4;
          });
          const dimmed = anyFocused && !focused;
          return (
            <FadeIn key={feat.id || i} start={s + 0.9 + i * 0.15} duration={0.5} from="down" distance={18}>
              <div data-beat-id={feat.id || `feat-${i}`} style={{
                background: B.bgCard,
                border: `1px solid ${focused ? B.accent : B.border}`,
                borderRadius: B.radius,
                padding: '36px 34px', minHeight: 240,
                opacity: dimmed ? 0.4 : 1,
                filter: dimmed ? 'grayscale(0.6)' : 'none',
                transform: focused ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: focused ? '0 18px 40px rgba(28,28,28,0.12)' : 'none',
                transition: 'all 0.4s',
              }}>
                {(feat.n || feat.cat) && (
                  <div style={{
                    fontSize: 13, fontWeight: 700, color: B.accent,
                    letterSpacing: '0.12em', marginBottom: 14,
                  }}>{feat.n && `${feat.n}${feat.cat ? ' · ' : ''}`}{feat.cat}</div>
                )}
                <div style={{
                  fontSize: 28, fontWeight: 700, color: B.text,
                  letterSpacing: '-0.015em', marginBottom: 12,
                }}>{feat.title}</div>
                {feat.sub && (
                  <div style={{
                    fontSize: 17, color: B.textMuted, lineHeight: 1.55, fontWeight: 500,
                  }}>{parseAccents(feat.sub)}</div>
                )}
              </div>
            </FadeIn>
          );
        })}
      </div>
    </SceneFrame>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCENE TYPE: voice-demo
// ═══════════════════════════════════════════════════════════════════════════
function SceneVoiceDemo({ scene, sceneStart: s }) {
  const c = scene.content;
  const t = useTime();
  return (
    <SceneFrame start={s} end={s + scene.duration} background={B.bgAlt} sceneId={scene.id}>
      <SceneTitle eyebrow={c.eyebrow} title={c.title} x={200} y={160} start={s + 0.2}/>
      {c.sub && (
        <FadeIn start={s + 0.9} duration={0.5} from="down" distance={10}
          style={{ position: 'absolute', left: 200, top: 360, maxWidth: 1000 }}>
          <div style={{ fontSize: 22, color: B.textMuted, lineHeight: 1.5, fontWeight: 500 }}>
            {parseAccents(c.sub)}
          </div>
        </FadeIn>
      )}

      <FadeIn start={s + 1.5} duration={0.6} from="down" distance={20}
        style={{ position: 'absolute', left: 200, top: 500, width: 1520 }}>
        <div style={{
          background: B.bgCard, border: `1px solid ${B.border}`,
          borderRadius: 18, padding: '50px 60px',
          display: 'flex', alignItems: 'center', gap: 40,
          boxShadow: '0 20px 50px -20px rgba(28,28,28,0.12)',
        }}>
          <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
            <PulseRing start={s + 2.0} delay={0}/>
            <PulseRing start={s + 2.0} delay={0.5}/>
            <PulseRing start={s + 2.0} delay={1.0}/>
            <div style={{
              position: 'absolute', inset: 24,
              background: B.accent, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 10px 28px rgba(139,38,53,0.3)',
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="3" width="6" height="12" rx="3" fill={B.bgCard}/>
                <path d="M5 11a7 7 0 0 0 14 0 M12 18v3" stroke={B.bgCard} strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, height: 80 }}>
            {Array.from({ length: 56 }).map((_, i) => {
              const phase = (t * 3 + i * 0.3) % (Math.PI * 2);
              const baseH = 8 + Math.abs(Math.sin(phase + i * 0.4)) * 60;
              const active = t >= s + 2.0;
              return (
                <div key={i} style={{
                  width: 5, height: active ? baseH : 4,
                  background: i < 14 ? B.accent : B.borderStrong,
                  borderRadius: 3,
                  transition: 'height 0.08s linear',
                }}/>
              );
            })}
          </div>
          <div style={{
            fontFamily: B.mono, fontSize: 28, fontWeight: 500,
            color: B.text, letterSpacing: '0.04em',
            fontVariantNumeric: 'tabular-nums',
          }}><RecordTimer start={s + 2.0}/></div>
        </div>
      </FadeIn>

      {c.transcript && (
        <FadeIn start={s + 3.5} duration={0.5} from="down" distance={14}
          style={{ position: 'absolute', left: 200, top: 760, width: 1520 }}>
          <div style={{
            background: 'transparent', borderLeft: `3px solid ${B.accent}`,
            padding: '18px 28px',
          }}>
            <div style={{
              fontSize: 13, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.1em', color: B.accent, marginBottom: 10,
            }}>{c.transcriptLabel || 'Live transcript'}</div>
            <TypeOn
              text={c.transcript}
              start={s + 4.0} duration={4.5}
              x={0} y={0} size={26} weight={500}
              color={B.text}
            />
          </div>
        </FadeIn>
      )}
    </SceneFrame>
  );
}

function PulseRing({ start, delay }) {
  const t = useTime();
  const local = (t - start - delay) % 2.0;
  if (local < 0) return null;
  const u = local / 2.0;
  const scale = 0.4 + u * 1.0;
  const op = (1 - u) * 0.5;
  return (
    <div style={{
      position: 'absolute', inset: 0,
      borderRadius: '50%',
      border: `2px solid ${B.accent}`,
      transform: `scale(${scale})`,
      opacity: op,
    }}/>
  );
}

function RecordTimer({ start }) {
  const t = useTime();
  const sec = Math.max(0, t - start);
  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(Math.floor(sec % 60)).padStart(2, '0');
  return <span>{mm}:{ss}</span>;
}

// ═══════════════════════════════════════════════════════════════════════════
// SCENE TYPE: recap-grid (often combined with preview-band)
// ═══════════════════════════════════════════════════════════════════════════
function SceneRecapGrid({ scene, sceneStart: s }) {
  const c = scene.content;
  const cards = c.cards || [];
  return (
    <SceneFrame start={s} end={s + scene.duration} background={B.bgDark} sceneId={scene.id}>
      <SceneTitle eyebrow={c.eyebrow} title={c.title} x={200} y={160} start={s + 0.2}/>

      <div style={{
        position: 'absolute', left: 200, right: 200, top: 400,
        display: 'grid', gridTemplateColumns: `repeat(${cards.length}, 1fr)`, gap: 22,
      }}>
        {cards.map((card, i) => (
          <FadeIn key={card.id || i} start={s + 0.9 + i * 0.2} duration={0.6} from="down" distance={24}>
            <div data-beat-id={card.id || `card-${i}`} style={{
              background: B.bgCard, border: `1px solid ${B.border}`,
              borderRadius: B.radius,
              padding: '44px 38px', minHeight: 280,
            }}>
              <div style={{
                fontSize: 64, fontWeight: 600, color: B.accent,
                lineHeight: 1, letterSpacing: '-0.015em',
                fontVariantNumeric: 'tabular-nums',
              }}>{card.n}</div>
              <div style={{
                fontSize: 26, fontWeight: 700, color: B.text,
                marginTop: 22, letterSpacing: '-0.01em',
              }}>{card.title}</div>
              {card.body && <div style={{
                fontSize: 17, color: B.textMuted, lineHeight: 1.55,
                marginTop: 12, fontWeight: 500,
              }}>{card.body}</div>}
            </div>
          </FadeIn>
        ))}
      </div>

      {c.preview && (
        <FadeIn start={s + 4.5} duration={0.6} from="down" distance={18}
          style={{ position: 'absolute', left: 200, right: 200, top: 800 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 24,
            padding: '28px 36px',
            borderLeft: `3px solid ${B.accent}`,
            background: B.bgCard,
            borderRadius: `0 ${B.radius}px ${B.radius}px 0`,
          }}>
            <div>
              <div style={{
                fontSize: 13, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.12em', color: B.accent, marginBottom: 8,
              }}>{c.preview.eyebrow}</div>
              <div style={{
                fontSize: 32, fontWeight: 700, color: B.text,
                letterSpacing: '-0.015em',
              }}>{c.preview.title}</div>
            </div>
            <div style={{ flex: 1 }}/>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 32, color: B.accent,
            }}>→</div>
          </div>
        </FadeIn>
      )}
    </SceneFrame>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Dispatcher
// ═══════════════════════════════════════════════════════════════════════════
function renderScene(scene) {
  const props = { scene, sceneStart: scene.start, key: scene.id };
  switch (scene.type) {
    case 'cover': return <SceneCover {...props}/>;
    case 'journey-map': return <SceneJourneyMap {...props}/>;
    case 'comparison-chats': return <SceneComparisonChats {...props}/>;
    case 'tool-card-reveal': return <SceneToolCardReveal {...props}/>;
    case 'capability-table': return <SceneCapabilityTable {...props}/>;
    case 'setup-checklist': return <SceneSetupChecklist {...props}/>;
    case 'feature-grid': return <SceneFeatureGrid {...props}/>;
    case 'voice-demo': return <SceneVoiceDemo {...props}/>;
    case 'recap-grid': return <SceneRecapGrid {...props}/>;
    default:
      console.warn(`[lesson-renderer] Unknown scene type: ${scene.type} (id=${scene.id})`);
      return null;
  }
}

// Validate timing constraints. Called once on load. Logs warnings but doesn't throw.
function validateLesson(lesson) {
  const errors = [];
  if (!lesson.scenes || lesson.scenes.length === 0) errors.push('No scenes defined.');
  for (let i = 0; i < (lesson.scenes || []).length; i++) {
    const sc = lesson.scenes[i];
    if (!sc.id) errors.push(`Scene at index ${i} has no id.`);
    if (i > 0) {
      const prev = lesson.scenes[i - 1];
      const expected = prev.start + prev.duration;
      if (Math.abs(sc.start - expected) > 0.001) {
        errors.push(`Scene "${sc.id}" expected to start at ${expected}s but is ${sc.start}s.`);
      }
    }
  }
  const last = lesson.scenes[lesson.scenes.length - 1];
  if (last && Math.abs(lesson.lesson.duration - (last.start + last.duration)) > 0.001) {
    errors.push(`Total duration ${lesson.lesson.duration} != sum of scene durations.`);
  }
  if (errors.length > 0) {
    console.warn('[lesson-renderer] Lesson validation warnings:\n  ' + errors.join('\n  '));
  }
  return errors;
}

Object.assign(window, {
  parseAccents, SceneFrame,
  SceneCover, SceneJourneyMap, SceneComparisonChats, SceneToolCardReveal,
  SceneCapabilityTable, SceneSetupChecklist, SceneFeatureGrid,
  SceneVoiceDemo, SceneRecapGrid,
  renderScene, validateLesson,
});

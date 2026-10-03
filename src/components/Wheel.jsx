import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import { initAudio, playTickSound } from "../utils/audio";
import { landingAngle, randomIndex, textColor } from "../utils/model";
import "./Wheel.css";
const point = (angle, radius) => [
  250 + radius * Math.sin((angle * Math.PI) / 180),
  250 - radius * Math.cos((angle * Math.PI) / 180),
];
function segmentPath(index, count) {
  const half = 180 / count;
  const start = point((index * 360) / count - half, 232);
  const end = point((index * 360) / count + half, 232);
  return `M 250 250 L ${start.join(" ")} A 232 232 0 0 1 ${end.join(" ")} Z`;
}
const Wheel = forwardRef(function Wheel(
  {
    items,
    winnerId,
    settings,
    reducedMotion,
    onStart,
    onComplete,
    spinning,
    onEmpty,
  },
  ref,
) {
  const rotation = useMotionValue(0);
  const busy = useRef(false);
  const animation = useRef(null);
  const pointerRef = useRef(null);
  const [selectedId, setSelectedId] = useState(null);
  const signature = items
    .map((item) => `${item.id}:${item.name}:${item.color}`)
    .join("|");
  useEffect(() => {
    rotation.set(0);
    setSelectedId(null);
  }, [signature, rotation]);
  useEffect(() => () => animation.current?.stop(), []);
  const spin = () => {
    if (busy.current) return;
    if (!items.length) {
      onEmpty();
      return;
    }
    busy.current = true;
    const snapshot = items.map((item) => ({ ...item }));
    let index;
    try {
      index = randomIndex(snapshot.length);
    } catch {
      busy.current = false;
      return;
    }
    const winner = snapshot[index];
    const start = rotation.get();
    const end = landingAngle(start, index, snapshot.length);
    setSelectedId(null);
    onStart();
    if (settings.sound) initAudio();
    let lastTick = Math.floor(
      (start + 180 / snapshot.length) / (360 / snapshot.length),
    );
    const finish = () => {
      busy.current = false;
      setSelectedId(winner.id);
      onComplete(winner, end, snapshot.length);
    };
    if (reducedMotion) {
      rotation.set(end);
      finish();
      return;
    }
    animation.current = animate(rotation, end, {
      duration: settings.duration,
      ease: [0.2, 0.04, 0.12, 1],
      onUpdate: (value) => {
        const tick = Math.floor(
          (value + 180 / snapshot.length) / (360 / snapshot.length),
        );
        if (tick !== lastTick && !reducedMotion) {
          lastTick = tick;
          if (settings.sound) playTickSound();
          pointerRef.current?.animate(
            [
              { transform: "translateX(-50%) rotate(-12deg)" },
              { transform: "translateX(-50%) rotate(0deg)" },
            ],
            { duration: 100 },
          );
        }
      },
      onComplete: finish,
    });
  };
  useImperativeHandle(ref, () => ({ spin }));
  const numeric = items.length > 18;
  const selected = winnerId && selectedId === winnerId ? winnerId : null;
  return (
    <div className={`wheel-container ${spinning ? "is-spinning" : ""}`}>
      <div className="pointer" ref={pointerRef} aria-hidden="true" />
      <motion.svg
        className="wheel"
        viewBox="0 0 500 500"
        style={{ rotate: rotation }}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="wheel-depth">
            <stop offset="0%" stopColor="white" stopOpacity=".13" />
            <stop offset="75%" stopColor="white" stopOpacity="0" />
            <stop offset="100%" stopColor="black" stopOpacity=".15" />
          </radialGradient>
        </defs>
        {!items.length && <circle cx="250" cy="250" r="232" fill="#202f45" />}
        {items.map((item, index) => {
          const angle = (index * 360) / items.length;
          const [x, y] = point(angle, numeric ? 187 : 152);
          const label = numeric
            ? String(index + 1)
            : item.name.length > 18
              ? item.name.slice(0, 17) + "…"
              : item.name;
          const fontSize = numeric
            ? 13
            : Math.min(
                19,
                Math.max(11, 140 / Math.max(label.length * 0.56, 1)),
                150 / items.length,
              );
          return (
            <g key={item.id} data-item-id={item.id}>
              {items.length === 1 ? (
                <circle cx="250" cy="250" r="232" fill={item.color} />
              ) : (
                <path
                  d={segmentPath(index, items.length)}
                  fill={item.color}
                  stroke="#132037"
                  strokeOpacity=".25"
                  strokeWidth="1.5"
                />
              )}
              {selected === item.id &&
                (items.length === 1 ? (
                  <circle
                    cx="250"
                    cy="250"
                    r="227"
                    className="winning-segment"
                  />
                ) : (
                  <path
                    d={segmentPath(index, items.length)}
                    className="winning-segment"
                  />
                ))}
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${numeric ? angle : angle < 180 ? angle - 90 : angle + 90}, ${x}, ${y})`}
                fill={textColor(item.color)}
                fontSize={fontSize}
                fontWeight="650"
              >
                {label}
              </text>
            </g>
          );
        })}
        <circle cx="250" cy="250" r="232" fill="url(#wheel-depth)" />
        <circle
          cx="250"
          cy="250"
          r="239"
          fill="none"
          stroke="#91a1bb"
          strokeWidth="8"
        />
        <circle
          cx="250"
          cy="250"
          r="243"
          fill="none"
          stroke="#e6edf7"
          strokeOpacity=".65"
          strokeWidth="2"
        />
      </motion.svg>
      <button
        className="spin-button"
        onClick={spin}
        disabled={spinning}
        aria-label={items.length ? "Spin wheel" : "Add entries to wheel"}
      >
        {spinning ? (
          <>
            <span className="spin-dot" />
            Spinning
          </>
        ) : items.length ? (
          <>
            SPIN<span>your wheel</span>
          </>
        ) : (
          <>
            ADD<span>entries</span>
          </>
        )}
      </button>
    </div>
  );
});
export default Wheel;

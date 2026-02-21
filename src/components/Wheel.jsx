import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, useMotionValue } from 'framer-motion';
import { initAudio, playTickSound } from '../utils/audio';
import './Wheel.css';

const Wheel = ({ items, onSpinComplete }) => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [isTensionMode, setIsTensionMode] = useState(false);
    const rotation = useMotionValue(0);
    const controls = useAnimation();
    const lastTickAngle = useRef(0);
    const isDragging = useRef(false);

    const sparkRef = useRef(null);

    const triggerSpark = () => {
        const container = document.querySelector('.wheel-container');
        if (!container) return;

        const numSparks = Math.floor(Math.random() * 3) + 3; // 3 to 5
        for (let i = 0; i < numSparks; i++) {
            const spark = document.createElement('div');
            spark.className = 'spark-particle';

            // Random trajectory spreading upwards from top center
            const angle = -90 + (Math.random() * 100 - 50);
            const velocity = Math.random() * 100 + 80;
            const x = Math.cos(angle * Math.PI / 180) * velocity;
            const y = Math.sin(angle * Math.PI / 180) * velocity;

            spark.style.setProperty('--tx', `${x}px`);
            spark.style.setProperty('--ty', `${y}px`);
            spark.style.setProperty('--rot', `${angle + 90}deg`);

            container.appendChild(spark);
            setTimeout(() => {
                if (spark.parentNode) spark.parentNode.removeChild(spark);
            }, 500);
        }

        // Pointer Jolt
        const pointer = document.querySelector('.pointer');
        if (pointer) {
            pointer.style.transform = 'translateX(-50%) translateY(-6px)';
            setTimeout(() => {
                if (pointer) pointer.style.transform = 'translateX(-50%) translateY(0)';
            }, 50);
        }
    };

    useEffect(() => {
        rotation.on("change", (latest) => {
            const sliceAngle = 360 / items.length;
            const currentTick = Math.floor(latest / sliceAngle);
            if (currentTick !== lastTickAngle.current && (isSpinning || isDragging.current)) {
                lastTickAngle.current = currentTick;
                playTickSound();
                triggerSpark();
            }
        });
    }, [items, isSpinning]);

    const handleSpinStart = () => {
        if (items.length === 0) return;
        initAudio();
        setIsSpinning(true);
        isDragging.current = false;

        const winningIndex = Math.floor(Math.random() * items.length);
        const sliceAngle = 360 / items.length;
        const targetAngle = 360 - (winningIndex * sliceAngle);
        const extraSpins = (Math.floor(Math.random() * 5) + 5) * 360;

        // Use the current physical rotation value
        const currentR = rotation.get();
        const finalRotation = currentR + extraSpins + (targetAngle - (currentR % 360));

        controls.start({
            rotate: finalRotation,
            transition: { duration: 5, ease: [0.15, 0.9, 0.15, 1] }
        }).then(() => {
            setIsSpinning(false);
            setIsTensionMode(false);
            onSpinComplete(items[winningIndex]);
        });

        // Trigger tension mode in the final 2 seconds of the spin
        setTimeout(() => {
            setIsTensionMode(true);
        }, 3000);
    };

    const handleDragStart = () => {
        if (isSpinning || items.length === 0) return;
        initAudio();
        isDragging.current = true;
    };

    const handleDragEnd = (event, info) => {
        isDragging.current = false;

        // If they flicked it hard enough, treat it as a spin
        if (Math.abs(info.velocity.x) > 500 || Math.abs(info.velocity.y) > 500) {
            handleSpinStart();
        } else {
            // Otherwise just let it rest and lock into the nearest slice
            const currentR = rotation.get();
            const sliceAngle = 360 / items.length;
            const nearestSlice = Math.round(currentR / sliceAngle) * sliceAngle;
            controls.start({
                rotate: nearestSlice,
                transition: { type: 'spring', stiffness: 300, damping: 30 }
            });
        }
    };

    const sliceAngle = 360 / items.length;

    const renderSlices = () => {
        if (items.length === 0) return null;

        return items.map((item, index) => {
            const startAngle = index * sliceAngle - sliceAngle / 2;
            const endAngle = (index + 1) * sliceAngle - sliceAngle / 2;

            const createClipPath = (start, end) => {
                let points = ['50% 50%'];
                const arcs = Math.ceil(end - start);
                for (let i = 0; i <= arcs; i++) {
                    const a = start + (end - start) * (i / arcs);
                    const rad = (a - 90) * (Math.PI / 180);
                    const x = 50 + 43 * Math.cos(rad);
                    const y = 50 + 43 * Math.sin(rad);
                    points.push(`${x.toFixed(3)}% ${y.toFixed(3)}%`);
                }
                return `polygon(${points.join(', ')})`;
            };

            const clipPath = createClipPath(startAngle, endAngle);
            const rotationAngle = (index * 360) / items.length;

            // Calculate dynamic font size to prevent overlapping or truncation
            let size = 19; // roughly 1.2rem
            if (items.length > 6) {
                // Reduce size based on the number of items so slices don't overlap vertically
                size = Math.min(size, 300 / items.length);
            }

            // Reduce size if the text is too long to fit in the slice
            const maxTextWidth = 145;
            const estimatedWidth = item.name.length * size * 0.55;
            if (estimatedWidth > maxTextWidth) {
                size = maxTextWidth / (item.name.length * 0.55);
            }

            // Clamp to a lowest readable size
            size = Math.max(9, size);

            return (
                <div
                    key={`slice-${item.id}`}
                    className="wheel-slice"
                    style={{
                        clipPath: clipPath,
                        WebkitClipPath: clipPath
                    }}
                >
                    <div className="wheel-slice-bg" style={{ backgroundColor: item.color }}></div>
                    <div
                        className="wheel-text-container"
                        style={{
                            transform: `rotate(${rotationAngle}deg)`
                        }}
                    >
                        <span className="wheel-text" style={{ fontSize: `${size}px` }}>{item.name}</span>
                    </div>
                </div>
            );
        });
    };

    return (
        <motion.div
            className={`wheel-container ${isSpinning ? 'is-spinning' : ''} ${isTensionMode ? 'tension' : ''}`}
            animate={{ scale: isTensionMode ? 1.08 : 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
        >
            <div className="pointer"></div>
            <motion.div
                className="wheel"
                style={{ rotate: rotation }}
                animate={controls}
                onPanStart={handleDragStart}
                onPan={(_, info) => {
                    // Convert linear pixel pan into rotational degrees without physically moving the wheel div
                    rotation.set(rotation.get() + info.delta.x + info.delta.y);
                }}
                onPanEnd={handleDragEnd}
            >
                {/* Glossy specular highlight layer */}
                <div className="wheel-gloss"></div>

                {renderSlices()}
                {items.map((_, index) => {
                    const rotationAngle = (index * 360) / items.length + (360 / items.length) / 2;
                    return (
                        <div
                            key={`divider-${index}`}
                            className="wheel-divider"
                            style={{
                                transform: `translateX(-50%) rotate(${rotationAngle}deg)`
                            }}
                        />
                    );
                })}
            </motion.div>
            <div className="wheel-center">
                <button
                    className="spin-button"
                    onClick={handleSpinStart}
                    disabled={isSpinning || items.length === 0}
                >
                    {items.length === 0 ? "Add Items" : "SPIN"}
                </button>
            </div>
        </motion.div>
    );
};

export default Wheel;

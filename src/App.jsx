import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Menu, X } from 'lucide-react';
import Wheel from './components/Wheel';
import Sidebar from './components/Sidebar';
import { playTadaSound } from './utils/audio';
import './App.css';

const defaultItems = [
    { id: '1', name: 'Pizza', color: '#ef4444' }, // Red
    { id: '2', name: 'Burgers', color: '#f97316' }, // Orange
    { id: '3', name: 'Sushi', color: '#eab308' }, // Yellow
    { id: '4', name: 'Tacos', color: '#22c55e' }, // Green
    { id: '5', name: 'Pasta', color: '#3b82f6' }, // Blue
    { id: '6', name: 'Salad', color: '#a855f7' }, // Purple
];

function App() {
    const [items, setItems] = useState(() => {
        const saved = localStorage.getItem('wheelspin_items');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return defaultItems;
            }
        }
        return defaultItems;
    });

    const [winner, setWinner] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isAppInTension, setIsAppInTension] = useState(false);

    useEffect(() => {
        localStorage.setItem('wheelspin_items', JSON.stringify(items));
    }, [items]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) {
                setIsSidebarOpen(true);
            } else {
                setIsSidebarOpen(false);
            }
        };
        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSpinComplete = (winningItem) => {
        setWinner(winningItem);
        playTadaSound();

        // Trigger Confetti
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({
                ...defaults, particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
                ...defaults, particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);
    };

    return (
        <div className={`app-layout ${isAppInTension ? 'tension' : ''}`}>
            {/* Overlay for mobile sliding drawer */}
            <div
                className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
            />

            <div className={`sidebar-container ${isSidebarOpen ? 'open' : ''}`}>
                <button className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}>
                    <X size={24} />
                </button>
                <Sidebar items={items} setItems={setItems} />
            </div>

            <main className="main-content">
                <button className="menu-button" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                    <Menu size={28} />
                </button>

                <div className="header">
                    <h1>WheelSpin.</h1>
                    <p>Can't decide? Let fate choose for you.</p>
                </div>

                <div className="wheel-section">
                    <div
                        className={`winner-announcement ${winner ? 'show' : ''}`}
                        style={{ color: winner ? winner.color : 'transparent' }}
                    >
                        <h2>{winner ? winner.name : 'Spinning'}!</h2>
                    </div>

                    <Wheel
                        items={items}
                        onSpinComplete={handleSpinComplete}
                        onTensionChange={(state) => setIsAppInTension(state)}
                    />
                </div>
            </main>
        </div>
    );
}

export default App;

import React, { useState } from 'react';
import { Trash2, Plus, Dices, Layers } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ items, setItems }) => {
    const [newItemName, setNewItemName] = useState('');

    const generateRandomColor = () => {
        const s = 70 + Math.random() * 20; // 70-90% saturation
        const l = 50 + Math.random() * 10; // 50-60% lightness
        const h = Math.floor(Math.random() * 360); // 0-359 hue
        return `hsl(${h}, ${s}%, ${l}%)`;
    };

    const handleAddItem = (e) => {
        e.preventDefault();
        if (!newItemName.trim()) return;

        setItems([
            ...items,
            { id: Date.now().toString(), name: newItemName.trim(), color: generateRandomColor() }
        ]);
        setNewItemName('');
    };

    const handleRemoveItem = (id) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleColorChange = (id, newColor) => {
        setItems(items.map(item => item.id === id ? { ...item, color: newColor } : item));
    };

    const generateRandomSet = () => {
        const categories = [
            ['Pizza', 'Burgers', 'Sushi', 'Tacos', 'Pasta', 'Salad', 'Steak', 'Curry'],
            ['Paris', 'Tokyo', 'London', 'Rome', 'New York', 'Sydney', 'Cairo', 'Rio'],
            ['Salsa', 'Tango', 'Waltz', 'Hip Hop', 'Ballet', 'Breakdance', 'Tap'],
            ['Action', 'Comedy', 'Horror', 'Sci-Fi', 'Romance', 'Thriller', 'Fantasy'],
            ['Flight', 'Invisibility', 'Strength', 'Telepathy', 'Time Travel', 'Speed']
        ];

        const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
        const numItems = Math.floor(Math.random() * 2) + 5; // 5 or 6 items

        const shuffled = [...selectedCategory].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, numItems);

        const newItems = selected.map((name, index) => ({
            id: `rand-${Date.now()}-${index}`,
            name,
            color: generateRandomColor()
        }));

        setItems(newItems);
    };

    const generateGymnasticsSet = () => {
        const gymnasticsMoves = [
            'Back Walkover', 'Front Walkover', 'Cartwheel', 'Roundoff',
            'Back Handspring', 'Front Handspring', 'Aerial',
            'Back Tuck', 'Front Tuck', 'Layout', 'Full Twist'
        ];

        const numItems = Math.floor(Math.random() * 3) + 4;

        const shuffled = [...gymnasticsMoves].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, numItems);

        const newItems = selected.map((name, index) => ({
            id: `gen-${Date.now()}-${index}`,
            name,
            color: generateRandomColor()
        }));

        setItems(newItems);
    };

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2>Wheel Items</h2>
                <span className="item-count">{items.length} items</span>
            </div>

            <form className="add-item-form" onSubmit={handleAddItem}>
                <label htmlFor="newItemInput" className="sr-only" style={{ display: 'none' }}>New Item Name</label>
                <input
                    id="newItemInput"
                    name="newItemName"
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="New Item..."
                    className="add-item-input"
                />
                <button type="submit" className="add-item-button" disabled={!newItemName.trim() || items.length >= 50}>
                    <Plus size={20} />
                </button>
            </form>

            <div className="generator-buttons">
                <button className="gen-button" onClick={generateRandomSet} title="Generate Random Theme">
                    <Dices size={18} /> Random Set
                </button>
                <button className="gen-button" onClick={generateGymnasticsSet} title="Generate Gymnastics Set">
                    <Layers size={18} /> Gym Set
                </button>
            </div>

            <div className="items-list">
                {items.map((item) => (
                    <div key={item.id} className="item-row">
                        <div className="item-color-picker">
                            <label htmlFor={`colorPicker-${item.id}`} style={{ display: 'none' }}>Color</label>
                            <input
                                id={`colorPicker-${item.id}`}
                                name={`colorPicker-${item.id}`}
                                type="color"
                                value={
                                    // Convert HSL to HEX would be better, but native color picker expects hex
                                    // For simplicity, we just allow selecting hex going forward or keep hsl if unchanged
                                    item.color.startsWith('hsl') ? '#ffffff' : item.color
                                }
                                onChange={(e) => handleColorChange(item.id, e.target.value)}
                                title="Change Color"
                            // Inline style background block
                            />
                            <div
                                className="color-preview"
                                style={{ backgroundColor: item.color }}
                                title="Current Color"
                            ></div>
                        </div>
                        <div className="item-name" title={item.name}>{item.name}</div>
                        <button
                            className="remove-item-button"
                            onClick={() => handleRemoveItem(item.id)}
                            aria-label="Remove item"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                {items.length === 0 && (
                    <div className="empty-state">
                        <p>Your wheel is empty!</p>
                        <p>Add some items above to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;

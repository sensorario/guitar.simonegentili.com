function GuitarFretboard() {
    const strings = 6;
    const frets = 24;
    const scaleLength = 1200; // Lunghezza scala aumentata per tastiera più larga
    const fretboardHeight = 200;
    const stringSpacing = fretboardHeight / (strings + 1);

    // Calcola le posizioni dei tasti usando la regola del 12
    const getFretPosition = (fretNumber) => {
        if (fretNumber === 0) return 0;
        const distanceFromNut = scaleLength * (1 - (1 / Math.pow(2, fretNumber / 12)));
        return distanceFromNut;
    };

    // Larghezza totale del fretboard basata sull'ultimo tasto
    const fretboardWidth = getFretPosition(frets) + 20; // +20px per margine finale

    return (
        <div style={{ margin: '20px 0' }}>
            <h2>Tastiera della Chitarra</h2>
            <svg width={fretboardWidth} height={fretboardHeight} xmlns="http://www.w3.org/2000/svg">
                {/* Sfondo della tastiera */}
                <rect x="0" y="0" width={fretboardWidth} height={fretboardHeight} fill="#8B4513" stroke="#654321" strokeWidth="3" />

                {/* Corde */}
                {[...Array(strings)].map((_, i) => {
                    const y = stringSpacing * (i + 1);
                    const thickness = 0.5 + (strings - i) * 0.4;
                    return (
                        <line
                            key={`string-${i}`}
                            x1="0"
                            y1={y}
                            x2={fretboardWidth}
                            y2={y}
                            stroke="#C0C0C0"
                            strokeWidth={thickness}
                        />
                    );
                })}

                {/* Tasti */}
                {[...Array(frets + 1)].map((_, i) => {
                    const x = getFretPosition(i);
                    return (
                        <line
                            key={`fret-${i}`}
                            x1={x}
                            y1="0"
                            x2={x}
                            y2={fretboardHeight}
                            stroke="#D4AF37"
                            strokeWidth={i === 0 ? "4" : "2"}
                        />
                    );
                })}

                {/* Marker dots sui tasti 3, 5, 7, 9, 15, 17, 19, 21 */}
                {[3, 5, 7, 9, 15, 17, 19, 21].map(fret => {
                    const x = (getFretPosition(fret - 1) + getFretPosition(fret)) / 2;
                    const y = fretboardHeight / 2;
                    return (
                        <circle
                            key={`dot-${fret}`}
                            cx={x}
                            cy={y}
                            r="6"
                            fill="#F5F5DC"
                            opacity="0.7"
                        />
                    );
                })}

                {/* Due dots sul 12° e 24° tasto */}
                {[12, 24].map(fret => {
                    const x = (getFretPosition(fret - 1) + getFretPosition(fret)) / 2;
                    const y1 = fretboardHeight / 3;
                    const y2 = (2 * fretboardHeight) / 3;
                    return (
                        <g key={`double-dot-${fret}`}>
                            <circle cx={x} cy={y1} r="6" fill="#F5F5DC" opacity="0.7" />
                            <circle cx={x} cy={y2} r="6" fill="#F5F5DC" opacity="0.7" />
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

export default GuitarFretboard;

import React from 'react';

function GuitarFretboard() {
    const [hoveredNote, setHoveredNote] = React.useState(null);
    const [selectedNote, setSelectedNote] = React.useState(null);

    const strings = 6;
    const frets = 24;
    const scaleLength = 1200;
    const fretboardHeightLeft = 160; // Altezza a sinistra (meno stretta)
    const fretboardHeightRight = 200; // Altezza a destra (più larga)

    // Note delle corde a vuoto (dal MI alto al MI basso - invertito)
    const openStringNotes = ['E', 'B', 'G', 'D', 'A', 'E'];
    const noteSequence = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    // Calcola il nome della nota data la corda e il tasto
    const getNoteName = (stringIndex, fret) => {
        const openNote = openStringNotes[stringIndex];
        const openNoteIndex = noteSequence.indexOf(openNote);
        const noteIndex = (openNoteIndex + fret) % 12;
        return noteSequence[noteIndex];
    };

    // Calcola la posizione Y della nota sul pentagramma
    // Il pentagramma ha 5 linee, con spazi tra di esse
    // Le linee sono a y: 30, 50, 70, 90, 110 (ogni 20px)
    const getNotePositionOnStaff = (noteName) => {
        // Mappa delle note alla loro posizione sul pentagramma (chiave di violino)
        // Valori negativi = sopra il pentagramma, positivi = sotto
        const notePositions = {
            'C': 110,   // Do (sotto la prima linea)
            'C#': 105,
            'D': 100,   // Re (sulla prima linea)
            'D#': 95,
            'E': 90,    // Mi (tra prima e seconda linea)
            'F': 85,    // Fa (sulla seconda linea)
            'F#': 80,
            'G': 70,    // Sol (terza linea)
            'G#': 65,
            'A': 60,    // La (tra terza e quarta)
            'A#': 55,
            'B': 50     // Si (quarta linea)
        };
        return notePositions[noteName] || 70;
    };

    // Funzione per calcolare l'altezza in base alla posizione x
    const getHeightAtX = (x, totalWidth) => {
        const ratio = x / totalWidth;
        return fretboardHeightLeft + (fretboardHeightRight - fretboardHeightLeft) * ratio;
    };

    // Calcola le posizioni dei tasti usando la regola del 12
    const getFretPosition = (fretNumber) => {
        if (fretNumber === 0) return 0;
        const distanceFromNut = scaleLength * (1 - (1 / Math.pow(2, fretNumber / 12)));
        return distanceFromNut;
    };

    // Larghezza totale del fretboard basata sull'ultimo tasto
    const fretboardWidth = getFretPosition(frets) + 20;

    // Calcola la posizione Y di una corda dato l'indice e la posizione X
    const getStringY = (stringIndex, x) => {
        const ratio = (stringIndex + 1) / (strings + 1);
        const y1 = (fretboardHeightRight - fretboardHeightLeft) / 2 + ratio * fretboardHeightLeft;
        const y2 = ratio * fretboardHeightRight;
        const xRatio = x / fretboardWidth;
        return y1 + (y2 - y1) * xRatio;
    };

    return (
        <div style={{ margin: '20px 0' }}>
            <h2>Tastiera della Chitarra</h2>
            <svg width={fretboardWidth} height={fretboardHeightRight} xmlns="http://www.w3.org/2000/svg">
                {/* Sfondo della tastiera a forma di trapezio */}
                <polygon
                    points={`0,${(fretboardHeightRight - fretboardHeightLeft) / 2} 
                             0,${(fretboardHeightRight + fretboardHeightLeft) / 2} 
                             ${fretboardWidth},${fretboardHeightRight} 
                             ${fretboardWidth},0`}
                    fill="#8B4513"
                    stroke="#654321"
                    strokeWidth="3"
                />

                {/* Corde */}
                {[...Array(strings)].map((_, i) => {
                    const ratio = (i + 1) / (strings + 1);
                    const y1 = (fretboardHeightRight - fretboardHeightLeft) / 2 + ratio * fretboardHeightLeft;
                    const y2 = ratio * fretboardHeightRight;
                    const thickness = 0.5 + i * 0.4; // Invertito: la prima corda è sottile, l'ultima grossa
                    return (
                        <line
                            key={`string-${i}`}
                            x1="0"
                            y1={y1}
                            x2={fretboardWidth}
                            y2={y2}
                            stroke="#C0C0C0"
                            strokeWidth={thickness}
                        />
                    );
                })}

                {/* Tasti */}
                {[...Array(frets + 1)].map((_, i) => {
                    const x = getFretPosition(i);
                    const heightAtX = getHeightAtX(x, fretboardWidth);
                    const yTop = (fretboardHeightRight - heightAtX) / 2;
                    const yBottom = yTop + heightAtX;
                    return (
                        <line
                            key={`fret-${i}`}
                            x1={x}
                            y1={yTop}
                            x2={x}
                            y2={yBottom}
                            stroke="#D4AF37"
                            strokeWidth={i === 0 ? "4" : "2"}
                        />
                    );
                })}

                {/* Marker dots sui tasti 3, 5, 7, 9, 15, 17, 19, 21 */}
                {[3, 5, 7, 9, 15, 17, 19, 21].map(fret => {
                    const x = (getFretPosition(fret - 1) + getFretPosition(fret)) / 2;
                    const y = fretboardHeightRight / 2;
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
                    const y1 = fretboardHeightRight / 3;
                    const y2 = (2 * fretboardHeightRight) / 3;
                    return (
                        <g key={`double-dot-${fret}`}>
                            <circle cx={x} cy={y1} r="6" fill="#F5F5DC" opacity="0.7" />
                            <circle cx={x} cy={y2} r="6" fill="#F5F5DC" opacity="0.7" />
                        </g>
                    );
                })}

                {/* Zone interattive per le note */}
                {[...Array(strings)].map((_, stringIndex) => (
                    [...Array(frets)].map((_, fretIndex) => {
                        const fretNum = fretIndex + 1;
                        const x = (getFretPosition(fretNum - 1) + getFretPosition(fretNum)) / 2;
                        const y = getStringY(stringIndex, x);
                        const isHovered = hoveredNote?.string === stringIndex && hoveredNote?.fret === fretNum;

                        return (
                            <g key={`note-${stringIndex}-${fretNum}`}>
                                {/* Area invisibile per il mouse hover */}
                                <circle
                                    cx={x}
                                    cy={y}
                                    r="20"
                                    fill="transparent"
                                    style={{ cursor: 'pointer' }}
                                    onMouseEnter={() => setHoveredNote({ string: stringIndex, fret: fretNum })}
                                    onMouseLeave={() => setHoveredNote(null)}
                                    onClick={() => setSelectedNote({
                                        string: stringIndex,
                                        fret: fretNum,
                                        note: getNoteName(stringIndex, fretNum)
                                    })}
                                />
                                {/* Cerchietto giallo visibile solo in hover */}
                                {isHovered && (
                                    <circle
                                        cx={x}
                                        cy={y}
                                        r="12"
                                        fill="yellow"
                                        stroke="orange"
                                        strokeWidth="2"
                                        style={{ pointerEvents: 'none' }}
                                    />
                                )}
                            </g>
                        );
                    })
                ))}
            </svg>

            {/* Mostra la nota selezionata */}
            {selectedNote && (
                <div style={{
                    marginTop: '20px',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#333'
                }}>
                    Nota: {selectedNote.note} (Corda {selectedNote.string + 1}, Tasto {selectedNote.fret})
                </div>
            )}
        </div>
    );
}

export default GuitarFretboard;

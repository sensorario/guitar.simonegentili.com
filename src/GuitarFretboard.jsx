import React from 'react';
import configRepository from './repositories/ConfigRepository';

function GuitarFretboard() {
    const [hoveredNote, setHoveredNote] = React.useState(null);
    const [selectedNote, setSelectedNote] = React.useState(null);
    const [useItalianNotation, setUseItalianNotation] = React.useState(() => {
        // Carica la configurazione all'avvio
        const config = configRepository.load();
        return config.useItalianNotation;
    });

    // Salva la configurazione quando cambia
    React.useEffect(() => {
        configRepository.update('useItalianNotation', useItalianNotation);
    }, [useItalianNotation]);

    const strings = 6;
    const frets = 24;
    const scaleLength = 1200;
    const fretboardHeightLeft = 160; // Altezza a sinistra (meno stretta)
    const fretboardHeightRight = 200; // Altezza a destra (più larga)
    const openStringAreaWidth = 60; // Zona corde a vuoto senza tastiera sotto

    // Note delle corde a vuoto (dal MI alto al MI basso - invertito)
    const openStringNotes = ['E', 'B', 'G', 'D', 'A', 'E'];
    const noteSequence = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    // Mappa da notazione internazionale a italiana
    const noteToItalian = {
        'C': 'Do',
        'C#': 'Do#',
        'D': 'Re',
        'D#': 'Re#',
        'E': 'Mi',
        'F': 'Fa',
        'F#': 'Fa#',
        'G': 'Sol',
        'G#': 'Sol#',
        'A': 'La',
        'A#': 'La#',
        'B': 'Si'
    };

    // Funzione per convertire la nota nella notazione scelta
    const formatNoteName = (noteName) => {
        return useItalianNotation ? noteToItalian[noteName] : noteName;
    };

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
    const fretboardOffsetX = openStringAreaWidth;
    const totalWidth = fretboardOffsetX + fretboardWidth;

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Tastiera della Chitarra</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>Notazione:</span>
                    <label style={{
                        position: 'relative',
                        display: 'inline-block',
                        width: '60px',
                        height: '34px',
                        cursor: 'pointer'
                    }}>
                        <input
                            type="checkbox"
                            checked={useItalianNotation}
                            onChange={(e) => setUseItalianNotation(e.target.checked)}
                            style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: useItalianNotation ? '#4CAF50' : '#ccc',
                            borderRadius: '34px',
                            transition: 'background-color 0.3s',
                            cursor: 'pointer'
                        }}>
                            <span style={{
                                position: 'absolute',
                                content: '',
                                height: '26px',
                                width: '26px',
                                left: useItalianNotation ? '30px' : '4px',
                                bottom: '4px',
                                backgroundColor: 'white',
                                borderRadius: '50%',
                                transition: 'left 0.3s',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}></span>
                        </span>
                    </label>
                    <span style={{ fontSize: '14px', minWidth: '150px' }}>
                        {useItalianNotation ? 'Italiana (Do, Re, Mi)' : 'Internazionale (C, D, E)'}
                    </span>
                </div>
            </div>
            <svg width={totalWidth} height={fretboardHeightRight} xmlns="http://www.w3.org/2000/svg">
                {/* Sfondo della tastiera a forma di trapezio */}
                <polygon
                    points={`${fretboardOffsetX},${(fretboardHeightRight - fretboardHeightLeft) / 2} 
                             ${fretboardOffsetX},${(fretboardHeightRight + fretboardHeightLeft) / 2} 
                             ${totalWidth},${fretboardHeightRight} 
                             ${totalWidth},0`}
                    fill="#8B4513"
                    stroke="#654321"
                    strokeWidth="3"
                />

                {/* Corde */}
                {[...Array(strings)].map((_, i) => {
                    const y1 = getStringY(i, 0);
                    const y2 = getStringY(i, fretboardWidth);
                    const thickness = 0.5 + i * 0.4; // Invertito: la prima corda è sottile, l'ultima grossa
                    return (
                        <line
                            key={`string-${i}`}
                            x1="0"
                            y1={y1}
                            x2={totalWidth}
                            y2={y2}
                            stroke="#C0C0C0"
                            strokeWidth={thickness}
                        />
                    );
                })}

                {/* Tasti */}
                {[...Array(frets + 1)].map((_, i) => {
                    const x = fretboardOffsetX + getFretPosition(i);
                    const heightAtX = getHeightAtX(getFretPosition(i), fretboardWidth);
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
                    const x = fretboardOffsetX + (getFretPosition(fret - 1) + getFretPosition(fret)) / 2;
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
                    const x = fretboardOffsetX + (getFretPosition(fret - 1) + getFretPosition(fret)) / 2;
                    const y1 = fretboardHeightRight / 3;
                    const y2 = (2 * fretboardHeightRight) / 3;
                    return (
                        <g key={`double-dot-${fret}`}>
                            <circle cx={x} cy={y1} r="6" fill="#F5F5DC" opacity="0.7" />
                            <circle cx={x} cy={y2} r="6" fill="#F5F5DC" opacity="0.7" />
                        </g>
                    );
                })}

                {/* Zone interattive per le note (incluso tasto 0 = corda a vuoto) */}
                {[...Array(strings)].map((_, stringIndex) => (
                    [...Array(frets + 1)].map((_, fretIndex) => {
                        const fretNum = fretIndex;
                        const x = fretNum === 0
                            ? fretboardOffsetX / 2
                            : fretboardOffsetX + (getFretPosition(fretNum - 1) + getFretPosition(fretNum)) / 2;
                        const y = getStringY(stringIndex, Math.max(0, x - fretboardOffsetX));
                        const isHovered = hoveredNote?.string === stringIndex && hoveredNote?.fret === fretNum;

                        return (
                            <g key={`note-${stringIndex}-${fretNum}`}>
                                {/* Indicatore sempre visibile per la corda a vuoto */}
                                {fretNum === 0 && (
                                    <circle
                                        cx={x}
                                        cy={y}
                                        r="8"
                                        fill="#fff"
                                        stroke="#222"
                                        strokeWidth="2"
                                        style={{ pointerEvents: 'none' }}
                                    />
                                )}
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
                    Nota: {formatNoteName(selectedNote.note)} (Corda {selectedNote.string + 1}, Tasto {selectedNote.fret})
                </div>
            )}
        </div>
    );
}

export default GuitarFretboard;

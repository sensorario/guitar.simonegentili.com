import React from 'react';
import abcjs from 'abcjs';
import configRepository from './repositories/ConfigRepository';

const OPEN_STRING_MIDI = [64, 59, 55, 50, 45, 40];
const NOTE_SEQUENCE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ABC_NOTE_SEQUENCE = ['C', '^C', 'D', '^D', 'E', 'F', '^F', 'G', '^G', 'A', '^A', 'B'];
const NOTES_PER_MEASURE = 4;
const DEFAULT_MIN_MEASURES_PER_LINE = 2;
const DEFAULT_MAX_MEASURES_PER_LINE = 4;

const getPitchFromMidi = (midi) => {
    const noteIndex = midi % 12;
    const noteName = NOTE_SEQUENCE[noteIndex];
    const octave = Math.floor(midi / 12) - 1;

    return {
        midi,
        noteName,
        octave,
        displayMidi: midi + 12
    };
};

const getAbcPitchFromMidi = (midi) => {
    const noteIndex = ((midi % 12) + 12) % 12;
    const abcNote = ABC_NOTE_SEQUENCE[noteIndex];
    const octave = Math.floor(midi / 12) - 1;
    const accidental = abcNote.startsWith('^') ? '^' : '';
    const noteLetter = accidental ? abcNote[1] : abcNote[0];

    if (octave >= 5) {
        const apostrophes = "'".repeat(Math.max(0, octave - 5));
        return `${accidental}${noteLetter.toLowerCase()}${apostrophes}`;
    }

    const commas = ','.repeat(Math.max(0, 4 - octave));
    return `${accidental}${noteLetter}${commas}`;
};

const clampToPositiveInteger = (value, fallbackValue) => {
    const parsedValue = Number.parseInt(value, 10);

    if (Number.isNaN(parsedValue) || parsedValue < 1) {
        return fallbackValue;
    }

    return parsedValue;
};

const splitMeasuresIntoLines = (measures, minMeasuresPerLine, maxMeasuresPerLine) => {
    const totalMeasures = measures.length;

    if (totalMeasures === 0) {
        return [];
    }

    const minLines = Math.ceil(totalMeasures / maxMeasuresPerLine);
    const maxLines = Math.max(1, Math.floor(totalMeasures / minMeasuresPerLine));
    const linesCount = minLines <= maxLines ? minLines : minLines;

    const baseLineSize = Math.floor(totalMeasures / linesCount);
    const extraMeasures = totalMeasures % linesCount;
    const lines = [];
    let cursor = 0;

    for (let lineIndex = 0; lineIndex < linesCount; lineIndex += 1) {
        const lineSize = baseLineSize + (lineIndex < extraMeasures ? 1 : 0);
        lines.push(measures.slice(cursor, cursor + lineSize));
        cursor += lineSize;
    }

    return lines;
};

const buildAbcNotation = (notes, minMeasuresPerLine, maxMeasuresPerLine) => {
    const visibleNotes = notes;

    if (visibleNotes.length === 0) {
        return [
            'X:1',
            'M:4/4',
            'L:1/4',
            'K:C clef=treble',
            '| z z z z |]'
        ].join('\n');
    }

    const abcNotes = visibleNotes.map((note) => getAbcPitchFromMidi(note.displayMidi));
    const measures = [];

    for (let index = 0; index < abcNotes.length; index += NOTES_PER_MEASURE) {
        const measureNotes = abcNotes.slice(index, index + NOTES_PER_MEASURE);

        while (measureNotes.length < NOTES_PER_MEASURE) {
            measureNotes.push('z');
        }

        measures.push(measureNotes.join(' '));
    }

    const sanitizedMin = clampToPositiveInteger(minMeasuresPerLine, DEFAULT_MIN_MEASURES_PER_LINE);
    const sanitizedMax = Math.max(
        sanitizedMin,
        clampToPositiveInteger(maxMeasuresPerLine, DEFAULT_MAX_MEASURES_PER_LINE)
    );
    const measureLines = splitMeasuresIntoLines(measures, sanitizedMin, sanitizedMax);
    const abcStaffLines = measureLines.map((line, lineIndex) => {
        const suffix = lineIndex === measureLines.length - 1 ? ' |]' : ' |';
        return `| ${line.join(' | ')}${suffix}`;
    });

    return [
        'X:1',
        'T:Pentagramma Chitarra',
        'M:4/4',
        'L:1/4',
        'K:C clef=treble',
        ...abcStaffLines
    ].join('\n');
};

function StaffNotation({ notes, formatNoteName, minMeasuresPerLine, maxMeasuresPerLine }) {
    const notationContainerRef = React.useRef(null);
    const abcNotation = React.useMemo(
        () => buildAbcNotation(notes, minMeasuresPerLine, maxMeasuresPerLine),
        [notes, minMeasuresPerLine, maxMeasuresPerLine]
    );

    React.useEffect(() => {
        if (!notationContainerRef.current) {
            return;
        }

        abcjs.renderAbc(notationContainerRef.current, abcNotation, {
            responsive: 'resize',
            staffwidth: 920,
            add_classes: true,
            wrap: {
                minSpacing: 1.8,
                maxSpacing: 2.8
            }
        });
    }, [abcNotation]);

    return (
        <div className="staff-panel">
            <div className="staff-panel__header">
                <h3>Pentagramma</h3>
                <span>{notes.length} note nello stack</span>
            </div>
            <div
                ref={notationContainerRef}
                className="staff-panel__score"
                role="img"
                aria-label="Pentagramma con battute delle note selezionate"
            />
            <p className="staff-panel__legend">
                Mostrate {notes.length} note in battute da 4/4.
                {' '}
                Range battute/riga: min {minMeasuresPerLine}, max {maxMeasuresPerLine}.
                {' '}
                {notes.length > 0 && `Ultima nota: ${formatNoteName(notes[notes.length - 1].noteName)}.`}
            </p>
        </div>
    );
}

function GuitarFretboard() {
    const [hoveredNote, setHoveredNote] = React.useState(null);
    const [noteStack, setNoteStack] = React.useState([]);
    const [minMeasuresPerLine, setMinMeasuresPerLine] = React.useState(DEFAULT_MIN_MEASURES_PER_LINE);
    const [maxMeasuresPerLine, setMaxMeasuresPerLine] = React.useState(DEFAULT_MAX_MEASURES_PER_LINE);
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

    const handleMinMeasuresChange = (event) => {
        const nextMin = clampToPositiveInteger(event.target.value, DEFAULT_MIN_MEASURES_PER_LINE);
        setMinMeasuresPerLine(nextMin);
        setMaxMeasuresPerLine((currentMax) => Math.max(currentMax, nextMin));
    };

    const handleMaxMeasuresChange = (event) => {
        const nextMax = clampToPositiveInteger(event.target.value, DEFAULT_MAX_MEASURES_PER_LINE);
        setMaxMeasuresPerLine(Math.max(nextMax, minMeasuresPerLine));
    };

    const addNoteToStack = (stringIndex, fret) => {
        const midi = OPEN_STRING_MIDI[stringIndex] + fret;
        const pitch = getPitchFromMidi(midi);

        setNoteStack((currentStack) => [
            ...currentStack,
            {
                id: `${stringIndex}-${fret}-${Date.now()}-${currentStack.length}`,
                string: stringIndex,
                fret,
                ...pitch
            }
        ]);
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
        <div className="guitar-page">
            <div className="fretboard-toolbar">
                <h2 style={{ margin: 0 }}>Tastiera della Chitarra</h2>
                <div className="notation-controls">
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
                    <div className="measure-controls">
                        <label>
                            Min battute/riga
                            <input
                                type="number"
                                min="1"
                                max="12"
                                value={minMeasuresPerLine}
                                onChange={handleMinMeasuresChange}
                            />
                        </label>
                        <label>
                            Max battute/riga
                            <input
                                type="number"
                                min={minMeasuresPerLine}
                                max="12"
                                value={maxMeasuresPerLine}
                                onChange={handleMaxMeasuresChange}
                            />
                        </label>
                    </div>
                    <button
                        type="button"
                        onClick={() => setNoteStack([])}
                        disabled={noteStack.length === 0}
                        className="stack-button"
                    >
                        Svuota stack
                    </button>
                </div>
            </div>

            <div className="fretboard-shell">
                <svg width={totalWidth} height={fretboardHeightRight} xmlns="http://www.w3.org/2000/svg" className="fretboard-svg">
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
                                        onClick={() => addNoteToStack(stringIndex, fretNum)}
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
            </div>

            {noteStack.length > 0 && (
                <div className="selected-note-label">
                    Ultima nota: {formatNoteName(noteStack[noteStack.length - 1].noteName)} (Corda {noteStack[noteStack.length - 1].string + 1}, Tasto {noteStack[noteStack.length - 1].fret})
                </div>
            )}

            <StaffNotation
                notes={noteStack}
                formatNoteName={formatNoteName}
                minMeasuresPerLine={minMeasuresPerLine}
                maxMeasuresPerLine={maxMeasuresPerLine}
            />
        </div>
    );
}

export default GuitarFretboard;

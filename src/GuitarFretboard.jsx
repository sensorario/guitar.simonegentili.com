import React from 'react';
import abcjs from 'abcjs';
import * as Tone from 'tone';
import configRepository from './repositories/ConfigRepository';

const OPEN_STRING_MIDI = [64, 59, 55, 50, 45, 40];
const NOTE_SEQUENCE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ABC_NOTE_SEQUENCE = ['C', '^C', 'D', '^D', 'E', 'F', '^F', 'G', '^G', 'A', '^A', 'B'];
const DEFAULT_MIN_MEASURES_PER_LINE = 2;
const DEFAULT_MAX_MEASURES_PER_LINE = 4;
const DEFAULT_INSTRUMENT = 'piano';
const DEFAULT_NOTE_DURATION = 'quarter';
const INSTRUMENT_OPTIONS = [
    { value: 'piano', label: 'Pianoforte' },
    { value: 'guitar', label: 'Chitarra' },
    { value: 'bass', label: 'Basso' },
    { value: 'organ', label: 'Organo' },
    { value: 'synth', label: 'Synth' },
    { value: 'lead', label: 'Lead' },
    { value: 'pad', label: 'Pad' },
    { value: 'strings', label: 'Strings' },
    { value: 'brass', label: 'Brass' },
    { value: 'bell', label: 'Bell' },
    { value: 'marimba', label: 'Marimba' },
    { value: 'duo', label: 'Duo Synth' },
    { value: 'membrane', label: 'Membrane' },
    { value: 'metal', label: 'Metal' }
];
const DURATION_OPTIONS = [
    { value: 'whole', label: 'Semibreve', beats: 4, abcUnits: 16, tone: '1n' },
    { value: 'half', label: 'Minima', beats: 2, abcUnits: 8, tone: '2n' },
    { value: 'quarter', label: 'Semiminima', beats: 1, abcUnits: 4, tone: '4n' },
    { value: 'eighth', label: 'Croma', beats: 0.5, abcUnits: 2, tone: '8n' },
    { value: 'sixteenth', label: 'Semicroma', beats: 0.25, abcUnits: 1, tone: '16n' }
];

const getDurationOption = (value) => {
    return DURATION_OPTIONS.find((option) => option.value === value) ?? DURATION_OPTIONS[2];
};

const createPolyInstrument = (SynthClass, options, defaultDuration = '8n') => {
    const synth = new Tone.PolySynth(SynthClass, options).toDestination();

    return {
        synth,
        playNote: (midi, duration = defaultDuration) => {
            synth.triggerAttackRelease(Tone.Frequency(midi, 'midi').toNote(), duration);
        },
        stop: () => {
            synth.releaseAll();
            synth.dispose();
        }
    };
};

const createMonoInstrument = (synth, defaultDuration = '8n') => ({
    synth,
    playNote: (midi, duration = defaultDuration) => {
        synth.triggerAttackRelease(Tone.Frequency(midi, 'midi').toNote(), duration);
    },
    stop: () => {
        if (typeof synth.triggerRelease === 'function') {
            synth.triggerRelease();
        }

        synth.dispose();
    }
});

const createInstrument = (instrument) => {
    if (instrument === 'guitar') {
        const synth = new Tone.PluckSynth({
            attackNoise: 1.1,
            dampening: 2600,
            resonance: 0.96,
            release: 0.9
        }).toDestination();

        return {
            synth,
            playNote: (midi) => {
                synth.triggerAttack(Tone.Frequency(midi, 'midi').toNote());
            },
            stop: () => {
                synth.dispose();
            }
        };
    }

    if (instrument === 'bass') {
        return createMonoInstrument(new Tone.MonoSynth({
            volume: -6,
            oscillator: { type: 'fatsquare' },
            filter: { Q: 2, type: 'lowpass', rolloff: -24 },
            envelope: { attack: 0.03, decay: 0.25, sustain: 0.4, release: 0.7 },
            filterEnvelope: {
                attack: 0.02,
                decay: 0.2,
                sustain: 0.5,
                release: 0.8,
                baseFrequency: 90,
                octaves: 2.6
            }
        }).toDestination(), '8n');
    }

    if (instrument === 'organ') {
        return createPolyInstrument(Tone.AMSynth, {
            volume: -10,
            harmonicity: 3,
            oscillator: { type: 'sine' },
            envelope: { attack: 0.02, decay: 0.1, sustain: 0.95, release: 0.4 },
            modulation: { type: 'square' },
            modulationEnvelope: { attack: 0.02, decay: 0.05, sustain: 1, release: 0.3 }
        }, '4n');
    }

    if (instrument === 'synth') {
        return createPolyInstrument(Tone.FMSynth, {
            volume: -9,
            harmonicity: 1.5,
            modulationIndex: 7,
            oscillator: { type: 'sawtooth' },
            envelope: { attack: 0.03, decay: 0.18, sustain: 0.45, release: 0.5 },
            modulation: { type: 'triangle' },
            modulationEnvelope: { attack: 0.05, decay: 0.15, sustain: 0.3, release: 0.4 }
        });
    }

    if (instrument === 'lead') {
        return createMonoInstrument(new Tone.Synth({
            volume: -8,
            oscillator: { type: 'fatsawtooth', count: 3, spread: 20 },
            envelope: { attack: 0.01, decay: 0.12, sustain: 0.35, release: 0.2 }
        }).toDestination(), '8n');
    }

    if (instrument === 'pad') {
        return createPolyInstrument(Tone.Synth, {
            volume: -12,
            oscillator: { type: 'sine' },
            envelope: { attack: 0.2, decay: 0.4, sustain: 0.85, release: 1.6 }
        }, '2n');
    }

    if (instrument === 'strings') {
        return createPolyInstrument(Tone.Synth, {
            volume: -10,
            oscillator: { type: 'fattriangle', count: 3, spread: 18 },
            envelope: { attack: 0.08, decay: 0.25, sustain: 0.7, release: 1.1 }
        }, '4n');
    }

    if (instrument === 'brass') {
        return createMonoInstrument(new Tone.MonoSynth({
            volume: -9,
            oscillator: { type: 'sawtooth' },
            envelope: { attack: 0.04, decay: 0.14, sustain: 0.6, release: 0.35 },
            filterEnvelope: {
                attack: 0.03,
                decay: 0.12,
                sustain: 0.45,
                release: 0.3,
                baseFrequency: 200,
                octaves: 3
            }
        }).toDestination(), '8n');
    }

    if (instrument === 'bell') {
        return createMonoInstrument(new Tone.FMSynth({
            volume: -12,
            harmonicity: 8,
            modulationIndex: 12,
            oscillator: { type: 'sine' },
            envelope: { attack: 0.001, decay: 1.2, sustain: 0, release: 1.4 },
            modulation: { type: 'square' },
            modulationEnvelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.8 }
        }).toDestination(), '8n');
    }

    if (instrument === 'marimba') {
        return createMonoInstrument(new Tone.MembraneSynth({
            volume: -10,
            pitchDecay: 0.01,
            octaves: 2,
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.2 }
        }).toDestination(), '16n');
    }

    if (instrument === 'duo') {
        return createMonoInstrument(new Tone.DuoSynth({
            volume: -10,
            harmonicity: 1.5,
            vibratoAmount: 0.3,
            vibratoRate: 4,
            voice0: {
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.01, decay: 0.15, sustain: 0.5, release: 0.4 }
            },
            voice1: {
                oscillator: { type: 'square' },
                envelope: { attack: 0.02, decay: 0.1, sustain: 0.4, release: 0.35 }
            }
        }).toDestination(), '8n');
    }

    if (instrument === 'membrane') {
        return createMonoInstrument(new Tone.MembraneSynth({
            volume: -8,
            pitchDecay: 0.04,
            octaves: 6,
            oscillator: { type: 'sine' },
            envelope: { attack: 0.001, decay: 0.45, sustain: 0.01, release: 0.3 }
        }).toDestination(), '8n');
    }

    if (instrument === 'metal') {
        const synth = new Tone.MetalSynth({
            volume: -14,
            frequency: 220,
            envelope: { attack: 0.001, decay: 0.35, release: 0.25 },
            harmonicity: 5.1,
            modulationIndex: 24,
            resonance: 3000,
            octaves: 1.5
        }).toDestination();

        return {
            synth,
            playNote: (midi, duration = '16n') => {
                synth.frequency.value = Tone.Frequency(midi, 'midi').toFrequency();
                synth.triggerAttackRelease(duration);
            },
            stop: () => {
                synth.dispose();
            }
        };
    }

    return createPolyInstrument(Tone.Synth, {
        volume: -7,
        oscillator: {
            type: 'triangle'
        },
        envelope: {
            attack: 0.02,
            decay: 0.18,
            sustain: 0.3,
            release: 0.8
        }
    });
};

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
            'L:1/16',
            'K:C clef=treble',
            '| z16 |]'
        ].join('\n');
    }

    const abcNotes = visibleNotes.map((note) => {
        const durationOption = getDurationOption(note.duration);
        const pitch = getAbcPitchFromMidi(note.displayMidi);
        return {
            value: durationOption.abcUnits === 1 ? pitch : `${pitch}${durationOption.abcUnits}`,
            abcUnits: durationOption.abcUnits
        };
    });
    const measures = [];
    let currentMeasure = [];
    let currentUnits = 0;

    for (const abcNote of abcNotes) {
        if (currentUnits + abcNote.abcUnits > 16) {
            if (currentUnits < 16) {
                const restUnits = 16 - currentUnits;
                currentMeasure.push(restUnits === 1 ? 'z' : `z${restUnits}`);
            }

            measures.push(currentMeasure.join(' '));
            currentMeasure = [];
            currentUnits = 0;
        }

        currentMeasure.push(abcNote.value);
        currentUnits += abcNote.abcUnits;
    }

    if (currentMeasure.length > 0) {
        if (currentUnits < 16) {
            const restUnits = 16 - currentUnits;
            currentMeasure.push(restUnits === 1 ? 'z' : `z${restUnits}`);
        }

        measures.push(currentMeasure.join(' '));
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
        'M:4/4',
        'L:1/16',
        'K:C clef=treble',
        ...abcStaffLines
    ].join('\n');
};

function ToolbarIcon({ children }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className="toolbar-icon"
            aria-hidden="true"
            focusable="false"
        >
            {children}
        </svg>
    );
}

function DurationIcon({ duration, className = '' }) {
    const classes = ['duration-icon', className].filter(Boolean).join(' ');
    const strokeProps = {
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.7,
        strokeLinecap: 'round',
        strokeLinejoin: 'round'
    };

    return (
        <svg viewBox="0 0 24 24" className={classes} aria-hidden="true" focusable="false">
            {duration === 'whole' && (
                <ellipse cx="12" cy="15.5" rx="5.8" ry="4.1" {...strokeProps} />
            )}

            {duration === 'half' && (
                <>
                    <ellipse cx="10" cy="16" rx="4.6" ry="3.2" {...strokeProps} />
                    <path d="M14.2 15.2V4.5" {...strokeProps} />
                </>
            )}

            {duration === 'quarter' && (
                <>
                    <ellipse cx="10" cy="16" rx="4.6" ry="3.2" fill="currentColor" transform="rotate(-18 10 16)" />
                    <path d="M13.5 15.3V4.5" {...strokeProps} />
                </>
            )}

            {duration === 'eighth' && (
                <>
                    <ellipse cx="9.5" cy="16" rx="4.4" ry="3.1" fill="currentColor" transform="rotate(-18 9.5 16)" />
                    <path d="M13 15.2V4.4" {...strokeProps} />
                    <path d="M13 4.6C15.8 5.2 17.5 6.7 17.6 9.2C16.4 8 15 7.3 13 7.4" {...strokeProps} />
                </>
            )}

            {duration === 'sixteenth' && (
                <>
                    <ellipse cx="9.5" cy="16" rx="4.4" ry="3.1" fill="currentColor" transform="rotate(-18 9.5 16)" />
                    <path d="M13 15.2V4.2" {...strokeProps} />
                    <path d="M13 4.4C15.9 5 17.6 6.5 17.7 9C16.5 7.8 15.1 7.1 13 7.2" {...strokeProps} />
                    <path d="M13 8.5C15.6 9.1 17.1 10.4 17.2 12.4C16.1 11.5 14.8 10.9 13 11" {...strokeProps} />
                </>
            )}
        </svg>
    );
}

function StaffNotation({ notes, formatNoteName, minMeasuresPerLine, maxMeasuresPerLine, noteDuration }) {
    const notationContainerRef = React.useRef(null);
    const durationOption = React.useMemo(() => getDurationOption(noteDuration), [noteDuration]);
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
                Durata selezionata: {durationOption.label}.
                {' '}
                Range battute/riga: min {minMeasuresPerLine}, max {maxMeasuresPerLine}.
                {' '}
                {notes.length > 0 && `Ultima nota: ${formatNoteName(notes[notes.length - 1].noteName)} (${getDurationOption(notes[notes.length - 1].duration).label}).`}
            </p>
        </div>
    );
}

function GuitarFretboard() {
    const [hoveredNote, setHoveredNote] = React.useState(null);
    const [noteStack, setNoteStack] = React.useState([]);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [instrument, setInstrument] = React.useState(DEFAULT_INSTRUMENT);
    const [noteDuration, setNoteDuration] = React.useState(DEFAULT_NOTE_DURATION);
    const [minMeasuresPerLine, setMinMeasuresPerLine] = React.useState(DEFAULT_MIN_MEASURES_PER_LINE);
    const [maxMeasuresPerLine, setMaxMeasuresPerLine] = React.useState(DEFAULT_MAX_MEASURES_PER_LINE);
    const synthRef = React.useRef(null);
    const playbackActiveRef = React.useRef(false);
    const [useItalianNotation, setUseItalianNotation] = React.useState(() => {
        // Carica la configurazione all'avvio
        const config = configRepository.load();
        return config.useItalianNotation;
    });

    // Salva la configurazione quando cambia
    React.useEffect(() => {
        configRepository.update('useItalianNotation', useItalianNotation);
    }, [useItalianNotation]);

    React.useEffect(() => {
        return () => {
            playbackActiveRef.current = false;

            if (synthRef.current) {
                synthRef.current.stop();
                synthRef.current = null;
            }
        };
    }, []);

    React.useEffect(() => {
        if (synthRef.current) {
            synthRef.current.stop();
            synthRef.current = null;
        }
    }, [instrument]);

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
        const duration = noteDuration;

        setNoteStack((currentStack) => [
            ...currentStack,
            {
                id: `${stringIndex}-${fret}-${Date.now()}-${currentStack.length}`,
                string: stringIndex,
                fret,
                duration,
                ...pitch
            }
        ]);
    };

    const removeLastNoteFromStack = () => {
        setNoteStack((currentStack) => currentStack.slice(0, -1));
    };

    const stopPlayback = React.useCallback(() => {
        playbackActiveRef.current = false;
        setIsPlaying(false);

        if (synthRef.current) {
            synthRef.current.stop();
            synthRef.current = null;
        }
    }, []);

    const playStack = React.useCallback(async () => {
        if (noteStack.length === 0 || isPlaying) {
            return;
        }

        await Tone.start();

        if (!synthRef.current) {
            synthRef.current = createInstrument(instrument);
        }

        setIsPlaying(true);
        playbackActiveRef.current = true;

        const msPerQuarter = 500;

        try {
            for (const note of noteStack) {
                if (!playbackActiveRef.current) {
                    break;
                }

                const durationOption = getDurationOption(note.duration);
                synthRef.current.playNote(note.displayMidi, durationOption.tone);
                await new Promise((resolve) => window.setTimeout(resolve, msPerQuarter * durationOption.beats));
            }
        } finally {
            playbackActiveRef.current = false;
            setIsPlaying(false);
        }
    }, [instrument, isPlaying, noteStack]);

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
            <div className="fretboard-toolbar editor-toolbar">
                <div className="editor-toolbar__group editor-toolbar__group--notation">
                    <span className="editor-toolbar__label">Notazione</span>
                    <label className="editor-toggle">
                        <input
                            type="checkbox"
                            checked={useItalianNotation}
                            onChange={(e) => setUseItalianNotation(e.target.checked)}
                            className="editor-toggle__input"
                        />
                        <span className="editor-toggle__track">
                            <span className="editor-toggle__thumb"></span>
                        </span>
                    </label>
                    <span className="editor-toolbar__value">
                        {useItalianNotation ? 'Italiana (Do, Re, Mi)' : 'Internazionale (C, D, E)'}
                    </span>
                </div>

                <span className="editor-toolbar__divider" aria-hidden="true"></span>

                <div className="editor-toolbar__group">
                    <label className="instrument-control editor-toolbar__field">
                        Strumento
                        <select
                            value={instrument}
                            onChange={(event) => setInstrument(event.target.value)}
                            disabled={isPlaying}
                        >
                            {INSTRUMENT_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <div className="instrument-control editor-toolbar__field duration-picker" role="group" aria-label="Durata note">
                        <span>Durata</span>
                        <div className="duration-picker__options">
                            {DURATION_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={`duration-picker__button${noteDuration === option.value ? ' duration-picker__button--active' : ''}`}
                                    onClick={() => setNoteDuration(option.value)}
                                    disabled={isPlaying}
                                    aria-label={option.label}
                                    title={option.label}
                                >
                                    <DurationIcon duration={option.value} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <span className="editor-toolbar__divider" aria-hidden="true"></span>

                <div className="measure-controls editor-toolbar__group">
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

                <span className="editor-toolbar__divider" aria-hidden="true"></span>

                <div className="editor-toolbar__actions">
                    <button
                        type="button"
                        onClick={removeLastNoteFromStack}
                        disabled={noteStack.length === 0 || isPlaying}
                        className="stack-button"
                        aria-label="Annulla ultima nota"
                        title="Annulla ultima nota"
                    >
                        <ToolbarIcon>
                            <path
                                d="M10 7L5 12L10 17"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M6 12H15C17.7614 12 20 14.2386 20 17"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </ToolbarIcon>
                    </button>
                    <button
                        type="button"
                        onClick={() => setNoteStack([])}
                        disabled={noteStack.length === 0 || isPlaying}
                        className="stack-button"
                        aria-label="Svuota stack"
                        title="Svuota stack"
                    >
                        <ToolbarIcon>
                            <path
                                d="M4 7H20"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                            <path
                                d="M9 7V5C9 4.44772 9.44772 4 10 4H14C14.5523 4 15 4.44772 15 5V7"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M7 7L8 19C8.08911 20.0681 8.9822 20.8889 10.054 20.8889H13.946C15.0178 20.8889 15.9109 20.0681 16 19L17 7"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M10 11V17"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                            <path
                                d="M14 11V17"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </ToolbarIcon>
                    </button>
                    <button
                        type="button"
                        onClick={playStack}
                        disabled={noteStack.length === 0 || isPlaying}
                        className="playback-button"
                        aria-label={isPlaying ? 'In riproduzione' : 'Riproduci'}
                        title={isPlaying ? 'In riproduzione' : 'Riproduci'}
                    >
                        <ToolbarIcon>
                            <path
                                d="M8 6V18L18 12L8 6Z"
                                fill="currentColor"
                            />
                        </ToolbarIcon>
                    </button>
                    <button
                        type="button"
                        onClick={stopPlayback}
                        disabled={!isPlaying}
                        className="playback-button playback-button--stop"
                        aria-label="Stop"
                        title="Stop"
                    >
                        <ToolbarIcon>
                            <rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" />
                        </ToolbarIcon>
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
                noteDuration={noteDuration}
            />
        </div>
    );
}

export default GuitarFretboard;

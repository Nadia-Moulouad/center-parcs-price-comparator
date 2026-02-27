import { Head, router, usePage } from '@inertiajs/react';
import React, { useState, useMemo } from 'react';

type Sejour = {
    id: number;
    housing_code: string;
    housing_type: string;
    comfort_level: string;
    nb_personnes: number;
    date_arrivee: string;
    duree: number;
    prix: number;
    prix_original: number | null;
};

type Props = { sejours: Sejour[] };

const DUREES = [2, 3, 4, 5, 6, 7, 10, 11, 14];
const MIN_IDX = 0;
const MAX_IDX = DUREES.length - 1;

const COMFORT_STYLE: Record<string, string> = {
    VIP:     'bg-violet-600 text-white',
    Premium: 'bg-amber-500 text-black',
    Comfort: 'bg-teal-600 text-white',
    Classic: 'bg-neutral-500 text-white',
};

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer
                ${active
                    ? 'bg-indigo-600 border-indigo-600 text-white font-semibold'
                    : 'bg-transparent border-sidebar-border text-neutral-500 hover:border-indigo-500 hover:text-neutral-300'
                }`}
        >
            {label}
        </button>
    );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-[0.65rem] font-bold tracking-widest uppercase text-neutral-500 mb-2">
            {children}
        </p>
    );
}

export default function Index({ sejours }: Props) {
    const { props } = usePage();
    const flash = props.flash as { success?: string; error?: string } | undefined;

    const [minIdx, setMinIdx] = useState(0);
    const [maxIdx, setMaxIdx] = useState(MAX_IDX);
    const dureesScraping = DUREES.slice(minIdx, maxIdx + 1);

    const [filtreComfort, setFiltreComfort]     = useState<string[]>([]);
    const [filtreType, setFiltreType]           = useState<string[]>([]);
    const [filtrePersonnes, setFiltrePersonnes] = useState<number[]>([]);
    const [filtreDurees, setFiltreDurees]       = useState<number[]>([]);
    const [filtreDates, setFiltreDates]         = useState<string[]>([]);
    const [tri, setTri] = useState<'prix_asc' | 'prix_desc' | 'date_asc' | 'remise'>('prix_asc');

    const allComforts  = useMemo(() => [...new Set(sejours.map(s => s.comfort_level))].sort(), [sejours]);
    const allTypes     = useMemo(() => [...new Set(sejours.map(s => s.housing_type))].sort(), [sejours]);
    const allPersonnes = useMemo(() => [...new Set(sejours.map(s => s.nb_personnes))].sort((a, b) => a - b), [sejours]);
    const allDurees    = useMemo(() => [...new Set(sejours.map(s => s.duree))].sort((a, b) => a - b), [sejours]);
    const allDates     = useMemo(() => [...new Set(sejours.map(s => s.date_arrivee))].sort(), [sejours]);

    function toggle<T>(arr: T[], val: T): T[] {
        return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
    }

    const sejoursAffiches = useMemo(() => {
        let result = [...sejours];

        if (filtreComfort.length)   result = result.filter(s => filtreComfort.includes(s.comfort_level));
        if (filtreType.length)      result = result.filter(s => filtreType.includes(s.housing_type));
        if (filtrePersonnes.length) result = result.filter(s => filtrePersonnes.includes(s.nb_personnes));
        if (filtreDurees.length)    result = result.filter(s => filtreDurees.includes(s.duree));
        if (filtreDates.length)     result = result.filter(s => filtreDates.includes(s.date_arrivee));

        switch (tri) {
            case 'prix_asc':  result.sort((a, b) => a.prix - b.prix); break;
            case 'prix_desc': result.sort((a, b) => b.prix - a.prix); break;
            case 'date_asc':  result.sort((a, b) => a.date_arrivee.localeCompare(b.date_arrivee)); break;
            case 'remise':
                result.sort((a, b) => {
                    const ra = a.prix_original ? (1 - a.prix / a.prix_original) : 0;
                    const rb = b.prix_original ? (1 - b.prix / b.prix_original) : 0;
                    return rb - ra;
                });
                break;
        }

        return result;
    }, [sejours, filtreComfort, filtreType, filtrePersonnes, filtreDurees, filtreDates, tri]);

    function resetFiltres() {
        setFiltreComfort([]);
        setFiltreType([]);
        setFiltrePersonnes([]);
        setFiltreDurees([]);
        setFiltreDates([]);
        setTri('prix_asc');
    }

    const nbFiltresActifs = filtreComfort.length + filtreType.length + filtrePersonnes.length + filtreDurees.length + filtreDates.length;

    const panelClass = "rounded-xl border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 p-4 mb-3";

    return (
        <>
            <Head title="Prix Center Parcs" />

            <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans">
                <div className="max-w-[98vw] mx-auto p-4">

                    {/* Header */}
                    <div className="flex items-baseline gap-3 mb-1">
                        <h1 className="text-2xl font-extrabold tracking-tight">🏕️ Prix Center Parcs</h1>
                        <span className="text-sm text-neutral-400">
                            {sejoursAffiches.length} / {sejours.length} séjours
                        </span>
                    </div>
                    <p className="text-xs text-neutral-500 mb-4">Villages Nature Paris · VN</p>

                    {/* Flash */}
                    {flash?.success && (
                        <div className="bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-xl px-4 py-2.5 text-sm mb-3">
                            {flash.success}
                        </div>
                    )}
                    {flash?.error && (
                        <div className="bg-red-950 text-red-300 border border-red-800 rounded-xl px-4 py-2.5 text-sm mb-3">
                            {flash.error}
                        </div>
                    )}

                    {/* Layout sidebar + grille */}
                    <div className="grid gap-4" style={{ gridTemplateColumns: '260px 1fr', alignItems: 'start' }}>

                        {/* Sidebar */}
                        <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto [scrollbar-width:thin]">

                            {/* Panel scraping */}
                            <div className={panelClass}>
                                <SectionLabel>Scraping</SectionLabel>

                                <div className="flex justify-between text-xs text-neutral-400 mb-1">
                                    <span>{DUREES[minIdx]}n</span>
                                    <span>{DUREES[maxIdx]}n</span>
                                </div>

                                <div className="mb-2">
                                    <label className="text-[0.68rem] text-neutral-500 block mb-0.5">Min</label>
                                    <input type="range" min={MIN_IDX} max={MAX_IDX} value={minIdx}
                                        onChange={e => setMinIdx(Math.min(+e.target.value, maxIdx))}
                                        className="w-full accent-indigo-500" />
                                </div>
                                <div className="mb-3">
                                    <label className="text-[0.68rem] text-neutral-500 block mb-0.5">Max</label>
                                    <input type="range" min={MIN_IDX} max={MAX_IDX} value={maxIdx}
                                        onChange={e => setMaxIdx(Math.max(+e.target.value, minIdx))}
                                        className="w-full accent-indigo-500" />
                                </div>

                                {/* Pills durées sélectionnées */}
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {DUREES.map((d, i) => {
                                        const sel = i >= minIdx && i <= maxIdx;
                                        return (
                                            <span key={d} className={`px-2 py-0.5 rounded-full text-[0.68rem] font-medium
                                                ${sel
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-neutral-800 text-neutral-500'
                                                }`}>
                                                {d}n
                                            </span>
                                        );
                                    })}
                                </div>

                                <p className="text-[0.68rem] text-neutral-500 mb-3">
                                    {dureesScraping.length} durée(s) · ~{dureesScraping.length * 22} appels
                                </p>

                                <button
                                    onClick={() => router.post('/scraper', { durees: dureesScraping })}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm py-2 rounded-lg transition-colors cursor-pointer"
                                >
                                    🔄 Lancer le scraping
                                </button>
                            </div>

                            {/* Panel filtres */}
                            <div className={panelClass}>
                                <div className="flex justify-between items-center mb-3">
                                    <SectionLabel>Filtres</SectionLabel>
                                    {nbFiltresActifs > 0 && (
                                        <button onClick={resetFiltres}
                                            className="text-[0.68rem] text-indigo-400 hover:text-indigo-300 bg-none border-none cursor-pointer transition-colors">
                                            Tout réinitialiser
                                        </button>
                                    )}
                                </div>

                                {/* Tri */}
                                <div className="mb-4">
                                    <SectionLabel>Trier par</SectionLabel>
                                    <div className="flex flex-col gap-0.5">
                                        {([
                                            ['prix_asc',  '💰 Prix croissant'],
                                            ['prix_desc', '💸 Prix décroissant'],
                                            ['date_asc',  "📅 Date d'arrivée"],
                                            ['remise',    '🏷️ Meilleures remises'],
                                        ] as const).map(([val, label]) => (
                                            <button key={val} onClick={() => setTri(val)}
                                                className={`text-left px-2.5 py-1.5 rounded-lg text-xs border transition-all cursor-pointer
                                                    ${tri === val
                                                        ? 'border-indigo-600 bg-indigo-600/15 text-indigo-300'
                                                        : 'border-transparent text-neutral-500 hover:text-neutral-300'
                                                    }`}>
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Confort */}
                                <div className="mb-4">
                                    <SectionLabel>Confort</SectionLabel>
                                    <div className="flex flex-wrap gap-1.5">
                                        {allComforts.map(c => (
                                            <Pill key={c} label={c}
                                                active={filtreComfort.includes(c)}
                                                onClick={() => setFiltreComfort(toggle(filtreComfort, c))} />
                                        ))}
                                    </div>
                                </div>

                                {/* Type */}
                                <div className="mb-4">
                                    <SectionLabel>Type de logement</SectionLabel>
                                    <div className="flex flex-wrap gap-1.5">
                                        {allTypes.map(t => (
                                            <Pill key={t} label={t}
                                                active={filtreType.includes(t)}
                                                onClick={() => setFiltreType(toggle(filtreType, t))} />
                                        ))}
                                    </div>
                                </div>

                                {/* Nb personnes */}
                                <div className="mb-4">
                                    <SectionLabel>Nombre de personnes</SectionLabel>
                                    <div className="flex flex-wrap gap-1.5">
                                        {allPersonnes.map(p => (
                                            <Pill key={p} label={`${p} pers.`}
                                                active={filtrePersonnes.includes(p)}
                                                onClick={() => setFiltrePersonnes(toggle(filtrePersonnes, p))} />
                                        ))}
                                    </div>
                                </div>

                                {/* Durée */}
                                <div className="mb-4">
                                    <SectionLabel>Durée du séjour</SectionLabel>
                                    <div className="flex flex-wrap gap-1.5">
                                        {allDurees.map(d => (
                                            <Pill key={d} label={`${d}n`}
                                                active={filtreDurees.includes(d)}
                                                onClick={() => setFiltreDurees(toggle(filtreDurees, d))} />
                                        ))}
                                    </div>
                                </div>

                                {/* Dates */}
                                <div>
                                    <SectionLabel>Date d'arrivée</SectionLabel>
                                    <div className="max-h-44 overflow-y-auto flex flex-col gap-1 [scrollbar-width:thin]">
                                        {allDates.map(d => {
                                            const label = new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' });
                                            return (
                                                <Pill key={d} label={label}
                                                    active={filtreDates.includes(d)}
                                                    onClick={() => setFiltreDates(toggle(filtreDates, d))} />
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Grille cartes */}
                        <div>
                            {sejoursAffiches.length === 0 ? (
                                <div className="text-center text-neutral-500 pt-16">
                                    <p className="text-4xl mb-3">🔍</p>
                                    <p className="text-sm">Aucun séjour pour cette sélection.</p>
                                    <button onClick={resetFiltres}
                                        className="mt-3 text-indigo-400 hover:text-indigo-300 text-sm bg-none border-none cursor-pointer transition-colors">
                                        Réinitialiser les filtres
                                    </button>
                                </div>
                            ) : (
                                <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                                    {sejoursAffiches.map((sejour) => {
                                        const badgeClass = COMFORT_STYLE[sejour.comfort_level] ?? 'bg-neutral-500 text-white';
                                        const remise = sejour.prix_original
                                            ? Math.round((1 - sejour.prix / sejour.prix_original) * 100)
                                            : null;
                                        return (
                                            <div key={sejour.id}
                                                className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 p-3.5 transition-all duration-150 hover:-translate-y-0.5 hover:border-indigo-500 cursor-default"
                                            >
                                                {/* Type + badge confort */}
                                                <div className="flex justify-between items-center mb-0.5">
                                                    <span className="font-bold text-sm">{sejour.housing_type}</span>
                                                    <span className={`${badgeClass} text-[0.65rem] font-bold px-2 py-0.5 rounded`}>
                                                        {sejour.comfort_level}
                                                    </span>
                                                </div>

                                                {/* Code + capacité */}
                                                <p className="text-neutral-500 text-[0.72rem] mb-2">
                                                    {sejour.housing_code} · {sejour.nb_personnes} pers.
                                                </p>

                                                <hr className="border-sidebar-border/70 dark:border-sidebar-border mb-2" />

                                                {/* Durée + date */}
                                                <div className="flex justify-between text-xs text-neutral-400 mb-2">
                                                    <span>🛏️ {sejour.duree} nuits</span>
                                                    <span>📅 {new Date(sejour.date_arrivee).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                                                </div>

                                                {/* Prix */}
                                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                                    {sejour.prix_original && (
                                                        <span className="text-neutral-500 line-through text-xs">
                                                            {sejour.prix_original} €
                                                        </span>
                                                    )}
                                                    <span className="text-emerald-400 text-xl font-extrabold">
                                                        {sejour.prix} €
                                                    </span>
                                                    {remise && (
                                                        <span className="bg-emerald-400/10 text-emerald-400 text-[0.65rem] font-bold px-1.5 py-0.5 rounded">
                                                            -{remise}%
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

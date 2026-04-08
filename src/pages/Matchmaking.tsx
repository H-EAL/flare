//------------------------------------------------------------------------------
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { SessionInfo } from "@3dverse/livelink";
import { getPlayerName } from "../player";

//------------------------------------------------------------------------------
const SCENE_ID = "21c6e8a4-4f1d-4a99-af65-8c65e776f369";
const TOKEN    = "public_FPAE-TrjLWHUYC6L";
const MAX_PLAYERS = 4;

//------------------------------------------------------------------------------
const TRAITS = [
    { id: "sprinter",  label: "Sprinter",  desc: "Sprint cooldown –50%",    icon: "⚡" },
    { id: "tank",      label: "Tank",      desc: "Flag loss immunity 5s",   icon: "🛡️" },
    { id: "trickster", label: "Trickster", desc: "2 dodge charges",         icon: "🌀" },
    { id: "hunter",    label: "Hunter",    desc: "Sprint speed ×1.8",       icon: "🎯" },
];

//------------------------------------------------------------------------------
type Phase = "browse" | "trait";

//------------------------------------------------------------------------------
function SessionCard({
    session,
    onJoin,
}: {
    session: SessionInfo;
    onJoin: () => void;
}) {
    const count    = session.clients?.length ?? 0;
    const max      = session.max_users ?? MAX_PLAYERS;
    const isFull   = count >= max;

    return (
        <div className="flex items-center gap-4 rounded-lg border border-neutral-800 bg-neutral-900/60 px-5 py-3 hover:border-neutral-600 transition-colors">
            {/* Session ID (shortened) */}
            <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold font-mono truncate">
                    {session.session_id.slice(0, 8).toUpperCase()}
                </p>
                <p className="text-neutral-500 text-[10px] tracking-widest uppercase mt-0.5">
                    {session.country_code ?? "??"}
                </p>
            </div>

            {/* Player count / pips */}
            <div className="flex items-center gap-1.5">
                {Array.from({ length: max }).map((_, i) => (
                    <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-colors
                            ${i < count ? "bg-orange-500" : "bg-neutral-700"}`}
                    />
                ))}
                <span className="text-neutral-500 text-xs ml-1 tabular-nums">
                    {count}/{max}
                </span>
            </div>

            <button
                onClick={onJoin}
                disabled={isFull}
                className={`px-5 py-1.5 rounded text-xs font-black tracking-widest uppercase transition-colors cursor-pointer
                    ${isFull
                        ? "bg-neutral-800 text-neutral-600 cursor-not-allowed"
                        : "bg-orange-500 hover:bg-orange-400 text-black"}`}
            >
                {isFull ? "Full" : "Join"}
            </button>
        </div>
    );
}

//------------------------------------------------------------------------------
export function Matchmaking() {
    const navigate    = useNavigate();
    const playerName  = getPlayerName();

    const [phase, setPhase]                   = useState<Phase>("browse");
    const [sessions, setSessions]             = useState<SessionInfo[]>([]);
    const [loading, setLoading]               = useState(true);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [selectedTrait, setSelectedTrait]   = useState<string | null>(null);

    //--------------------------------------------------------------------------
    const [refreshTick, setRefreshTick] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        async function fetchSessions() {
            try {
                const res = await fetch(
                    `https://api.3dverse.com/app/v1/sessions?filters[scene_id]=${SCENE_ID}`,
                    { headers: { user_token: TOKEN }, signal: controller.signal },
                );
                const data = (await res.json()) as SessionInfo[];
                setSessions(Array.isArray(data) ? data : []);
            } catch (err) {
                if ((err as Error).name !== "AbortError") {
                    setSessions([]);
                }
            } finally {
                setLoading(false);
            }
        }

        fetchSessions();
        const iv = setInterval(fetchSessions, 5000);
        return () => { controller.abort(); clearInterval(iv); };
    }, [refreshTick]);

    //--------------------------------------------------------------------------
    function handleJoin(sessionId: string) {
        setSelectedSessionId(sessionId);
        setPhase("trait");
    }

    function handleCreate() {
        setSelectedSessionId(null);
        setPhase("trait");
    }

    function handleReady() {
        if (!selectedTrait) return;
        const params = new URLSearchParams({ trait: selectedTrait });
        if (selectedSessionId) {
            params.set("sessionId", selectedSessionId);
        } else {
            params.set("create", "true");
        }
        navigate(`/game?${params.toString()}`);
    }

    //--------------------------------------------------------------------------
    // ── BROWSE PHASE ─────────────────────────────────────────────────────────
    if (phase === "browse") {
        return (
            <div className="relative w-full h-full flex flex-col items-center justify-center bg-neutral-950 overflow-hidden">

                {/* Ambient glow */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[500px] h-[500px] rounded-full bg-orange-600/8 blur-[100px]" />
                </div>

                <h2
                    className="text-4xl font-black tracking-widest uppercase text-white mb-1"
                    style={{ fontFamily: "'Bebas Neue', Impact, sans-serif" }}
                >
                    Matchmaking
                </h2>
                <p className="text-neutral-500 text-xs tracking-widest uppercase mb-8">
                    {playerName}
                </p>

                {/* Session list */}
                <div className="w-full max-w-md flex flex-col gap-2 mb-6">
                    {loading ? (
                        <p className="text-neutral-600 text-xs tracking-widest text-center py-8 animate-pulse uppercase">
                            Scanning for sessions...
                        </p>
                    ) : sessions.length === 0 ? (
                        <p className="text-neutral-600 text-xs tracking-widest text-center py-8 uppercase">
                            No sessions found
                        </p>
                    ) : (
                        sessions.map((s) => (
                            <SessionCard
                                key={s.session_id}
                                session={s}
                                onJoin={() => handleJoin(s.session_id)}
                            />
                        ))
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={handleCreate}
                        className="px-10 py-3 bg-orange-500 hover:bg-orange-400 text-black font-black text-sm tracking-widest uppercase rounded transition-colors cursor-pointer"
                    >
                        Create Session
                    </button>
                    <button
                        onClick={() => { setLoading(true); setRefreshTick(t => t + 1); }}
                        className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-black text-sm tracking-widest uppercase rounded transition-colors cursor-pointer"
                    >
                        Refresh
                    </button>
                </div>

                <button
                    onClick={() => navigate("/")}
                    className="absolute bottom-6 text-neutral-600 hover:text-neutral-400 text-xs tracking-widest uppercase transition-colors cursor-pointer"
                >
                    Back
                </button>
            </div>
        );
    }

    //--------------------------------------------------------------------------
    // ── TRAIT PHASE ──────────────────────────────────────────────────────────
    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-neutral-950 overflow-hidden">

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[500px] h-[500px] rounded-full bg-orange-600/8 blur-[100px]" />
            </div>

            <h2
                className="text-4xl font-black tracking-widest uppercase text-white mb-1"
                style={{ fontFamily: "'Bebas Neue', Impact, sans-serif" }}
            >
                {selectedSessionId ? "Joining Session" : "New Session"}
            </h2>
            <p className="text-neutral-500 text-xs tracking-widest uppercase mb-10">
                {selectedSessionId
                    ? selectedSessionId.slice(0, 8).toUpperCase()
                    : "Pick your trait to continue"}
            </p>

            {/* Trait grid */}
            <div className="flex gap-3 mb-8 animate-[slide-up_0.3s_ease_forwards]">
                {TRAITS.map((trait) => (
                    <button
                        key={trait.id}
                        onClick={() => setSelectedTrait(trait.id)}
                        className={`w-36 rounded-lg border p-4 flex flex-col items-center gap-2 transition-all cursor-pointer
                            ${selectedTrait === trait.id
                                ? "border-orange-500 bg-orange-500/10 scale-105"
                                : "border-neutral-700 bg-neutral-900 hover:border-neutral-500"}`}
                    >
                        <span className="text-3xl">{trait.icon}</span>
                        <span className="text-white text-xs font-bold tracking-wide">{trait.label}</span>
                        <span className="text-neutral-500 text-[10px] text-center leading-tight">{trait.desc}</span>
                    </button>
                ))}
            </div>

            <button
                onClick={handleReady}
                disabled={!selectedTrait}
                className={`px-16 py-3 font-black text-sm tracking-widest uppercase rounded transition-all cursor-pointer
                    ${selectedTrait
                        ? "bg-orange-500 hover:bg-orange-400 text-black"
                        : "bg-neutral-800 text-neutral-600 cursor-not-allowed"}`}
            >
                {selectedSessionId ? "Join" : "Create & Enter"}
            </button>

            <button
                onClick={() => setPhase("browse")}
                className="mt-6 text-neutral-600 hover:text-neutral-400 text-xs tracking-widest uppercase transition-colors cursor-pointer"
            >
                Back
            </button>
        </div>
    );
}

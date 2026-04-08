//------------------------------------------------------------------------------
import { useNavigate } from "react-router-dom";
import { getPlayerName } from "../player";

//------------------------------------------------------------------------------
type PlayerResult = {
    name:        string;
    holdTime:    number;
    grabs:       number;
    hitsLanded:  number;
    trait:       string;
    traitIcon:   string;
    color:       string;
    isWinner:    boolean;
};

// Mock results — in production these come from the server via livelink updateEntities
const RESULTS: PlayerResult[] = [
    { name: getPlayerName(), holdTime: 45, grabs: 4, hitsLanded: 3, trait: "Sprinter",  traitIcon: "⚡", color: "text-orange-400",  isWinner: true  },
    { name: "EmberWolf",     holdTime: 31, grabs: 3, hitsLanded: 5, trait: "Tank",       traitIcon: "🛡️", color: "text-sky-400",     isWinner: false },
    { name: "NeonRaven",     holdTime: 22, grabs: 2, hitsLanded: 2, trait: "Trickster",  traitIcon: "🌀", color: "text-violet-400",  isWinner: false },
    { name: "CrimsonLynx",  holdTime: 18, grabs: 5, hitsLanded: 1, trait: "Hunter",     traitIcon: "🎯", color: "text-emerald-400", isWinner: false },
];

const sorted = [...RESULTS].sort((a, b) => b.holdTime - a.holdTime);

//------------------------------------------------------------------------------
export function Results() {
    const navigate = useNavigate();
    const winner   = sorted[0];

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-neutral-950 overflow-hidden">

            {/* Background glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[600px] h-[400px] rounded-full bg-orange-600/10 blur-[120px]" />
            </div>

            {/* Winner announcement */}
            <div className="flex flex-col items-center mb-12 animate-[slide-up_0.4s_ease_forwards]">
                <span className="text-5xl mb-4">🔥</span>
                <p className="text-neutral-500 text-xs tracking-[0.4em] uppercase mb-2">Winner</p>
                <h2 className={`text-6xl font-black tracking-widest uppercase ${winner.color}`}
                    style={{ fontFamily: "'Bebas Neue', Impact, sans-serif" }}>
                    {winner.name}
                </h2>
                <p className="text-neutral-400 text-sm mt-1">
                    {winner.traitIcon} {winner.trait} · {winner.holdTime}s held
                </p>
            </div>

            {/* Leaderboard */}
            <div className="flex flex-col gap-2 w-full max-w-lg mb-10">
                {sorted.map((p, i) => (
                    <div key={p.name}
                         className={`flex items-center gap-4 rounded-lg px-5 py-3 border transition-colors
                             ${p.isWinner
                                 ? "border-orange-500/40 bg-orange-500/5"
                                 : "border-neutral-800 bg-neutral-900/60"}`}>

                        {/* Rank */}
                        <span className="text-neutral-600 font-black text-lg w-5 text-center tabular-nums">
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                        </span>

                        {/* Name */}
                        <div className="flex-1">
                            <p className={`font-bold text-sm tracking-wide ${p.color}`}>{p.name}</p>
                            <p className="text-neutral-600 text-[10px]">{p.traitIcon} {p.trait}</p>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-5 text-center">
                            {[
                                { label: "Hold",   value: `${p.holdTime}s` },
                                { label: "Grabs",  value: p.grabs          },
                                { label: "Hits",   value: p.hitsLanded     },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex flex-col">
                                    <span className="text-white text-sm font-bold tabular-nums">{value}</span>
                                    <span className="text-neutral-600 text-[10px] tracking-widest uppercase">{label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Hold bar */}
                        <div className="w-20">
                            <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${p.isWinner ? "bg-orange-500" : "bg-neutral-600"}`}
                                    style={{ width: `${(p.holdTime / 45) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={() => navigate("/matchmaking")}
                    className="px-10 py-3 bg-orange-500 hover:bg-orange-400 text-black font-black text-sm tracking-widest uppercase rounded transition-colors cursor-pointer">
                    Play Again
                </button>
                <button
                    onClick={() => navigate("/")}
                    className="px-10 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-black text-sm tracking-widest uppercase rounded transition-colors cursor-pointer">
                    Main Menu
                </button>
            </div>
        </div>
    );
}

//------------------------------------------------------------------------------
import { useNavigate } from "react-router-dom";
import { getPlayerName } from "../player";

//------------------------------------------------------------------------------
export function Landing() {
    const navigate   = useNavigate();
    const playerName = getPlayerName();

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-neutral-950">

            {/* Background glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[600px] h-[600px] rounded-full bg-orange-600/10 blur-[120px]" />
            </div>

            {/* Animated ring */}
            <div className="relative flex items-center justify-center mb-10">
                <div className="absolute w-32 h-32 rounded-full border border-orange-500/40"
                     style={{ animation: "pulse-ring 2s ease-out infinite" }} />
                <div className="absolute w-32 h-32 rounded-full border border-orange-500/20"
                     style={{ animation: "pulse-ring 2s ease-out infinite", animationDelay: "0.6s" }} />
                {/* Flame icon */}
                <div className="text-7xl select-none" style={{ animation: "flicker 2s ease-in-out infinite" }}>
                    🔥
                </div>
            </div>

            {/* Title */}
            <h1 className="text-9xl font-black tracking-widest text-white uppercase mb-1"
                style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "0.2em" }}>
                FLARE
            </h1>
            <p className="text-orange-400/80 text-sm tracking-[0.4em] uppercase mb-16">
                Grab it. Hold it. Survive.
            </p>

            {/* Player name */}
            <p className="text-neutral-500 text-xs tracking-widest uppercase mb-8">
                Playing as{" "}
                <span className="text-orange-400 font-semibold">{playerName}</span>
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-3 w-64">
                <button
                    onClick={() => navigate("/matchmaking")}
                    className="w-full py-4 bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-black font-black text-lg tracking-widest uppercase rounded transition-colors cursor-pointer"
                >
                    Find Match
                </button>
                <button
                    disabled
                    className="w-full py-4 bg-neutral-800 text-neutral-500 font-black text-lg tracking-widest uppercase rounded cursor-not-allowed"
                >
                    Private Match
                </button>
            </div>

            {/* Footer */}
            <p className="absolute bottom-6 text-neutral-700 text-xs tracking-widest">
                Powered by 3dverse
            </p>
        </div>
    );
}

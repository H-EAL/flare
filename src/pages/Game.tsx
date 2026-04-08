//------------------------------------------------------------------------------
import { useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLeaveGuard } from "../hooks/useLeaveGuard";

//------------------------------------------------------------------------------
import { type Livelink as LivelinkInstance, type Entity, type Client } from "@3dverse/livelink";
import {
    LivelinkContext,
    ViewportContext,
    Livelink,
    Canvas,
    Viewport,
} from "@3dverse/livelink-react";
import { LoadingOverlay, PerformancePanel } from "@3dverse/livelink-react-ui";

//------------------------------------------------------------------------------
import { getPlayerName } from "../player";

//------------------------------------------------------------------------------
const SCENE_ID                        = "21c6e8a4-4f1d-4a99-af65-8c65e776f369";
const TOKEN                           = "public_FPAE-TrjLWHUYC6L";
const CHARACTER_CONTROLLER_SCENE_UUID = "ae0cb913-d89b-48d0-9d83-757bfc56bab8";

const MATCH_DURATION  = 180;
const WIN_THRESHOLD   = 45;
const MAX_PLAYERS     = 4;
const MIN_PLAYERS     = 2;

//------------------------------------------------------------------------------
const TRAITS: Record<string, { icon: string; label: string; color: string }> = {
    sprinter:  { icon: "⚡", label: "Sprinter",  color: "text-orange-400"  },
    tank:      { icon: "🛡️", label: "Tank",      color: "text-sky-400"     },
    trickster: { icon: "🌀", label: "Trickster", color: "text-violet-400"  },
    hunter:    { icon: "🎯", label: "Hunter",    color: "text-emerald-400" },
};

//------------------------------------------------------------------------------
type Player = {
    name:      string;
    holdTime:  number;
    hasFlag:   boolean;
    trait:     string;
    traitIcon: string;
    color:     string;
};

//------------------------------------------------------------------------------
// ── HUD ──────────────────────────────────────────────────────────────────────
//------------------------------------------------------------------------------
function HUD({ players, timeLeft }: { players: Player[]; timeLeft: number }) {
    const minutes   = Math.floor(timeLeft / 60).toString().padStart(2, "0");
    const seconds   = (timeLeft % 60).toString().padStart(2, "0");
    const flagHolder = players.find((p) => p.hasFlag);

    return (
        <>
            {/* Timer */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none">
                <div className="bg-black/70 backdrop-blur-md rounded-lg px-6 py-2 border border-white/10">
                    <span
                        className="text-white font-black text-3xl tabular-nums tracking-widest"
                        style={{ fontFamily: "'Bebas Neue', Impact, sans-serif" }}
                    >
                        {minutes}:{seconds}
                    </span>
                </div>
            </div>

            {/* Flag holder banner */}
            {flagHolder && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none">
                    <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-4 py-1.5 border border-orange-500/30">
                        <span className="text-base">🔥</span>
                        <span className={`text-xs font-bold tracking-widest ${flagHolder.color}`}>
                            {flagHolder.name}
                        </span>
                        <span className="text-neutral-500 text-xs">holds the flare</span>
                    </div>
                </div>
            )}

            {/* Player scoreboard */}
            <div className="absolute top-6 left-6 flex flex-col gap-2 pointer-events-none">
                {players
                    .slice()
                    .sort((a, b) => b.holdTime - a.holdTime)
                    .map((p, i) => (
                        <div
                            key={p.name}
                            className={`flex items-center gap-3 bg-black/60 backdrop-blur-md rounded-lg px-3 py-2 border transition-colors
                                 ${p.hasFlag ? "border-orange-500/60" : "border-white/5"}`}
                        >
                            <span className="text-neutral-600 text-xs w-3 tabular-nums">{i + 1}</span>
                            <span className="text-sm w-4">{p.hasFlag ? "🔥" : " "}</span>
                            <div className="flex flex-col min-w-24">
                                <span className={`text-xs font-bold tracking-wide ${p.color}`}>{p.name}</span>
                                <span className="text-neutral-600 text-[10px]">
                                    {p.traitIcon} {p.trait}
                                </span>
                            </div>
                            <div className="flex flex-col gap-0.5 w-24">
                                <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000
                                             ${p.hasFlag ? "bg-orange-500" : "bg-neutral-600"}`}
                                        style={{ width: `${(p.holdTime / WIN_THRESHOLD) * 100}%` }}
                                    />
                                </div>
                                <span className="text-[10px] text-neutral-500 tabular-nums text-right">
                                    {p.holdTime.toFixed(0)}s / {WIN_THRESHOLD}s
                                </span>
                            </div>
                        </div>
                    ))}
            </div>

            {/* Performance panel */}
            <div className="absolute bottom-6 right-6 w-40 px-4 py-2 bg-black/70 backdrop-blur-md rounded-lg border border-white/10 pointer-events-none">
                <PerformancePanel />
            </div>

            {/* Controls hint */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-none">
                {[["WASD", "Move"], ["SHIFT", "Sprint"], ["SPACE", "Dodge"]].map(([key, label]) => (
                    <div key={key} className="flex items-center gap-1.5">
                        <kbd className="bg-black/70 border border-white/10 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                            {key}
                        </kbd>
                        <span className="text-neutral-600 text-[10px] tracking-wide">{label}</span>
                    </div>
                ))}
            </div>
        </>
    );
}

//------------------------------------------------------------------------------
// ── PLAYER SPAWNING ──────────────────────────────────────────────────────────
//------------------------------------------------------------------------------
async function spawnPlayer(instance: LivelinkInstance): Promise<Entity | null> {
    const playerSceneEntity = await instance.scene.newEntity({
        name: `Player_${getPlayerName()}`,
        components: {
            local_transform: { position: [0, 0, 0] },
            scene_ref: { value: CHARACTER_CONTROLLER_SCENE_UUID },
        },
        options: { delete_on_client_disconnection: true },
    });

    const children = await playerSceneEntity.getChildren();

    const controllerEntity = children.find((child) => child.script_map !== undefined);
    if (controllerEntity && instance.session.client_id) {
        await controllerEntity.assignClientToScripts({
            client_uuid: instance.session.client_id,
        });
    }

    const cameraEntity = children.find((child) => child.camera !== undefined);
    return cameraEntity ?? null;
}

//------------------------------------------------------------------------------
// ── SIMULATION STARTER ───────────────────────────────────────────────────────
//------------------------------------------------------------------------------
function SimulationStarter() {
    const { instance }                         = useContext(LivelinkContext);
    const { viewport, viewportDomElement }     = useContext(ViewportContext);

    useEffect(() => {
        if (!instance || !viewport || !viewportDomElement) return;
        if (viewportDomElement.requestPointerLock) {
            viewportDomElement.requestPointerLock();
        }
        instance.devices.keyboard.enable();
        instance.devices.gamepads_registry.enable();
        instance.devices.mouse.enableOnViewport({ viewport });
        instance.startSimulation();
    }, [instance, viewport, viewportDomElement]);

    return null;
}

//------------------------------------------------------------------------------
// ── LOBBY OVERLAY ────────────────────────────────────────────────────────────
//------------------------------------------------------------------------------
function Lobby({
    playerTrait,
    onStart,
}: {
    playerTrait: string | null;
    onStart: () => void;
}) {
    const { instance } = useContext(LivelinkContext);
    const [clients, setClients] = useState<Client[]>([]);
    const [ready, setReady]     = useState(false);

    const traitInfo = TRAITS[playerTrait ?? ""] ?? TRAITS["sprinter"];

    // Sync connected clients list
    useEffect(() => {
        if (!instance) return;

        setClients([...instance.session.clients]);

        const handleJoin = () => setClients([...instance.session.clients]);
        const handleLeft = () => setClients([...instance.session.clients]);

        instance.session.addEventListener("on-client-joined", handleJoin);
        instance.session.addEventListener("on-client-left",   handleLeft);

        return () => {
            instance.session.removeEventListener("on-client-joined", handleJoin);
            instance.session.removeEventListener("on-client-left",   handleLeft);
        };
    }, [instance]);

    const canStart = ready && clients.length >= MIN_PLAYERS;

    return (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-neutral-950/95 backdrop-blur-sm">

            {/* Glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[500px] h-[500px] rounded-full bg-orange-600/8 blur-[120px]" />
            </div>

            <h2
                className="text-4xl font-black tracking-widest uppercase text-white mb-1"
                style={{ fontFamily: "'Bebas Neue', Impact, sans-serif" }}
            >
                Lobby
            </h2>
            <p className="text-neutral-500 text-xs tracking-widest uppercase mb-8">
                {clients.length}/{MAX_PLAYERS} · Waiting for players
            </p>

            {/* Connected players */}
            <div className="flex flex-col gap-2 w-80 mb-8">
                {clients.map((client) => {
                    const isMe = client.id === instance?.session.client_id;
                    return (
                        <div
                            key={client.id}
                            className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 transition-colors
                                ${isMe
                                    ? "border-orange-500/40 bg-orange-500/5"
                                    : "border-neutral-800 bg-neutral-900/60"}`}
                        >
                            <span className="text-lg">{isMe ? traitInfo.icon : "👤"}</span>
                            <div className="flex-1">
                                <p className={`text-xs font-bold tracking-wide ${isMe ? traitInfo.color : "text-white"}`}>
                                    {isMe ? getPlayerName() : (client.username || "Anonymous")}
                                </p>
                                {isMe && (
                                    <p className="text-[10px] text-neutral-500">{traitInfo.label}</p>
                                )}
                            </div>
                            {isMe && ready && (
                                <span className="text-orange-500 text-[10px] font-bold tracking-widest uppercase">
                                    Ready
                                </span>
                            )}
                        </div>
                    );
                })}

                {/* Empty slots */}
                {Array.from({ length: Math.max(0, MIN_PLAYERS - clients.length) }).map((_, i) => (
                    <div
                        key={`empty-${i}`}
                        className="flex items-center gap-3 rounded-lg border border-dashed border-neutral-800 px-4 py-2.5"
                    >
                        <span className="text-neutral-700 text-lg">+</span>
                        <p className="text-neutral-700 text-xs tracking-widest">Waiting...</p>
                    </div>
                ))}
            </div>

            {/* Ready / Start buttons */}
            {!ready ? (
                <button
                    onClick={() => setReady(true)}
                    className="px-16 py-3 bg-orange-500 hover:bg-orange-400 text-black font-black text-sm tracking-widest uppercase rounded transition-colors cursor-pointer"
                >
                    Ready
                </button>
            ) : (
                <button
                    onClick={onStart}
                    disabled={!canStart}
                    className={`px-16 py-3 font-black text-sm tracking-widest uppercase rounded transition-all cursor-pointer
                        ${canStart
                            ? "bg-orange-500 hover:bg-orange-400 text-black"
                            : "bg-neutral-800 text-neutral-600 cursor-not-allowed"}`}
                >
                    {canStart ? "Start Game" : `Need ${MIN_PLAYERS - clients.length} more`}
                </button>
            )}
        </div>
    );
}

//------------------------------------------------------------------------------
// ── GAME VIEWPORT ────────────────────────────────────────────────────────────
//------------------------------------------------------------------------------
function GameViewport({
    players,
    timeLeft,
    playerTrait,
    startInLobby,
}: {
    players: Player[];
    timeLeft: number;
    playerTrait: string | null;
    startInLobby: boolean;
}) {
    const { instance }                     = useContext(LivelinkContext);
    const [cameraEntity, setCameraEntity]  = useState<Entity | null>(null);
    const [simReady, setSimReady]          = useState(false);
    const [inLobby, setInLobby]            = useState(startInLobby);

    // Spawn player once, regardless of lobby state
    useEffect(() => {
        if (!instance) return;
        spawnPlayer(instance)
            .then((camera) => {
                setCameraEntity(camera);
                if (!startInLobby) setSimReady(true);
            })
            .catch((err) => console.error("Failed to spawn player:", err));
    }, [instance, startInLobby]);

    function handleStartGame() {
        setInLobby(false);
        setSimReady(true);
    }

    return (
        <Canvas className="h-dvh">
            <Viewport cameraEntity={cameraEntity} className="w-full h-full">
                {inLobby ? (
                    <Lobby playerTrait={playerTrait} onStart={handleStartGame} />
                ) : (
                    <>
                        <HUD players={players} timeLeft={timeLeft} />
                        {simReady && <SimulationStarter />}
                    </>
                )}
            </Viewport>
        </Canvas>
    );
}

//------------------------------------------------------------------------------
// ── GAME ─────────────────────────────────────────────────────────────────────
//------------------------------------------------------------------------------
const INITIAL_PLAYERS = (playerName: string, trait: string | null): Player[] => {
    const t = TRAITS[trait ?? ""] ?? TRAITS["sprinter"];
    return [
        { name: playerName, holdTime: 0, hasFlag: false, trait: t.label, traitIcon: t.icon, color: t.color },
        { name: "EmberWolf",    holdTime: 0, hasFlag: true,  trait: "Tank",      traitIcon: "🛡️", color: "text-sky-400"     },
        { name: "NeonRaven",    holdTime: 0, hasFlag: false, trait: "Trickster", traitIcon: "🌀", color: "text-violet-400"  },
        { name: "CrimsonLynx", holdTime: 0, hasFlag: false, trait: "Hunter",    traitIcon: "🎯", color: "text-emerald-400" },
    ];
};

export function Game() {
    const navigate        = useNavigate();
    const [searchParams]  = useSearchParams();

    const sessionId   = searchParams.get("sessionId");
    const isCreate    = searchParams.get("create") === "true";
    const traitParam  = searchParams.get("trait");

    const playerName  = getPlayerName();
    const [players, setPlayers]   = useState<Player[]>(() => INITIAL_PLAYERS(playerName, traitParam));
    const [timeLeft, setTimeLeft] = useState(MATCH_DURATION);

    useLeaveGuard();

    // Hold time accumulation
    useEffect(() => {
        const iv = setInterval(() => {
            setPlayers((prev) =>
                prev.map((p) => ({
                    ...p,
                    holdTime: p.hasFlag ? Math.min(p.holdTime + 1, WIN_THRESHOLD) : p.holdTime,
                })),
            );
            setTimeLeft((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(iv);
    }, []);

    // Simulated flag transfers
    useEffect(() => {
        const transfers = [4000, 9000, 15000, 22000];
        const timers = transfers.map((delay, i) =>
            setTimeout(() => {
                setPlayers((prev) => {
                    const next = prev.map((p) => ({ ...p, hasFlag: false }));
                    next[i % next.length].hasFlag = true;
                    return next;
                });
            }, delay),
        );
        return () => timers.forEach(clearTimeout);
    }, []);

    // Navigate to results on win or time up
    useEffect(() => {
        const winner = players.find((p) => p.holdTime >= WIN_THRESHOLD);
        if (winner || timeLeft === 0) {
            const t = setTimeout(() => navigate("/results"), 1500);
            return () => clearTimeout(t);
        }
    }, [players, timeLeft, navigate]);

    // Build Livelink props based on URL params
    const livelinkProps = sessionId
        ? { sessionId }
        : { sceneId: SCENE_ID, autoJoinExisting: !isCreate };

    // Show lobby when creating a new session
    const startInLobby = isCreate;

    return (
        <Livelink {...livelinkProps} token={TOKEN} LoadingPanel={LoadingOverlay}>
            <GameViewport
                players={players}
                timeLeft={timeLeft}
                playerTrait={traitParam}
                startInLobby={startInLobby}
            />
        </Livelink>
    );
}

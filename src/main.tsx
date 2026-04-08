import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

import { Landing }     from "./pages/Landing";
import { Matchmaking } from "./pages/Matchmaking";
import { Game }        from "./pages/Game";
import { Results }     from "./pages/Results";

//------------------------------------------------------------------------------
const router = createBrowserRouter([
    { path: "/",            element: <Landing />     },
    { path: "/matchmaking", element: <Matchmaking /> },
    { path: "/game",        element: <Game />        },
    { path: "/results",     element: <Results />     },
    { path: "*",            element: <Landing />     },
]);

//------------------------------------------------------------------------------
createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>
);

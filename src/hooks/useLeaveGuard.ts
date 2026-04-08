//------------------------------------------------------------------------------
import { useEffect, useCallback } from "react";
import { useBeforeUnload, useBlocker } from "react-router-dom";

//------------------------------------------------------------------------------
/**
 * Intercepts:
 * - Browser refresh / tab close / navigation away (beforeunload)
 * - React Router in-app navigation (useBlocker)
 *
 * Shows a confirmation dialog in both cases.
 * Call `confirm()` to manually allow navigation (e.g. from an explicit Leave button).
 */
export function useLeaveGuard(message = "Leaving will disconnect you from the match. Are you sure?") {

    // 1. Browser-level: refresh, close tab, address bar navigation
    useBeforeUnload(
        useCallback((e: BeforeUnloadEvent) => {
            e.preventDefault();
            // Modern browsers ignore the string but require returnValue to be set
            e.returnValue = message;
        }, [message])
    );

    // 2. React Router-level: Link clicks, navigate(), back/forward
    const blocker = useBlocker(({ currentLocation, nextLocation }) =>
        currentLocation.pathname !== nextLocation.pathname
    );

    useEffect(() => {
        if (blocker.state !== "blocked") return;

        const confirmed = window.confirm(message);
        if (confirmed) {
            blocker.proceed();
        } else {
            blocker.reset();
        }
    }, [blocker, message]);
}

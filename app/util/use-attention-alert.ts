import { useEffect } from "react";
import { logger } from "~/util/logger";

/**
 * Use the browser's native Page Visibility API to alert
 * the user that there's new activity on the page and we need
 * their attention, useful after long-running migration steps.
 *
 * While the tab is hidden (Page Visibility API), the document title is
 * prefixed with a marker so the browser tab visually flags an update. The
 * original title is restored as soon as the user focuses the tab or the
 * component unmounts.
 */
export function useAttentionAlert(): void {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const safe = <T>(fn: () => T): T | undefined => {
      try {
        return fn();
      } catch (e) {
        logger.warn("useAttentionAlert: ignoring error", e);
        return undefined;
      }
    };

    const originalTitle = document.title;
    const flaggedTitle = `(!) ${originalTitle}`;

    const applyFlag = () =>
      safe(() => {
        if (document.hidden && document.title !== flaggedTitle) {
          document.title = flaggedTitle;
        }
      });

    const clearFlag = () =>
      safe(() => {
        if (document.title === flaggedTitle) {
          document.title = originalTitle;
        }
      });

    const onVisibilityChange = () => {
      if (document.hidden) {
        applyFlag();
      } else {
        clearFlag();
      }
    };

    // If the tab is already hidden when we mount, flag immediately.
    if (document.hidden) {
      applyFlag();
    }

    const added = safe(() => {
      document.addEventListener("visibilitychange", onVisibilityChange);
      return true;
    });

    return () => {
      if (added) {
        safe(() =>
          document.removeEventListener("visibilitychange", onVisibilityChange)
        );
      }
      clearFlag();
    };
  }, []);
}

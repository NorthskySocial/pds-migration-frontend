import { useEffect } from "react";

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

    const originalTitle = document.title;
    const flaggedTitle = `(!) ${originalTitle}`;

    const applyFlag = () => {
      if (document.hidden && document.title !== flaggedTitle) {
        document.title = flaggedTitle;
      }
    };

    const clearFlag = () => {
      if (document.title === flaggedTitle) {
        document.title = originalTitle;
      }
    };

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

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearFlag();
    };
  }, []);
}

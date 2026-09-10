import { createSession } from "react-router";
import type { SessionData, SessionFlashData } from "~/sessions.server";

export const buildSession = (initial: Partial<SessionData>) =>
  createSession<Partial<SessionData>, SessionFlashData>(initial, "test-session");

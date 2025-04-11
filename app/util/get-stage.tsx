import { redirect, type Session } from "react-router";
import { createDestAccount, loginOrigin, migrate, validate } from "~/actions";
import {
  commitSession,
  type SessionData,
  type SessionFlashData,
} from "~/sessions.server";

/**
 * enum of all migrator stages
 */
export enum STAGES {
  INVITE_CODE,
  BACKUP_NOTICE,
  ORIGIN_PDS_LOGIN,
  CREATE_DEST_ACCOUNT,
  EXPORT_REPO_ORIGIN,
  IMPORT_REPO_DEST,
  EXPORT_BLOBS_ORIGIN,
  IMPORT_BLOBS_DEST,
  MIGRATE_PREFERENCES,
  REQUEST_PLC,
  ACTIVATE_DEST,
  DEACTIVATE_ORIGIN,
  MIGRATE_PLC,
  DONE,
  FAILED,
}

/**
 * Returns true is all arguments are truthy.
 * @param items
 * @returns
 */
const all = (...items: any[]) => items.every((i) => i);

/**
 * Returns the correct stage based on session value availability.
 * @param session
 * @returns STAGES
 */
export function getStage(session: SessionData) {
  if (!session.inviteCode) {
    return STAGES.INVITE_CODE;
  }

  if (!session.hasBackup) {
    return STAGES.BACKUP_NOTICE;
  }

  if (
    !all(
      session.token_origin,
      session.did,
      session.pds_origin,
      session.token_service
    )
  ) {
    return STAGES.ORIGIN_PDS_LOGIN;
  }

  if (!all(session.token_dest, session.handle_dest, session.pds_dest)) {
    return STAGES.CREATE_DEST_ACCOUNT;
  }

  if (!session.migratedRepo) {
    return STAGES.EXPORT_REPO_ORIGIN;
  }

  if (!session.migratedBlobs) {
    return STAGES.EXPORT_BLOBS_ORIGIN;
  }

  if (!session.migratedPrefs) {
    return STAGES.MIGRATE_PREFERENCES;
  }

  if (!session.token_plc) {
    return STAGES.REQUEST_PLC;
  }

  if (!session.originDeactivated) {
    return STAGES.DEACTIVATE_ORIGIN;
  }

  if (!session.destActivated) {
    return STAGES.ACTIVATE_DEST;
  }

  if (!session.migratedPlc) {
    return STAGES.MIGRATE_PLC;
  }

  if (
    all(
      session.migratedPlc,
      session.destActivated,
      session.originDeactivated,
      session.migratedRepo,
      session.migratedPrefs,
      session.migratedBlobs
    )
  ) {
    return STAGES.DONE;
  }

  return STAGES.FAILED;
}

/**
 * Gets the correct screen component based on stage.
 * @param stage
 * @returns Promise<Element>
 */
export function getScreen(stage: STAGES) {
  switch (stage) {
    case STAGES.INVITE_CODE:
      return import("../screens/intro");

    case STAGES.BACKUP_NOTICE:
      return import("../screens/encourage-backup");

    case STAGES.ORIGIN_PDS_LOGIN:
      return import("../screens/origin-login");

    case STAGES.CREATE_DEST_ACCOUNT:
      return import("../screens/new-account");

    case STAGES.EXPORT_REPO_ORIGIN:
    case STAGES.IMPORT_REPO_DEST:
    case STAGES.EXPORT_BLOBS_ORIGIN:
    case STAGES.IMPORT_BLOBS_DEST:
    case STAGES.MIGRATE_PREFERENCES:
      return import("../screens/migration-progress");

    case STAGES.REQUEST_PLC:
    case STAGES.ACTIVATE_DEST:
    case STAGES.DEACTIVATE_ORIGIN:
    case STAGES.MIGRATE_PLC:
      return import("../screens/validate-plc-token");

    case STAGES.DONE:
      return import("../screens/done-migration");

    case STAGES.FAILED:
      return import("../screens/failed-migration");

    default:
      return Promise.resolve({ default: () => <div>loading...</div> });
  }
}

/**
 * Takes the form data, runs any side-effect actions,
 * sets new session data, return redirect.
 * @param session
 * @param data
 * @returns
 */
export const processState = async (
  session: Session<SessionData, SessionFlashData>,
  data: FormData
) => {
  const state = {
    handle_origin: session.get("handle_origin"),
    handle_dest: session.get("handle_dest"),
    pds_dest: session.get("pds_dest"),
    pds_origin: session.get("pds_origin"),
    token_origin: session.get("token_origin"),
    token_dest: session.get("token_dest"),
    token_plc: session.get("token_plc"),
    token_service: session.get("token_service"),
    plc_hostname: session.get("plc_hostname"),
    did: session.get("did"),
    inviteCode: session.get("inviteCode"),
    email: session.get("email"),

    // state flags
    hasBackup: session.get("hasBackup") ?? false,
    migratedRepo: session.get("migratedRepo") ?? false,
    migratedBlobs: session.get("migratedBlobs") ?? false,
    migratedPrefs: session.get("migratedPrefs") ?? false,
    originDeactivated: session.get("originDeactivated") ?? false,
    destActivated: session.get("destActivated") ?? false,
    migratedPlc: session.get("migratedPlc") ?? false,
  };

  const stage = getStage(state);

  switch (stage) {
    case STAGES.INVITE_CODE: {
      state.inviteCode = data.get("invite-code") as string;
      session.set("inviteCode", state.inviteCode);
      break;
    }

    case STAGES.ORIGIN_PDS_LOGIN: {
      const {
        pds_origin,
        email,
        token_origin,
        token_service,
        handle_origin,
        did,
      } = await loginOrigin(state);
      session.set("pds_origin", pds_origin);
      session.set("email", email);
      session.set("token_origin", token_origin);
      session.set("token_service", token_service);
      session.set("handle_origin", handle_origin);
      session.set("did", did);
      break;
    }

    case STAGES.CREATE_DEST_ACCOUNT: {
      const res = await createDestAccount(state);
      break;
    }

    case STAGES.EXPORT_REPO_ORIGIN:
    case STAGES.IMPORT_REPO_DEST:
    case STAGES.EXPORT_BLOBS_ORIGIN:
    case STAGES.IMPORT_BLOBS_DEST:
    case STAGES.MIGRATE_PREFERENCES:
    case STAGES.REQUEST_PLC: {
      const res = await migrate(stage, state);
      break;
    }

    case STAGES.ACTIVATE_DEST:
    case STAGES.DEACTIVATE_ORIGIN:
    case STAGES.MIGRATE_PLC: {
      const res = await validate(stage, state);
      break;
    }
  }

  return redirect(
    stage === STAGES.DONE
      ? "/success"
      : stage === STAGES.FAILED
      ? "/failed"
      : "/",
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    }
  );
};

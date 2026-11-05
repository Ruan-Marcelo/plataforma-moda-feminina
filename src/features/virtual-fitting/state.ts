import type { FittingErrorCode, FittingResult, FittingSelection } from "./contracts";

export type FittingStatus = "idle" | "uploading" | "processing" | "completed" | "failed" | "cancelled";
export type FittingStep = "intro" | "selection" | "photo" | "consent" | "result";
export type FittingState = {
  status: FittingStatus;
  step: FittingStep;
  selection: FittingSelection | null;
  photo: File | null;
  consent: boolean;
  checkingPhoto: boolean;
  progress: number | null;
  result: FittingResult | null;
  error: FittingErrorCode | null;
};

export function initialFittingState(selection: FittingSelection | null): FittingState {
  return { status: "idle", step: "intro", selection, photo: null, consent: false, checkingPhoto: false, progress: null, result: null, error: null };
}

export function fittingIsBusy(status: FittingStatus) { return status === "uploading" || status === "processing"; }

export type FittingAction =
  | { type: "start" }
  | { type: "select"; selection: FittingSelection | null }
  | { type: "confirm_selection" }
  | { type: "edit_selection" }
  | { type: "check_photo" }
  | { type: "photo_ready"; photo: File }
  | { type: "invalid_photo" }
  | { type: "confirm_photo" }
  | { type: "edit_photo" }
  | { type: "consent"; accepted: boolean }
  | { type: "submit" }
  | { type: "progress"; progress: number | null }
  | { type: "uploaded" }
  | { type: "complete"; result: FittingResult }
  | { type: "fail"; error: FittingErrorCode }
  | { type: "cancel" }
  | { type: "restart" }
  | { type: "another_piece" };

export function fittingReducer(state: FittingState, action: FittingAction): FittingState {
  const busy = fittingIsBusy(state.status);
  switch (action.type) {
    case "start": return { ...state, step: "selection" };
    case "select": return busy ? state : { ...initialFittingState(action.selection), step: "selection" };
    case "confirm_selection": return !busy && state.selection ? { ...state, step: "photo" } : state;
    case "edit_selection": return busy ? state : { ...initialFittingState(state.selection), step: "selection" };
    case "check_photo": return busy || !state.selection ? state : { ...state, status: "idle", step: "photo", checkingPhoto: true, photo: null, consent: false, result: null, error: null };
    case "photo_ready": return busy || !state.checkingPhoto ? state : { ...state, status: "idle", photo: action.photo, checkingPhoto: false, error: null };
    case "invalid_photo": return busy ? state : { ...state, status: "failed", step: "photo", photo: null, consent: false, checkingPhoto: false, result: null, error: "invalid_image" };
    case "confirm_photo": return !busy && state.photo && !state.checkingPhoto ? { ...state, step: "consent" } : state;
    case "edit_photo": return busy ? state : { ...state, status: "idle", step: "photo", consent: false, result: null, error: null };
    case "consent": return busy || state.step !== "consent" ? state : { ...state, consent: action.accepted };
    case "submit": return busy || state.step !== "consent" || !state.photo || !state.selection || !state.consent || state.checkingPhoto ? state : { ...state, status: "uploading", progress: null, result: null, error: null };
    case "progress": return state.status !== "uploading" ? state : { ...state, progress: action.progress !== null && Number.isFinite(action.progress) ? Math.min(100, Math.max(0, action.progress)) : null };
    case "uploaded": return state.status === "uploading" ? { ...state, status: "processing", progress: 100 } : state;
    case "complete": return busy ? { ...state, status: "completed", step: "result", result: action.result, error: null } : state;
    case "fail": return busy ? { ...state, status: "failed", error: action.error, result: null } : state;
    case "cancel": return { ...initialFittingState(state.selection), status: "cancelled", step: "photo" };
    case "restart": return busy ? state : { ...initialFittingState(state.selection), step: state.selection ? "photo" : "selection" };
    case "another_piece": return busy ? state : { ...initialFittingState(null), step: "selection" };
  }
}

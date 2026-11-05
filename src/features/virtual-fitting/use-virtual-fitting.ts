"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { sendFittingRequest, FittingRequestError } from "./client";
import { fittingReducer, initialFittingState, fittingIsBusy } from "./state";
import { validateVirtualTryOnImage } from "./validation";
import type { FittingSelection } from "./contracts";

export function useVirtualFitting(initialSelection: FittingSelection | null) {
  const [state, dispatch] = useReducer(fittingReducer, initialSelection, initialFittingState);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const activeRequest = useRef<AbortController | null>(null);
  const photoValidation = useRef(0);
  const busy = fittingIsBusy(state.status);

  useEffect(() => {
    if (!state.photo) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(state.photo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [state.photo]);

  useEffect(() => () => { activeRequest.current?.abort(); photoValidation.current += 1; }, []);

  async function selectPhoto(photo: File | undefined) {
    if (!photo || activeRequest.current) return;
    const version = ++photoValidation.current;
    dispatch({ type: "check_photo" });
    try {
      await validateVirtualTryOnImage(photo);
      if (version === photoValidation.current) dispatch({ type: "photo_ready", photo });
    } catch {
      if (version === photoValidation.current) dispatch({ type: "invalid_photo" });
    }
  }

  function cancel() {
    photoValidation.current += 1;
    const request = activeRequest.current;
    activeRequest.current = null;
    request?.abort();
    dispatch({ type: "cancel" });
  }

  async function submit(allowed: boolean) {
    if (!allowed || activeRequest.current || busy || !state.selection || !state.photo || !state.consent || state.checkingPhoto || state.step !== "consent") return;
    const controller = new AbortController();
    activeRequest.current = controller;
    dispatch({ type: "submit" });
    try {
      const result = await sendFittingRequest({
        selection: state.selection, photo: state.photo, consent: state.consent, signal: controller.signal,
        onProgress: progress => { if (activeRequest.current === controller) dispatch({ type: "progress", progress }); },
        onUploaded: () => { if (activeRequest.current === controller) dispatch({ type: "uploaded" }); },
      });
      if (activeRequest.current === controller && !controller.signal.aborted) dispatch({ type: "complete", result });
    } catch (error) {
      if (activeRequest.current !== controller || controller.signal.aborted) return;
      dispatch({ type: "fail", error: error instanceof FittingRequestError ? error.code : "network" });
    } finally {
      if (activeRequest.current === controller) activeRequest.current = null;
    }
  }

  return { state, dispatch, busy, previewUrl: state.photo ? previewUrl : null, selectPhoto, submit, cancel };
}

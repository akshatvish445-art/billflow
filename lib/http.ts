import { NextResponse } from "next/server";

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function unauthorized() {
  return errorResponse("Unauthorized", 401);
}

export function notFoundResponse(resource = "Resource") {
  return errorResponse(`${resource} not found.`, 404);
}

export function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

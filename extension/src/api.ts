export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000/roast";

export const SHARED_SECRET = import.meta.env.VITE_SHARED_SECRET ?? "";

if (!SHARED_SECRET) {
  console.warn(
    "VITE_SHARED_SECRET is not set — the backend will reject roast requests."
  );
}

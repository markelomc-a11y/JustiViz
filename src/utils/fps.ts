export function calculateFps(frameCount: number, elapsedMs: number): number {
  if (frameCount <= 0 || elapsedMs <= 0) return 0;
  return (frameCount * 1000) / elapsedMs;
}

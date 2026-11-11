/** Annual bar widths share a linear count scale within each chart. */
export function permitBarWidth(count: number, maximumCount: number, availableWidth: number): number {
  if (count <= 0 || maximumCount <= 0 || availableWidth <= 0) return 0;
  return availableWidth * Math.min(count / maximumCount, 1);
}
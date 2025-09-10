/**
 * Reorders items within the same list.
 * @template T
 * @param {T[]} list The array of items to reorder.
 * @param {number} startIndex The starting index of the item.
 * @param {number} endIndex The destination index of the item.
 * @returns {T[]} A new array with the item reordered.
 */
export const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

/**
 * Moves an item from one list to another.
 * @template T
 * @param {T[]} source The source list.
 * @param {T[]} destination The destination list.
 * @param {number} sourceIndex The index of the item in the source list.
 * @param {number} destinationIndex The index of the item in the destination list.
 * @returns {{ source: T[], destination: T[] }} An object containing the new source and destination lists.
 */
export const move = (source, destination, sourceIndex, destinationIndex) => {
  const sourceClone = Array.from(source);
  const destClone = Array.from(destination);
  const [removed] = sourceClone.splice(sourceIndex, 1);

  destClone.splice(destinationIndex, 0, removed);

  return {
    source: sourceClone,
    destination: destClone,
  };
};

/**
 * Snaps a coordinate to the nearest grid point.
 * @param {number} value The coordinate value (e.g., x or y).
 * @param {number} [grid=8] The size of the grid to snap to.
 * @returns {number} The snapped coordinate value.
 */
export const snap = (value, grid = 8) => {
  return Math.round(value / grid) * grid;
};
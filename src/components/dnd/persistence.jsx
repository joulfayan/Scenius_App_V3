import { debounce } from 'lodash';
import { announce } from './a11y';

/**
 * A debounced save function for optimistic UI updates.
 * In a real Firebase app, this would interact with Firestore.
 * Here, we simulate it with the Base44 Entity SDK.
 * 
 * @param {object} params
 * @param {any} params.Entity - The Base44 Entity class (e.g., Shot, StoryboardFrame).
 * @param {string} params.docId - The ID of the document/entity to update.
 * @param {object} params.payload - The data to update.
 * @param {function} params.onSuccess - Callback on successful save.
 * @param {function} params.onFailure - Callback on failed save, receives the error.
 */
const _save = async ({ Entity, docId, payload, onSuccess, onFailure }) => {
  try {
    if (!Entity || !docId) {
        throw new Error("Entity and docId are required for saving.");
    }
    await Entity.update(docId, payload);
    if (onSuccess) onSuccess();
  } catch (error) {
    console.error('DnD Persistence Error:', error);
    announce(`Action failed. Could not save changes. ${error.message}`);
    if (onFailure) onFailure(error);
  }
};

export const save = debounce(_save, 2000); // 2-second debounce
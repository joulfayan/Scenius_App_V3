import React from 'react';

/**
 * A visually hidden component that provides screen reader announcements.
 * It should be rendered once in the application, ideally within the DnDProvider.
 */
export const A11yAnnouncer = () => (
  <div
    id="dnd-live-region"
    aria-live="assertive"
    aria-atomic="true"
    style={{
      position: 'absolute',
      width: '1px',
      height: '1px',
      margin: '-1px',
      padding: '0',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: '0',
    }}
  />
);

let lastMessage = '';
let messageTimeout = null;

/**
 * Announces a message to screen readers via the live region.
 * @param {string} message The message to announce.
 */
export const announce = (message) => {
  // Prevent the same message from being announced repeatedly in quick succession
  if (message === lastMessage) {
    return;
  }
  lastMessage = message;

  const liveRegion = document.getElementById('dnd-live-region');
  if (liveRegion) {
    liveRegion.textContent = message;
  }

  // Clear the message after a delay to allow for re-announcement of the same message later
  if (messageTimeout) {
    clearTimeout(messageTimeout);
  }
  messageTimeout = setTimeout(() => {
    lastMessage = '';
  }, 500);
};
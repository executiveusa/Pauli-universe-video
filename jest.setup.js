require('@testing-library/jest-dom');
const { randomUUID } = require('crypto');

Object.defineProperty(global, 'fetch', {
  value: async () => ({
    ok: true,
    json: async () => ({}),
  }),
  writable: true,
});

Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID,
  },
  writable: true,
});

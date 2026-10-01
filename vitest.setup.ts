import '@testing-library/jest-dom/vitest';

// Este setup roda para TODOS os testes, e os de `api/` rodam em ambiente
// node (`// @vitest-environment node`), onde `window` não existe. Sem a
// guarda, eles quebram antes de começar com "window is not defined".
if (typeof window !== 'undefined') {
  // jsdom não implementa scroll; sem isto os componentes que rolam a tela
  // derrubam o teste.
  Object.defineProperty(window, 'scrollTo', { value: () => {}, writable: true });
  Element.prototype.scrollIntoView = () => {};

  // jsdom + Node 26 pode não expor localStorage (global ou window). Polyfill
  // mínimo baseado em Map; no-op quando o navegador/jsdom já fornece.
  if (typeof globalThis.localStorage === 'undefined') {
    const store = new Map<string, string>();
    const polyfill: Storage = {
      get length() { return store.size; },
      clear: () => store.clear(),
      getItem: (key) => store.get(String(key)) ?? null,
      key: (index) => [...store.keys()][index] ?? null,
      removeItem: (key) => void store.delete(String(key)),
      setItem: (key, value) => void store.set(String(key), String(value)),
    };
    Object.defineProperty(globalThis, 'localStorage', { value: polyfill, writable: true, configurable: true });
    Object.defineProperty(window, 'localStorage', { value: polyfill, writable: true, configurable: true });
  }
}

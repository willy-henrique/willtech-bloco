import '@testing-library/jest-dom/vitest';

// Este setup roda para TODOS os testes, e os de `api/` rodam em ambiente
// node (`// @vitest-environment node`), onde `window` não existe. Sem a
// guarda, eles quebram antes de começar com "window is not defined".
if (typeof window !== 'undefined') {
  // jsdom não implementa scroll; sem isto os componentes que rolam a tela
  // derrubam o teste.
  Object.defineProperty(window, 'scrollTo', { value: () => {}, writable: true });
  Element.prototype.scrollIntoView = () => {};
}

import "@testing-library/jest-dom/vitest";

if (typeof globalThis.IntersectionObserver === "undefined") {
  class IntersectionObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
    root = null;
    rootMargin = "";
    thresholds = [];
  }
  globalThis.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;
}

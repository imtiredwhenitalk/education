declare module "react" {
  export type Dispatch<A> = (value: A | ((prev: A) => A)) => void;
  export function useState<S>(initialState: S | (() => S)): [S, Dispatch<S>];
  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: unknown[]): T;
  const React: {
    StrictMode: any;
  };
  export default React;
}

declare module "react-dom/client" {
  export function createRoot(container: Element | DocumentFragment): {
    render(children: any): void;
  };
}

declare module "react/jsx-runtime";

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

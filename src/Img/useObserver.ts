import { useState, useRef, useEffect } from 'react';

// FIXME: Use README URL
export const observerErr =
  "💡react-cool-img: this browser doesn't support IntersectionObserver, please install polyfill to enable lazy loading. intersection-observer: https://www.npmjs.com/package/intersection-observer";
export const thresholdErr =
  '💡react-cool-img: the threshold of observerConfig must be a number. Use 0 as fallback.';

export interface Config {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number;
  debounce?: number;
}
export type Return = [
  (node?: Element | null) => void,
  boolean,
  (val: boolean) => void
];

export default (
  lazy: boolean,
  { root = null, rootMargin = '50px', threshold = 0.01, debounce = 300 }: Config
): Return => {
  if (!lazy || !window.IntersectionObserver) {
    if (!window.IntersectionObserver) console.error(observerErr);

    const setState = (): void => {};
    return [setState, true, setState];
  }

  const [startLoad, setStartLoad] = useState(false);
  const [node, setNode] = useState(null);
  const observerRef = useRef(null);
  const timeoutRef = useRef(null);
  let numThreshold = threshold;

  if (typeof threshold !== 'number') {
    console.error(thresholdErr);
    numThreshold = 0;
  }

  const resetTimeout = (): void => {
    if (!timeoutRef.current) return;

    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  };

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !startLoad) {
          timeoutRef.current = setTimeout(() => {
            setStartLoad(true);
          }, debounce);
        } else {
          resetTimeout();
        }
      },
      { root, rootMargin, threshold: numThreshold }
    );

    const { current: observer } = observerRef;

    if (node) observer.observe(node);

    return (): void => {
      observer.disconnect();
      resetTimeout();
    };
  }, [node, startLoad, root, rootMargin, numThreshold, debounce]);

  // setStartLoad is used for testing
  return [setNode, startLoad, setStartLoad];
};

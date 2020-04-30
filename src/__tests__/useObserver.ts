import { renderHook, act } from '@testing-library/react-hooks';

import useObserver, {
  observerErr,
  thresholdErr,
  Options,
  Return as Current,
} from '../useObserver';

interface Args extends Options {
  debounce?: number;
}
type Return = { current: Current };

const renderHelper = ({
  root = null,
  rootMargin = '50px',
  threshold = 0.01,
  debounce = 300,
}: Args = {}): Return =>
  renderHook(() => useObserver(debounce, { root, rootMargin, threshold }))
    .result;

describe('useObserver › errors', () => {
  global.console.error = jest.fn();
  const mockIntersectionObserver = jest.fn((_, { threshold }) => ({
    threshold,
    disconnect: (): void => null,
  }));

  it('should handle IntersectionObserver error correctly', () => {
    renderHelper();

    expect(console.error).toHaveBeenCalledWith(observerErr);

    // @ts-ignore
    global.IntersectionObserver = mockIntersectionObserver;
    renderHelper();

    expect(console.error).toHaveBeenCalledWith(observerErr);
  });

  it('should handle threshold error correctly', () => {
    // @ts-ignore
    global.IntersectionObserver = mockIntersectionObserver;
    // @ts-ignore
    global.IntersectionObserverEntry = jest.fn();
    // @ts-ignore
    global.IntersectionObserverEntry.prototype.isIntersecting = false;
    // @ts-ignore
    renderHelper({ threshold: [0.5, 1] });

    expect(console.error).toHaveBeenCalledWith(thresholdErr);
    // @ts-ignore
    expect(IntersectionObserver.mock.results[0].value.threshold).toBe(0);
  });
});

describe('useObserver', () => {
  jest.useFakeTimers();

  const img = document.createElement('img');
  const disconnect = jest.fn();

  let callback: Function;
  const setIsIntersecting = (isIntersecting: boolean): void => {
    callback([{ isIntersecting }]);
  };

  beforeAll(() => {
    // @ts-ignore
    global.IntersectionObserver = jest.fn(
      (cb, { root, rootMargin, threshold }) => ({
        root,
        rootMargin,
        threshold,
        observe: (): void => {
          callback = cb;
        },
        disconnect,
      })
    );
  });

  it('should set intersection observer options correctly', () => {
    renderHelper();

    // @ts-ignore
    let mkObserver = IntersectionObserver.mock.results[0].value;

    expect(mkObserver.root).toBeNull();
    expect(mkObserver.rootMargin).toBe('50px');
    expect(mkObserver.threshold).toBe(0.01);

    const options = { root: document.body, rootMargin: '100px', threshold: 1 };

    renderHelper(options);

    // @ts-ignore
    mkObserver = IntersectionObserver.mock.results[1].value;

    expect(mkObserver.root).toBe(options.root);
    expect(mkObserver.rootMargin).toBe(options.rootMargin);
    expect(mkObserver.threshold).toBe(options.threshold);
  });

  it('should be out-view state', () => {
    const result = renderHelper();
    let [setRef, startLoad] = result.current;

    act(() => {
      setRef(img);
    });

    setIsIntersecting(false);

    jest.runAllTimers();

    [setRef, startLoad] = result.current;

    // setTimeout of intersection-observer didn't be called
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(startLoad).toBeFalsy();
  });

  it('should be out-view state due to debounce', () => {
    const debounce = 300;
    const result = renderHelper({ debounce });
    let [setRef, startLoad] = result.current;

    act(() => {
      setRef(img);
    });

    setIsIntersecting(true);

    jest.advanceTimersByTime(100);

    [setRef, startLoad] = result.current;

    expect(setTimeout).toHaveBeenCalledTimes(3);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), debounce);
    expect(startLoad).toBeFalsy();

    setIsIntersecting(false);

    expect(clearTimeout).toHaveBeenCalled();
  });

  it('should be in-view state without debounce', () => {
    const debounce = 0;
    const result = renderHelper({ debounce });
    let [setRef, startLoad, setStartLoad] = result.current;

    act(() => {
      setRef(img);
    });

    setIsIntersecting(true);

    act(() => {
      jest.advanceTimersByTime(debounce);
      setStartLoad(true);
    });

    [setRef, startLoad, setStartLoad] = result.current;

    expect(setTimeout).toHaveBeenCalledTimes(7);
    expect(startLoad).toBeTruthy();
  });

  it('should be in-view state with debounce', () => {
    const result = renderHelper();
    let [setRef, startLoad, setStartLoad] = result.current;

    act(() => {
      setRef(img);
    });

    setIsIntersecting(true);

    act(() => {
      // Default settings
      jest.advanceTimersByTime(300);
      setStartLoad(true);
    });

    [setRef, startLoad, setStartLoad] = result.current;

    expect(setTimeout).toHaveBeenCalledTimes(10);
    expect(startLoad).toBeTruthy();
  });

  it('should stop observe when un-mount', () => {
    renderHelper();

    expect(disconnect).toHaveBeenCalled();
  });
});

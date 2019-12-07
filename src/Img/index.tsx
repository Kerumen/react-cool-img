/* eslint-disable jsx-a11y/alt-text, react-hooks/exhaustive-deps */

import React, {
  DetailedHTMLProps,
  ImgHTMLAttributes,
  SyntheticEvent,
  SFC,
  useRef,
  useState,
  useEffect,
  memo
} from 'react';

import useObserver, { Config } from './useObserver';
import Imager, { Retry } from './Imager';

interface Props
  extends DetailedHTMLProps<
    ImgHTMLAttributes<HTMLImageElement>,
    HTMLImageElement
  > {
  className?: string;
  placeholder?: string;
  src: string;
  error?: string;
  crossOrigin?: '' | 'anonymous' | 'use-credentials';
  decode?: boolean;
  lazy?: boolean;
  debounce?: number;
  observerConfig?: Config;
  retry?: Retry;
  srcSet?: string;
  sizes?: string;
  onError?: (event?: SyntheticEvent | Event) => void;
  onLoad?: (event?: SyntheticEvent | Event) => void;
}

const Img: SFC<Props> = ({
  className,
  placeholder,
  src,
  error,
  crossOrigin,
  decode,
  lazy,
  debounce,
  observerConfig,
  retry,
  srcSet,
  sizes,
  onError,
  onLoad,
  ...rest
}: Props) => {
  const { current: imager } = useRef(new Imager());
  const [setRef, startLoad] = useObserver(lazy, debounce, observerConfig);
  const [source, setSource] = useState(
    placeholder ||
      'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='
  );
  const isSrc = source === src;
  const filename = src ? src.replace(/^.*[\\/]/, '') : '';

  const handleError = (event: SyntheticEvent | Event): void => {
    if (error) {
      setSource(error);
    } else if (placeholder) {
      setSource(placeholder);
    }

    onError(event);
  };

  const handleLoad = (event: SyntheticEvent | Event): void => {
    setSource(src);
    onLoad(event);
  };

  useEffect(() => {
    if (startLoad)
      imager.load(src, crossOrigin, decode, retry, handleError, handleLoad);

    return (): void => {
      imager.unload();
    };
  }, [startLoad, src, crossOrigin, decode, retry]);

  return (
    <>
      <img
        className={`${className} no-js-${filename}`}
        src={source}
        crossOrigin={isSrc ? crossOrigin : null}
        srcSet={isSrc ? srcSet : null}
        sizes={isSrc ? sizes : null}
        ref={setRef}
        {...rest}
      />
      {/* For SEO and JavaScript unavailable */}
      <noscript>
        <style>{`.no-js-${filename} { display: none !important; }`}</style>
        <img
          className={className}
          src={src}
          crossOrigin={crossOrigin}
          srcSet={srcSet}
          sizes={sizes}
          {...rest}
        />
      </noscript>
    </>
  );
};

Img.defaultProps = {
  className: '',
  placeholder: null,
  error: null,
  crossOrigin: null,
  decode: true,
  lazy: true,
  debounce: 300,
  observerConfig: {},
  retry: {},
  srcSet: null,
  sizes: null,
  onError: /* istanbul ignore next */ (): void => null,
  onLoad: /* istanbul ignore next */ (): void => null
};

export default memo(Img);

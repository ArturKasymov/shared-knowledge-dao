import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  height: 100%;
  width: 100%;

  transition: all 500ms ease;

  &.hide {
    opacity: 0;
    max-height: 0;
  }

  &.show {
    opacity: 1;
    flex-grow: 1;
    max-height: 100%;
  }
`;

interface SmoothOptionalProps {
  show: boolean;
  children: React.ReactNode;
}

const SmoothOptional = ({ show, children }: SmoothOptionalProps) => {
  const [render, setRender] = useState(show);
  const [hide, setHide] = useState(!show);

  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutId.current) clearTimeout(timeoutId.current);

    if (show) {
      setRender(true);
      setHide(true);
      timeoutId.current = setTimeout(() => setHide(false), 10);
    } else {
      setHide(true);
      timeoutId.current = setTimeout(() => setRender(false), 500);
    }
  }, [show]);

  if (!render) return null;

  return <Wrapper className={hide ? 'hide' : 'show'}>{children}</Wrapper>;
};

export default SmoothOptional;

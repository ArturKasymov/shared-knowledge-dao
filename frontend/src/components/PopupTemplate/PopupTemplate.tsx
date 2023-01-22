import React, { useRef } from 'react';
import styled from 'styled-components';

import { useOutsideClickCallback } from 'utils/useOutsideClickCallback';

const Wrapper = styled.div`
  width: 100%;
  height: 100vh;
  top: 0;
  left: 0;
  position: fixed;
  color: ${({ theme }) => theme.colors.white};
  background-color: ${({ theme }) => theme.colors.backgroundDimmed};
  z-index: 3000;

  display: flex;
  justify-content: center;
  align-items: center;

  .popup-container {
    background-color: ${({ theme }) => theme.colors.background};
    min-width: 400px;
    max-width: 1200px;
    max-height: 400px;
    box-shadow: ${({ theme }) => theme.colors.nightShadow};
  }

  .popup-bottom {
    height: 25px;
    padding: 20px;
    gap: 16px;
    background-color: ${({ theme }) => theme.colors.night[300]};
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  width: max-content;

  > *:not(:last-child) {
    display: block;
    margin-right: 12px;
  }

  button {
    height: 36px;
    width: max-content;
  }
`;

interface PopupTemplateProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  leftBottom?: React.ReactNode;
  buttons: React.ReactNode;
  onPopupClose: () => void;
}

const PopupTemplate = ({
  children,
  header,
  leftBottom,
  buttons,
  onPopupClose,
}: PopupTemplateProps): JSX.Element => {
  const wrapperRef = useRef(null);
  useOutsideClickCallback(wrapperRef, onPopupClose);

  return (
    <Wrapper id="popup-bg" role="presentation">
      <div className="popup-container" role="presentation" ref={wrapperRef}>
        {children}
        <div className="popup-bottom">
          {leftBottom}
          <ButtonsContainer>{buttons}</ButtonsContainer>
        </div>
      </div>
    </Wrapper>
  );
};

export default PopupTemplate;

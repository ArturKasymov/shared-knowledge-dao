import React, { useRef, useState } from 'react';
import styled from 'styled-components';

import { useOutsideClickCallback } from 'utils/useOutsideClickCallback';
import { DatabaseItem } from 'utils/getDatabaseItem';

const Wrapper = styled.div`
  width: 100vw;
  height: 100vh;
  position: fixed;
  color: ${({ theme }) => theme.colors.white};
  background-color: ${({ theme }) => theme.colors.backgroundDimmed};
  z-index: 3000;

  display: flex;
  justify-content: center;
  align-items: center;

  .database-item-details {
    background-color: ${({ theme }) => theme.colors.background};
    min-width: 400px;
    max-width: 1200px;
    max-height: 400px;
    overflow-wrap: break-word;
    box-shadow: ${({ theme }) => theme.colors.nightShadow};

    textarea {
      width: 100%;
      height: 150px;
      align-self: center;
      box-sizing: border-box;
      border: transparent;
      font-weight: 500;
      font-size: 16px;
      padding: 12px 20px;
      resize: none;

      &:disabled {
        background-color: ${({ theme }) => theme.colors.background};
        color: white;
      }
    }
  }

  .database-item-bottom {
    height: 25px;
    padding: 20px;
    background-color: ${({ theme }) => theme.colors.night[300]};
    display: flex;
    align-items: center;
    justify-content: space-between;

    p {
      height: 100%;
      font-weight: 600;
    }
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
    color: ${({ theme }) => theme.colors.primaryDarker};
    background: ${({ theme }) => theme.colors.button.secondary};
    border-radius: 18px;
    justify-content: center;
    align-items: center;
    padding: 8.5px 16px;
    gap: 8px;
    justify-self: end;
    position: relative;
    transition: background-color 0.4s ease, opacity 0.4s ease;
    will-change: background-color, opacity;
    justify-self: center;

    &:hover {
      background: ${({ theme }) => theme.colors.button.secondaryHover};
    }
  }

  button.cancel {
    background: ${({ theme }) => theme.colors.button.cancel};
  }
`;

interface DatabaseItemDetailsPopupProps {
  item: DatabaseItem;
  onPopupClose: () => void;
  onItemPropose: (id: number, text: string) => void;
}

const DatabaseItemDetailsPopup = ({
  item,
  onPopupClose,
  onItemPropose,
}: DatabaseItemDetailsPopupProps): JSX.Element => {
  const wrapperRef = useRef(null);
  useOutsideClickCallback(wrapperRef, onPopupClose);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const [isBeingModified, setIsBeingModified] = useState(false);

  const handleCancel = () => {
    setIsBeingModified(false);
    if (textAreaRef.current) {
      textAreaRef.current.value = item.text;
    }
  };

  const handlePropose = () => {
    setIsBeingModified(false);
    if (textAreaRef.current) {
      onItemPropose(item.id, textAreaRef.current.value);
    }
  };

  const handleModify = () => {
    setIsBeingModified(true);
  };

  // TODO: maybe disable propose button when wallet not connected?
  return (
    <Wrapper id="database-item-details-popup-bg" role="presentation">
      <div className="database-item-details" role="presentation" ref={wrapperRef}>
        <textarea
          ref={textAreaRef}
          defaultValue={item.text}
          disabled={!isBeingModified || undefined}
        />
        <div className="database-item-bottom">
          <p>
            <span>ID:</span> {item.id}
          </p>
          <ButtonsContainer>
            {isBeingModified ? (
              <>
                <button type="button" className="cancel" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="button" onClick={handlePropose}>
                  Propose
                </button>
              </>
            ) : (
              <button type="button" onClick={handleModify}>
                Modify
              </button>
            )}
          </ButtonsContainer>
        </div>
      </div>
    </Wrapper>
  );
};

export default DatabaseItemDetailsPopup;

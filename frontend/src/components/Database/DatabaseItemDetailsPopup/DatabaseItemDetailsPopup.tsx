import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';

import PopupTemplate from 'components/PopupTemplate';
import { Button, Label, TextArea, TransferValueInput } from 'components/Widgets';

import checkIfSufficientValue from 'utils/checkIfSufficientValue';
import { DatabaseItem } from 'utils/getDatabaseItem';

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
  justify-content: start;
  padding-bottom: 4px;
`;

interface DatabaseItemDetailsPopupProps {
  item: DatabaseItem;
  proposalPrice?: number;
  onPopupClose: () => void;
  onItemPropose: (id: number, text: string, description: string, transferValue: number) => void;
}

const DatabaseItemDetailsPopup = ({
  item,
  proposalPrice,
  onPopupClose,
  onItemPropose,
}: DatabaseItemDetailsPopupProps): JSX.Element => {
  const textAreaItemRef = useRef<HTMLTextAreaElement>(null);
  const textAreaDescRef = useRef<HTMLTextAreaElement>(null);

  const [isBeingModified, setIsBeingModified] = useState(false);
  const [transferValue, setTransferValue] = useState(0);

  const isSufficientValue = useCallback(
    () => proposalPrice === undefined || checkIfSufficientValue(transferValue, proposalPrice),
    [transferValue, proposalPrice]
  );

  const handleCancel = () => {
    setIsBeingModified(false);
    if (textAreaItemRef.current) {
      textAreaItemRef.current.value = item.text;
    }
  };

  const handlePropose = () => {
    setIsBeingModified(false);
    if (textAreaItemRef.current && textAreaDescRef.current) {
      onItemPropose(
        item.id,
        textAreaItemRef.current.value,
        textAreaDescRef.current.value,
        transferValue
      );
    }
  };

  const handleModify = () => {
    setIsBeingModified(true);
  };

  // TODO: maybe disable propose button when wallet not connected?
  return (
    <PopupTemplate
      leftBottom={
        <Wrapper>
          <Label>
            <span>ID:</span> {item.id}
          </Label>
          {isBeingModified && (proposalPrice !== undefined) && (
            <TransferValueInput
              sufficient={isSufficientValue()}
              proposalPrice={proposalPrice}
              onInputChange={setTransferValue}
            />
          )}
        </Wrapper>
      }
      buttons={
        isBeingModified ? (
          <>
            <Button type="button" className="cancel-btn" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="button" className="primary-btn" onClick={handlePropose}>
              Propose
            </Button>
          </>
        ) : (
          <Button type="button" className="primary-btn" onClick={handleModify}>
            Modify
          </Button>
        )
      }
      onPopupClose={onPopupClose}
    >
      <TextArea
        ref={textAreaItemRef}
        defaultValue={item.text}
        disabled={!isBeingModified || undefined}
      />
      {isBeingModified && (
        <>
          <hr />
          <TextArea ref={textAreaDescRef} placeholder="Description..." />
        </>
      )}
    </PopupTemplate>
  );
};

export default DatabaseItemDetailsPopup;

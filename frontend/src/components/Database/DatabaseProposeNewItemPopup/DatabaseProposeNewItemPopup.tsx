import React, { useCallback, useRef, useState } from 'react';

import PopupTemplate from 'components/PopupTemplate';
import { Button, Label, TextArea, TransferValueInput } from 'components/Widgets';

import checkIfSufficientValue from 'utils/checkIfSufficientValue';

interface DatabaseProposeNewItemPopupProps {
  proposalPrice: number;
  onPopupClose: () => void;
  onItemPropose: (item: string, description: string, transferValue?: number) => void;
}

const DatabaseProposeNewItemPopup = ({
  proposalPrice,
  onPopupClose,
  onItemPropose,
}: DatabaseProposeNewItemPopupProps): JSX.Element => {
  const textAreaItemRef = useRef<HTMLTextAreaElement>(null);
  const textAreaDescRef = useRef<HTMLTextAreaElement>(null);

  const [transferValue, setTransferValue] = useState(0);

  const isSufficientValue = useCallback(
    () => checkIfSufficientValue(transferValue, proposalPrice),
    [transferValue, proposalPrice]
  );

  const handlePropose = () => {
    if (textAreaItemRef.current && textAreaDescRef.current) {
      onItemPropose(textAreaItemRef.current.value, textAreaDescRef.current.value, transferValue);
    }
  };

  // TODO: maybe disable propose button when wallet not connected?
  return (
    <PopupTemplate
      leftBottom={
        <>
          <Label>
            <span>NEW</span>
          </Label>

          <TransferValueInput
            sufficient={isSufficientValue()}
            proposalPrice={proposalPrice}
            onInputChange={setTransferValue}
          />
        </>
      }
      buttons={
        <>
          <Button type="button" className="cancel-btn" onClick={onPopupClose}>
            Cancel
          </Button>
          <Button type="button" className="primary-btn" onClick={handlePropose}>
            Propose
          </Button>
        </>
      }
      onPopupClose={onPopupClose}
    >
      <TextArea ref={textAreaItemRef} />
      <hr />
      <TextArea ref={textAreaDescRef} placeholder="Description..." />
    </PopupTemplate>
  );
};

export default DatabaseProposeNewItemPopup;

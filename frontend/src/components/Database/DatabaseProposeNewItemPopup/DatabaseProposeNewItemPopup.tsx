import React, { useRef } from 'react';

import PopupTemplate from 'components/PopupTemplate';
import { Button, Label, TextArea } from 'components/Widgets';

interface DatabaseProposeNewItemPopupProps {
  onPopupClose: () => void;
  onItemPropose: (item: string) => void;
}

const DatabaseProposeNewItemPopup = ({
  onPopupClose,
  onItemPropose,
}: DatabaseProposeNewItemPopupProps): JSX.Element => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handlePropose = () => {
    if (textAreaRef.current) {
      onItemPropose(textAreaRef.current.value);
    }
  };

  // TODO: maybe disable propose button when wallet not connected?
  return (
    <PopupTemplate
      leftBottom={
        <Label>
          <span>NEW</span>
        </Label>
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
      <TextArea ref={textAreaRef} />
    </PopupTemplate>
  );
};

export default DatabaseProposeNewItemPopup;

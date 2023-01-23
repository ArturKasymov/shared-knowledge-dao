import React, { useRef } from 'react';

import PopupTemplate from 'components/PopupTemplate';
import { Button, Label, TextArea } from 'components/Widgets';

interface DatabaseProposeNewItemPopupProps {
  onPopupClose: () => void;
  onItemPropose: (item: string, description: string) => void;
}

const DatabaseProposeNewItemPopup = ({
  onPopupClose,
  onItemPropose,
}: DatabaseProposeNewItemPopupProps): JSX.Element => {
  const textAreaItemRef = useRef<HTMLTextAreaElement>(null);
  const textAreaDescRef = useRef<HTMLTextAreaElement>(null);

  const handlePropose = () => {
    if (textAreaItemRef.current && textAreaDescRef.current) {
      onItemPropose(textAreaItemRef.current.value, textAreaDescRef.current.value);
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
      <TextArea ref={textAreaItemRef} />
      <hr />
      <TextArea ref={textAreaDescRef} placeholder='Description...' />
    </PopupTemplate>
  );
};

export default DatabaseProposeNewItemPopup;

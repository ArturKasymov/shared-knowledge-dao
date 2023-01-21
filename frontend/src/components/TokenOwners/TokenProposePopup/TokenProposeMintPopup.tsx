import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import PopupTemplate from 'components/PopupTemplate';
import { AddressInput, Button, Label } from 'components/Widgets';

import checkIfAddressIsValid from 'utils/checkIfAddressIsValid';

const AddressInputWrapper = styled.div`
  width: 480px;
`;

interface TokenProposeMintPopupProps {
  onPopupClose: () => void;
  onPropose: (address: string) => void;
}

const TokenProposeMintPopup = ({
  onPopupClose,
  onPropose,
}: TokenProposeMintPopupProps): JSX.Element => {
  const [address, setAddress] = useState('');

  const isAddressValid = useCallback(() => checkIfAddressIsValid(address), [address]);

  // TODO: maybe disable propose button when wallet not connected?
  return (
    <PopupTemplate
      leftBottom={
        <Label>
          <span>MINT</span>
        </Label>
      }
      buttons={
        <>
          <Button type="button" className="cancel-btn" onClick={onPopupClose}>
            Cancel
          </Button>
          <Button type="button" onClick={() => onPropose(address)} disabled={!isAddressValid()}>
            Propose
          </Button>
        </>
      }
      onPopupClose={onPopupClose}
    >
      <AddressInputWrapper>
        <AddressInput valid={isAddressValid()} onAddressChange={setAddress} />
      </AddressInputWrapper>
    </PopupTemplate>
  );
};

export default TokenProposeMintPopup;

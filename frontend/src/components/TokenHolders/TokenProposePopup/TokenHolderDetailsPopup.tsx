import React from 'react';
import styled from 'styled-components';

import PopupTemplate from 'components/PopupTemplate';
import { AddressInput, Button, Label } from 'components/Widgets';

const AddressInputWrapper = styled.div`
  width: 480px;
`;

interface TokenHolderDetailsPopupProps {
  address: string;
  balance: number;
  onPopupClose: () => void;
  onProposeBurn: (address: string) => void;
}

// TODO: maybe disable propose button when wallet not connected?
export default ({
  address,
  balance,
  onPopupClose,
  onProposeBurn,
}: TokenHolderDetailsPopupProps): JSX.Element => (
  <PopupTemplate
    leftBottom={
      <Label>
        <span>BALANCE:</span> {balance}
      </Label>
    }
    buttons={
      <Button type="button" onClick={() => onProposeBurn(address)}>
        Propose burn
      </Button>
    }
    onPopupClose={onPopupClose}
  >
    <AddressInputWrapper>
      <AddressInput disabled value={address} valid />
    </AddressInputWrapper>
  </PopupTemplate>
);

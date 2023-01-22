import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { ApiPromise } from '@polkadot/api';

import { displayErrorToast } from 'components/NotificationToast';

import { ErrorToastMessages } from 'shared/constants';
import { RootState } from 'redux/store';
import { setAllTokenHolders } from 'redux/slices/tokenHoldersSlice';
import { queries } from 'shared/layout';
import { getTokenHolders } from 'utils/getToken';
import { getTokensBalance } from 'utils/getTokensBalance';
import { proposeBurn as proposeBurnToken } from 'utils/proposeToken';
import type { TokenHolder as TokenHolderModel } from 'utils/model';

import TokenHolder from './TokenHolder';
import TokenHolderDetailsPopup from './TokenProposePopup/TokenHolderDetailsPopup';

const Wrapper = styled.div`
  color: ${({ theme }) => theme.colors.white};
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-top: 4%;

  .toggle-switch-wrapper {
    width: 100%;
    position: absolute;
    top: 360px;
    left: -200px;
  }
`;

const TokenHoldersContainer = styled.div`
  width: 75%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 40px;
  align-items: center;
  z-index: 10;

  ${queries.tablet} {
  }
`;

interface TokenHoldersProps {
  api: ApiPromise | null;
}

export default ({ api }: TokenHoldersProps): JSX.Element => {
  const [tokenHolders, setTokenHolders] = useState<TokenHolderModel[]>([]);
  const dispatch = useDispatch();
  const loggedAccount = useSelector((state: RootState) => state.walletAccounts.account);
  const testTokenHolders = useSelector((state: RootState) => state.tokenHolders.tokenHolders);
  const [tokenHolderDetailsDisplay, setTokenHolderDetailsDisplay] =
    useState<TokenHolderModel | null>(null);

  const getAllTokenHolders = useCallback(async () => api && getTokenHolders(api), [api]);
  const getTokenHolderBalance = useCallback(
    async (address: string) => api && getTokensBalance(address, api),
    [api]
  );

  useEffect(() => {
    (async () => {
      const addresses = await getAllTokenHolders();
      const allTokenHolders = addresses?.map(async (address) => ({
        address,
        balance: await getTokenHolderBalance(address),
      }));
      if (allTokenHolders) {
        Promise.all(allTokenHolders).then(
          (holders) => holders && setTokenHolders(holders as TokenHolderModel[])
        );
      }
    })();
  }, [getAllTokenHolders, getTokenHolderBalance]);

  useEffect(() => {
    dispatch(setAllTokenHolders(tokenHolders));
  }, [tokenHolders, tokenHolders.length, dispatch]);

  const handleProposeBurn = (holderAddress: string) => {
    if (!loggedAccount) {
      displayErrorToast(ErrorToastMessages.NO_WALLET);
      return;
    }

    if (api) {
      proposeBurnToken(holderAddress, loggedAccount, api).then(() =>
        setTokenHolderDetailsDisplay(null)
      );
    }
  };

  const displayTokenHolderDetails = useCallback(
    (address: string) => {
      const holderToBeDisplayed = tokenHolders.find((holder) => holder.address === address);
      if (holderToBeDisplayed) {
        setTokenHolderDetailsDisplay(holderToBeDisplayed);
      }
    },
    [tokenHolders]
  );

  return (
    <Wrapper>
      {tokenHolderDetailsDisplay && (
        <TokenHolderDetailsPopup
          address={tokenHolderDetailsDisplay.address}
          balance={tokenHolderDetailsDisplay.balance}
          onPopupClose={() => setTokenHolderDetailsDisplay(null)}
          onProposeBurn={handleProposeBurn}
        />
      )}
      <TokenHoldersContainer>
        {testTokenHolders.map((tokenHolder) => (
          <TokenHolder
            key={tokenHolder.address}
            address={tokenHolder.address}
            balance={tokenHolder.balance}
            displayDetails={displayTokenHolderDetails}
          />
        ))}
      </TokenHoldersContainer>
    </Wrapper>
  );
};

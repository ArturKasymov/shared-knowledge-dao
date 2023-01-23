import React, { useCallback, useEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import { ApiPromise } from '@polkadot/api';

import { getTokensBalance } from 'utils/getTokensBalance';
import { queries } from 'shared/layout';
import { ReactComponent as TokenIcon } from 'assets/TokenIcon.svg';

const TokensBalanceStyling = styled.div<{ empty: boolean }>`
  height: 36px;
  width: max-content;
  color: ${({ theme }) => theme.colors.primaryDarker};
  background: ${({ theme }) => theme.colors.button.secondary};
  border-radius: 18px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 8.5px 16px;
  gap: 8px;
  justify-self: end;
  position: relative;
  transition: background-color 0.4s ease, opacity 0.4s ease;
  will-change: background-color, opacity;
  justify-self: center;

  ${({ empty }) =>
    empty &&
    css`
      background: ${({ theme }) => theme.colors.error};
    `};

  & span {
    font-weight: 500;
    font-size: 20px;

    display: flex;
    align-items: center;
    letter-spacing: 0.06em;
  }

  & .balance-content-logged {
    display: flex;
    justify-content: center;
    padding-bottom: 3px;
  }

  .token-icon {
    width: 24px;
    height: 24px;
  }

  ${queries.tablet} {
    margin-right: 28px;
    justify-self: end;
  }
`;

const TokensBalanceContent = ({ balance }: { balance: number }): JSX.Element | null => (
    <div className="balance-content-logged">
      <span>{balance}</span>
    </div>
);

export interface TokensBalanceProps {
  loggedAccountAddress?: string;
  api: ApiPromise | null;
}

const TokensBalance = ({ loggedAccountAddress, api }: TokensBalanceProps): JSX.Element | null => {
  const [tokensBalance, setTokensBalance] = useState<number | null>(null);

  const getBalance = useCallback(
    async () => (api && loggedAccountAddress ? getTokensBalance(loggedAccountAddress, api) : null),
    [loggedAccountAddress, api]
  );

  useEffect(() => {
    const $getBalance = async () => {
      const balance = await getBalance();
      setTokensBalance(balance);
    };
    $getBalance();
  }, [getBalance]);

  if (tokensBalance === null) return null;

  return (
    <TokensBalanceStyling empty={tokensBalance === 0}>
      <TokenIcon className="token-icon" />
      <TokensBalanceContent balance={tokensBalance} />
    </TokensBalanceStyling>
  );
};

export default TokensBalance;

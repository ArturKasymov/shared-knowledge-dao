import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import 'react-toastify/dist/ReactToastify.css';

import { ApiPromise } from '@polkadot/api';

import Navbar from 'components/Navbar';
import Footer from 'components/Footer';
import NotificationToast from 'components/NotificationToast';
import AccountSelector from 'components/Wallet/AccountSelector';

import { queries } from 'shared/layout';
import { RootState } from 'redux/store';
import checkIfAddressIsValid from 'utils/checkIfAddressIsValid';
import { connectWallet, InjectedAccountWithMeta } from 'redux/slices/walletAccountsSlice';
import backgroundTopImg from 'assets/png/panelBgTop.png';
import backgroundBottomImg from 'assets/png/panelBgBottom.png';

const Wrapper = styled.div`
  min-height: 100vh;
  background: url(${backgroundTopImg}) top left repeat-x,
    url(${backgroundBottomImg}) bottom left repeat-x, ${({ theme }) => theme.colors.background};
  display: grid;
  gap: 24px;
  justify-content: center;
  grid-template-columns: repeat(12, 1fr);
  padding: 24px;

  ${queries.desktop} {
    padding: 0 24px;
    grid-template-columns: repeat(12, 76px);
  }

  .wrapper {
    width: 100%;
    margin-top: 104px;
    grid-column: 2 / span 10;
    justify-self: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;

    ${queries.tiny} {
      margin-top: 82px;
      grid-column: 1 / -1;
    }
  }
`;

interface LayoutProps {
  api: ApiPromise | null;
  children: React.ReactNode;
}

const Layout = ({ api, children }: LayoutProps) => {
  const [isAccountsModalVisible, setIsAccountsModalVisible] = useState(false);

  const dispatch = useDispatch();
  const { allAccounts, account: loggedAccount } = useSelector(
    (state: RootState) => state.walletAccounts
  );

  const onModalAccountSelection = (account: InjectedAccountWithMeta): void => {
    setIsAccountsModalVisible(false);
    dispatch(connectWallet(account));
  };

  useEffect(() => {
    if (isAccountsModalVisible) {
      document.body.style.overflowY = 'scroll';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflowY = 'auto';
      document.body.style.position = 'sticky';
    }
  }, [isAccountsModalVisible]);

  return (
    <Wrapper>
      <Navbar
        setIsAccountsModalVisible={() => setIsAccountsModalVisible(true)}
        loggedAccountAddress={
          checkIfAddressIsValid(loggedAccount?.address) ? loggedAccount?.address : undefined
        }
        api={api}
      />
      {children}
      <NotificationToast />
      <Footer />
      {isAccountsModalVisible && (
        <AccountSelector
          accounts={allAccounts}
          onAccountSelection={(account) => onModalAccountSelection(account)}
          onModalClose={() => setIsAccountsModalVisible(false)}
        />
      )}
    </Wrapper>
  );
};
export default Layout;

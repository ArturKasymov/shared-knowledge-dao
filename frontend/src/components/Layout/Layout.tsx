import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from 'components/Navbar';
import Footer from 'components/Footer';
import NotificationToast from 'components/NotificationToast';
import WelcomePopup from 'components/WelcomePopup';

import { queries } from 'shared/layout';
import { RootState } from 'redux/store';
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
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const isWelcomePopupVisible = useSelector(
    (state: RootState) => state.welcomePopup.isWelcomePopupVisible
  );

  return (
    <Wrapper>
      <Navbar />
      {children}
      <NotificationToast />
      <Footer />
      {isWelcomePopupVisible && <WelcomePopup />}
    </Wrapper>
  );
};
export default Layout;

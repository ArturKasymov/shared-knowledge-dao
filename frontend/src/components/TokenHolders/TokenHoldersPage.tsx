import React from 'react';
import styled from 'styled-components';
import { ApiPromise } from '@polkadot/api';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

import HeroHeading from 'components/HeroHeading';
import Layout from 'components/Layout';

import TokenHoldersList from './TokenHoldersList';
import TokenProposalList from './TokenProposalList';

const Wrapper = styled.div`
  color: ${({ theme }) => theme.colors.white};

  .react-tabs {
    width: 100%;
    align-items: center;
  }
`;

interface TokenHoldersPageProps {
  api: ApiPromise | null;
}

export default ({ api }: TokenHoldersPageProps) => (
  <Layout api={api}>
    <Wrapper className="wrapper">
      <HeroHeading variant="tokens" />
      <Tabs>
        <TabList>
          <Tab>Holders</Tab>
          <Tab>Proposals</Tab>
        </TabList>

        <TabPanel>
          <TokenHoldersList api={api} />
        </TabPanel>
        <TabPanel>
          <TokenProposalList api={api} />
        </TabPanel>
      </Tabs>
    </Wrapper>
  </Layout>
);

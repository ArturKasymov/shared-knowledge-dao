import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { ApiPromise } from '@polkadot/api';
import type { EventRecord } from '@polkadot/types/interfaces';

import HeroHeading from 'components/HeroHeading';
import Layout from 'components/Layout';
import { ProposalAdd, ProposalModify } from 'components/Proposal';
import { displayErrorToast } from 'components/NotificationToast';
import ToggleSwitch from 'components/ToggleSwitch';
import SmoothOptional from 'components/SmoothOptional';
import PlaceholderProposal from 'components/Proposal/Placeholder';

import { ErrorToastMessages } from 'shared/constants';
import { RootState } from 'redux/store';
import {
  setAllProposals,
  setSelfVoteWeight,
  onVoted as updateProposalSelfVoted,
  onExecuted as updateProposalExecuted,
} from 'redux/slices/proposalsSlice';
import { queries } from 'shared/layout';
import { getProposalsIds } from 'utils/getProposalsIds';
import { getProposal } from 'utils/getProposal';
import { getVoteWeight } from 'utils/getVoteWeight';
import { isQuorumReached, isDatabaseProposal, Proposal as ProposalModel } from 'utils/model/proposal';
import { voteForProposal } from 'utils/voteGovernor';
import { executeProposal } from 'utils/executeGovernor';
import { proposeAddItem as proposeAddDatabaseItem } from 'utils/proposeDatabase';

import { ProposalAddDetailsPopup, ProposalModifyDetailsPopup } from './ProposalDetailsPopup';
import DatabaseProposeNewItemPopup from '../Database/DatabaseProposeNewItemPopup';

const Wrapper = styled.div`
  color: ${({ theme }) => theme.colors.white};

  .toggle-switch-wrapper {
    width: 100%;
    position: absolute;
    top: 280px;
    left: -200px;
  }
`;

const ProposalsContainer = styled.div`
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

interface ProposalListProps {
  api: ApiPromise | null;
}

const ProposalList = ({ api }: ProposalListProps): JSX.Element => {
  const [proposals, setProposals] = useState<ProposalModel[]>([]);
  const dispatch = useDispatch();
  const loggedAccount = useSelector((state: RootState) => state.walletAccounts.account);
  const testProposals = useSelector((state: RootState) => state.proposals.proposals).filter(isDatabaseProposal);
  const databaseItems = useSelector((state: RootState) => state.databaseItems.databaseItems);
  const [showExecutedProposals, setShowExecutedProposals] = useState(false);
  const [proposalDetailsDisplay, setProposalDetailsDisplay] = useState<ProposalModel | null>(null);
  const [proposeNewItemDisplay, setProposeNewItemDisplay] = useState(false);
  const getAllProposalsIds = useCallback(async () => api && getProposalsIds(api), [api]);
  const getProposalById = useCallback(
    async (id: number) => api && getProposal(id, loggedAccount, api),
    [loggedAccount, api]
  );

  const getSelfVoteWeight = useCallback(
    async () => api && loggedAccount && getVoteWeight(loggedAccount.address, api),
    [loggedAccount, api]
  );

  useEffect(() => {
    const getProposals = async () => {
      const ids = await getAllProposalsIds();
      const allProposals = ids?.map(async (id) => getProposalById(id));
      if (allProposals) {
        Promise.all(allProposals).then((p) => p && setProposals(p as ProposalModel[]));
      }
    };
    getProposals();
  }, [getAllProposalsIds, getProposalById]);

  useEffect(() => {
    dispatch(setAllProposals(proposals));
  }, [proposals, dispatch]);

  useEffect(() => {
    (async () => {
      const selfVoteWeight = await getSelfVoteWeight();
      dispatch(setSelfVoteWeight(selfVoteWeight));
    })();
  }, [getSelfVoteWeight, dispatch]);

  const handleVote = (proposalId: number) => {
    if (!loggedAccount) {
      displayErrorToast(ErrorToastMessages.NO_WALLET);
      return;
    }

    if (api) {
      voteForProposal(proposalId, loggedAccount, api).then(() => {
        setProposalDetailsDisplay(null);
        dispatch(updateProposalSelfVoted(proposalId));
      });
    }
  };

  const handleExecute = (proposalId: number) => {
    if (!loggedAccount) {
      displayErrorToast(ErrorToastMessages.NO_WALLET);
      return;
    }

    if (api) {
      executeProposal(proposalId, loggedAccount, api).then(() => {
        setProposalDetailsDisplay(null);
        dispatch(updateProposalExecuted(proposalId));
      });
    }
  };

  const handleProposeAdd = (text: string) => {
    if (!loggedAccount) {
      displayErrorToast(ErrorToastMessages.NO_WALLET);
      return;
    }

    if (api) {
      proposeAddDatabaseItem(text, loggedAccount, api).then(() => setProposeNewItemDisplay(false));
    }
  };

  const displayProposalDetails = (id: number) => {
    // TODO: is it efficient to use testProposals here?
    const proposalToBeDisplayed = testProposals.find((proposal) => proposal.id === id);
    if (!proposalToBeDisplayed) return;
    setProposalDetailsDisplay(proposalToBeDisplayed);
  };

  const proposalToReactNode = (proposal: ProposalModel) => {
    switch (proposal.kind) {
      case 'itemAdd':
        return (
          <ProposalAdd
            key={proposal.id}
            id={proposal.id}
            item={proposal.item}
            isExecuted={proposal.executed}
            displayDetails={displayProposalDetails}
          />
        );
      case 'itemModify':
        return (
          <ProposalModify
            key={proposal.id}
            id={proposal.id}
            itemId={proposal.itemId}
            item={proposal.item}
            isExecuted={proposal.executed}
            displayDetails={displayProposalDetails}
          />
        );
    }
  };

  const proposalToPopup = (proposal: ProposalModel) => {
    const canVote = !!loggedAccount && !proposal.hasSelfVoted;
    const canExecute = !!loggedAccount && !proposal.executed && isQuorumReached(proposal);
    switch (proposal.kind) {
      case 'itemAdd':
        return (
          <ProposalAddDetailsPopup
            id={proposal.id}
            item={proposal.item}
            votes={proposal.votes}
            canVote={canVote}
            canExecute={canExecute}
            onPopupClose={() => setProposalDetailsDisplay(null)}
            onVote={handleVote}
            onExecute={handleExecute}
          />
        );
      case 'itemModify':
        // FIXME: databaseItems may not be loaded
        // either load lazily in this moment
        // or as soon as Proposals page is opened (copy from Database.tsx)
        return (
          <ProposalModifyDetailsPopup
            id={proposal.id}
            itemId={proposal.itemId}
            currentItem={
              databaseItems.find((item) => item.id === proposal.itemId)?.text ?? 'undefined'
            }
            proposedItem={proposal.item}
            votes={proposal.votes}
            canVote={canVote}
            canExecute={canExecute}
            onPopupClose={() => setProposalDetailsDisplay(null)}
            onVote={handleVote}
            onExecute={handleExecute}
          />
        );
    }
  };

  return (
    <>
      {proposeNewItemDisplay && (
        <DatabaseProposeNewItemPopup
          onPopupClose={() => setProposeNewItemDisplay(false)}
          onItemPropose={handleProposeAdd}
        />
      )}
      {proposalDetailsDisplay && proposalToPopup(proposalDetailsDisplay)}
      <Layout api={api}>
        <Wrapper className="wrapper">
          <HeroHeading variant="proposals" />
          <div className="toggle-switch-wrapper">
            <ToggleSwitch checked={showExecutedProposals} onChange={setShowExecutedProposals} />
          </div>
          <ProposalsContainer>
            {testProposals.map((p) => (
              <SmoothOptional key={p.id} show={showExecutedProposals || !p.executed}>
                {proposalToReactNode(p)}
              </SmoothOptional>
            ))}
            <PlaceholderProposal action="A" onClick={() => setProposeNewItemDisplay(true)} />
          </ProposalsContainer>
        </Wrapper>
      </Layout>
    </>
  );
};

export default ProposalList;

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

import { ErrorToastMessages } from 'shared/constants';
import { RootState } from 'redux/store';
import {
  setAllProposals,
  onVoted as updateProposalSelfVoted,
  onExecuted as updateProposalExecuted,
} from 'redux/slices/proposalsSlice';
import { queries } from 'shared/layout';
import { getProposalsIds } from 'utils/getProposalsIds';
import { getProposal } from 'utils/getProposal';
import { Proposal as ProposalModel } from 'utils/model/proposal';
import { voteForProposal } from 'utils/voteGovernor';
import { executeProposal } from 'utils/executeGovernor';

import { ProposalAddDetailsPopup, ProposalModifyDetailsPopup } from './ProposalDetailsPopup';

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
  width:75%;
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
  const testProposals = useSelector((state: RootState) => state.proposals.proposals);
  const databaseItems = useSelector((state: RootState) => state.databaseItems.databaseItems);
  const [showExecutedProposals, setShowExecutedProposals] = useState(false);
  const [proposalDetailsDisplay, setProposalDetailsDisplay] = useState<ProposalModel | null>(null);

  const getAllProposalsIds = useCallback(async () => api && getProposalsIds(api), [api]);
  const getProposalById = useCallback(
    async (id: number) => api && getProposal(id, loggedAccount, api),
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
    switch (proposal.kind) {
      case 'itemAdd':
        return (
          <ProposalAddDetailsPopup
            id={proposal.id}
            item={proposal.item}
            votes={proposal.votes}
            hasSelfVoted={proposal.hasSelfVoted}
            isExecuted={proposal.executed}
            isUserLoggedIn={!!loggedAccount}
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
            hasSelfVoted={proposal.hasSelfVoted}
            isExecuted={proposal.executed}
            isUserLoggedIn={!!loggedAccount}
            onPopupClose={() => setProposalDetailsDisplay(null)}
            onVote={handleVote}
            onExecute={handleExecute}
          />
        );
    }
  };

  // TODO: disable vote button if already voted
  // TODO: disable execute button if not enough votes
  return (
    <>
      {proposalDetailsDisplay && proposalToPopup(proposalDetailsDisplay)}
      <Layout>
        <Wrapper className="wrapper">
          <HeroHeading variant="proposals" />
            <div className="toggle-switch-wrapper">
              <ToggleSwitch checked={showExecutedProposals} onChange={setShowExecutedProposals} />
            </div>
          <ProposalsContainer>
            {testProposals
              .map((p) =>
                <SmoothOptional key={p.id} show={showExecutedProposals || !p.executed}>
                  {proposalToReactNode(p)}
                </SmoothOptional>
            )}
          </ProposalsContainer>
        </Wrapper>
      </Layout>
    </>
  );
};

export default ProposalList;

import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { ApiPromise } from '@polkadot/api';

import HeroHeading from 'components/HeroHeading';
import Layout from 'components/Layout';
import { ProposalAdd, ProposalModify } from 'components/Proposal';
import { displayErrorToast } from 'components/NotificationToast';
import ToggleSwitch from 'components/ToggleSwitch';
import SmoothOptional from 'components/SmoothOptional';
import PlaceholderProposal from 'components/Proposal/Placeholder';

import { ErrorToastMessages, MIN_PROPOSAL_PRICE } from 'shared/constants';
import { RootState } from 'redux/store';
import {
  setAllProposals,
  setSelfVoteWeight,
  onProposed as addProposal,
  onVoted as updateProposalSelfVoted,
  onExecuted as updateProposalExecuted,
} from 'redux/slices/proposalsSlice';
import { queries } from 'shared/layout';
import { getProposalsIds } from 'utils/getProposalsIds';
import { getProposal } from 'utils/getProposal';
import { getVoteWeight } from 'utils/getVoteWeight';
import {
  isQuorumReached,
  isActive as isActiveProposal,
  isDatabaseProposal,
  newAddProposal,
  Proposal as ProposalModel,
  ProposalDatabase as ProposalDatabaseModel,
} from 'utils/model/proposal';
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
  const testProposals = useSelector((state: RootState) => state.proposals.proposals).filter(
    isDatabaseProposal
  );
  const databaseItems = useSelector((state: RootState) => state.databaseItems.databaseItems);
  const tokenHolders = useSelector((state: RootState) => state.tokenHolders.tokenHolders);
  const [showInactiveProposals, setShowInactiveProposals] = useState(false);
  const [proposalDetailsDisplay, setProposalDetailsDisplay] =
    useState<ProposalDatabaseModel | null>(null);
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

  const handleVote = (proposalId: number, isFor: boolean) => {
    if (!loggedAccount) {
      displayErrorToast(ErrorToastMessages.NO_WALLET);
      return;
    }

    if (api) {
      voteForProposal(proposalId, isFor, loggedAccount, api).then(() => {
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

  const handleProposeAdd = useCallback(
    (text: string, description: string, transferValue: number) => {
      if (!loggedAccount) {
        displayErrorToast(ErrorToastMessages.NO_WALLET);
        return;
      }

      if (api) {
        const $transferValue = tokenHolders.some(
          (holder) => holder.address === loggedAccount.address
        )
          ? undefined
          : transferValue;
        proposeAddDatabaseItem(
          text,
          description,
          loggedAccount,
          api,
          $transferValue,
          (proposalId) => dispatch(addProposal(newAddProposal(proposalId, text, description)))
        ).then(() => setProposeNewItemDisplay(false));
      }
    },
    [loggedAccount, tokenHolders, dispatch, api]
  );

  const displayProposalDetails = (id: number) => {
    // TODO: is it efficient to use testProposals here?
    const proposalToBeDisplayed = testProposals.find((proposal) => proposal.id === id);
    if (!proposalToBeDisplayed) return;
    setProposalDetailsDisplay(proposalToBeDisplayed);
  };

  const proposalToReactNode = (proposal: ProposalDatabaseModel) => {
    switch (proposal.kind) {
      case 'itemAdd':
        return (
          <ProposalAdd
            key={proposal.id}
            id={proposal.id}
            item={proposal.item}
            isActive={isActiveProposal(proposal)}
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
            isActive={isActiveProposal(proposal)}
            displayDetails={displayProposalDetails}
          />
        );
    }
  };

  const proposalToPopup = (proposal: ProposalDatabaseModel) => {
    const canVote = !!loggedAccount && !proposal.hasSelfVoted && Date.now() <= proposal.voteEnd;
    const canExecute = !!loggedAccount && !proposal.executed && isQuorumReached(proposal);
    switch (proposal.kind) {
      case 'itemAdd':
        return (
          <ProposalAddDetailsPopup
            id={proposal.id}
            item={proposal.item}
            description={proposal.description}
            votes={proposal.votes}
            voteDeadline={new Date(proposal.voteEnd)}
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
            description={proposal.description}
            votes={proposal.votes}
            voteDeadline={new Date(proposal.voteEnd)}
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
          proposalPrice={MIN_PROPOSAL_PRICE}
        />
      )}
      {proposalDetailsDisplay && proposalToPopup(proposalDetailsDisplay)}
      <Layout api={api}>
        <Wrapper className="wrapper">
          <HeroHeading variant="proposals" />
          <div className="toggle-switch-wrapper">
            <ToggleSwitch checked={showInactiveProposals} onChange={setShowInactiveProposals} />
          </div>
          <ProposalsContainer>
            {testProposals.map((p) => (
              <SmoothOptional key={p.id} show={showInactiveProposals || isActiveProposal(p)}>
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

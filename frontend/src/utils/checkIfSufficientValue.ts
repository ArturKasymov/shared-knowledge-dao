const checkIfSufficientValue = (transferValue: number, proposalPrice: number): boolean =>
  transferValue >= proposalPrice;

export default checkIfSufficientValue;

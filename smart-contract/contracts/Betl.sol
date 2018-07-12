pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';

contract Betl is Ownable {
  using SafeMath for uint;

  uint private constant FEE_PERCENT = 1;
  uint private constant MIN_TIMEOUT = 1 minutes;
  uint private constant MODE_WHATEVER = 0;       // usecase for modes?
  uint private constant MAX_OUTCOMES = 10;

  enum Status {
    UNDEFINED, // Round doesn't exist
    SCHEDULED, // Round exists and is scheduled for the future
    OPEN,
    CLOSED,
    FINISHED,
    CANCELLED,
    TIMEOUT
  }

  // Errors
  string constant HOST_NAME_NOT_FOUND = 'HOST_NAME_NOT_FOUND';
  string constant HOST_OR_ROUND_NOT_FOUND = 'HOST_OR_ROUND_NOT_FOUND';

  event RoundCreated(address indexed host, bytes4 roundId);
  event RoundFinished(address indexed host, bytes4 roundId);
  event RoundCancelled(address indexed host, bytes4 roundId);

  struct Outcomes {
    bytes32[] outcomes;
    // Specifies payout distributions in case multiple winners are possible
    // Example: When there are 3 winners, this array can be [60, 30, 10] ==> in percents, must sum to 100.
    // winnerTiers.length <= numOutcomes
    uint[] payoutTiers;
    //bool hasFlexOutcomes;
  }

  struct Results {
    uint[] payouts;
    // outcomeIndex => winShare [0-100]
    mapping(uint => uint) outcomeWinShares;
  }

  struct Stats {
    uint numBets;
    uint poolSize;
  }

  struct Round {
    uint roundNumber;
    Status status;
    uint createdAt;
    uint endedAt;
    uint timeoutAt;
    uint minBet;
    uint hostBonus; // or: add directly to roundstats += hostBonus
    uint hostFee;

    bytes32 question;
    Outcomes outcomes;
    Results results;
    Stats stats;
    // outcomeIndex =>         player  => bet
    mapping(uint => mapping(address => uint)) playerBets;
    // outcomeIndex => totalBets
    mapping(uint => uint) outcomePools;
    mapping(uint => uint) outcomeNumBets;
  }

  struct HostContext {
    uint nextRoundNumber; // == numRoundsCreated
    uint numRoundsSuccess;
    uint numRoundsCancelled;
    uint totalNumBets;
    uint totalPoolSize;
  }

  //      host    =>  hash(host,id) => Round
  mapping(address => mapping(bytes4 => Round)) rounds;

  //      host    => stats
  mapping(address => HostContext) public hostContext;

  //      name   <=> host
  mapping(bytes32 => address) public hostAddresses;
  mapping(address => bytes32) public hostNames;

  modifier roundExists(address _host, bytes4 _roundId) {
    //require(rounds[_host][_roundId].status != Status.UNDEFINED, HOST_OR_ROUND_NOT_FOUND);
    _;
  }

  function getRound(address _host, bytes4 _roundId) private view returns (Round storage) {
    Round storage r = rounds[_host][_roundId];
    // verify existance of round
    Status status = r.status;
    require(uint(status) < 7);
    return r;
  }

  // Frontend helper
  function getNextRoundNumber(address _host) external view returns (uint) {
    return hostContext[_host].nextRoundNumber
  }

  // Frontend needs to fetch roundId of created round.
  function getNextRoundId(address _host) public view returns (bytes4) {
    uint nrn = hostContext[_host].nextRoundNumber;
    bytes32 hash = keccak256(abi.encodePacked(_host, nrn));
    return bytes4(hash);
  }

  function generateRoundId(address _host) private returns (uint, bytes4) {
    uint roundNumber = hostContext[_host].nextRoundNumber;
    bytes4 roundId = getNextRoundId(_host);
    hostContext[_host].nextRoundNumber += 1;
    return (roundNumber, roundId);
  }

  // ADD/TODO/TOTHINK?:
  // - modeCode usefulness? e.g. 'winner-takes-it-all', '80-20', '66-33', '66-25-9', '50-25-12.5-6.25-3.125'
  // configData[ scheduledAt, timeout, minBet, hostShare ]
  // COSTS: 294518 gas -> @ 5Gwei: 1 dollar
  function createRound(
    bytes32 _question,
    bytes32[] _outcomes,
    uint[4] _configData, // array of format `[scheduledAt, timeout, minBet, hostFee]`
    uint[] _payoutTiers
  )
    external
    payable
  {
    require(_configData[0] == 0 || _configData[0] > now);
    require(_configData[1] >= MIN_TIMEOUT);
    require(_outcomes.length >= 2 && _outcomes.length <= MAX_OUTCOMES);
    require(_configData[3] <= 100);
    require(_payoutTiers.length <= _outcomes.length);

    Status status = Status.OPEN;

    Outcomes memory outcomes = Outcomes(
      _outcomes,                        // outcomes
      _payoutTiers                      // payout tiers in percent in DESC order
    );

    Results memory results = Results(
      new uint[](_outcomes.length)      // payouts
    );

    Stats memory stats = Stats(
      0,                                // numBets
      msg.value                         // poolSize
    );

    uint roundNumber;
    bytes4 roundId;
    (roundNumber, roundId) = generateRoundId(msg.sender);

    rounds[msg.sender][roundId] = Round(
      roundNumber,
      status,                           // initial status
      now,                              // createdAt
      0,                                // endedAt
      now + _configData[1],             // timeoutAt
      _configData[2],                   // minBet
      msg.value,                        // hostBonus
      _configData[3],                   // hostFee

      _question,
      outcomes,
      results,
      stats
    );

    emit RoundCreated(msg.sender, roundId);
  }

  function bet(address _host, bytes4 _roundId, uint _outcomeIndex) external payable {
    Round storage r = getRound(_host, _roundId);
    require(r.status == Status.OPEN);

    require(msg.value > 0 && msg.value >= r.minBet);
    require(r.outcomes.outcomes[_outcomeIndex] != bytes32(0));
    require(r.timeoutAt == 0 || now < r.timeoutAt);
  
    r.playerBets[_outcomeIndex][msg.sender] = r.playerBets[_outcomeIndex][msg.sender].add(msg.value);
    r.outcomePools[_outcomeIndex] = r.outcomePools[_outcomeIndex].add(msg.value);
    r.outcomeNumBets[_outcomeIndex] = r.outcomeNumBets[_outcomeIndex].add(1);
    r.stats.numBets = r.stats.numBets.add(1);
    r.stats.poolSize = r.stats.poolSize.add(msg.value);
  } 

  function pickWinnerAndEnd(uint[] _picks, bytes4 _roundId) external payable {
    Round storage r = getRound(msg.sender, _roundId);
    require(r.status == Status.OPEN || r.status == Status.CLOSED);

    require(_picks.length == r.outcomes.outcomes.length);
    require(now < r.timeoutAt); // --> cancelInternal when timeoutAt reached? Nahh. move to Closed?

    uint ownerFee = r.stats.poolSize.mul(FEE_PERCENT).div(100);
    uint remainingPool = r.stats.poolSize - ownerFee;
    uint hostFee = r.stats.poolSize.mul(r.hostFee).div(100);
    remainingPool = remainingPool - hostFee;

    uint allShares;

    for (uint i=0; i<_picks.length; i++) {
      uint outcomeShare = _picks[i];

      if(outcomeShare == 0) continue;

      require(outcomeShare <= 100);
      allShares += outcomeShare;

      // populate lookup to simplify getter function `getRoundOutcomeWinShare`
      r.results.outcomeWinShares[i] = outcomeShare;

      // distribute round pool
      r.results.payouts[i] = remainingPool.mul(outcomeShare).div(100);
    }
    require(allShares == 100);

    hostContext[msg.sender].totalNumBets += r.stats.numBets;
    hostContext[msg.sender].totalPoolSize += r.stats.poolSize;
    hostContext[msg.sender].numRoundsSuccess += 1;
    r.status = Status.FINISHED;
    r.endedAt = now;

    owner.transfer(ownerFee);
    if (hostFee > 0) msg.sender.transfer(hostFee);

    emit RoundFinished(msg.sender, _roundId);
  }

  function areValidPicks(uint[] memory _picks) private pure returns (bool) {
    uint sum;
    for (uint i=0; i<_picks.length; i++) {
      sum += _picks[i];
    }
    return sum == 100;
  }

  function getOutcomeId(Round storage _round, uint _outcomeIndex) private view returns (bytes32) {
    return keccak256(abi.encodePacked(_round.outcomes.outcomes[_outcomeIndex]));
  }

  function claimPayout(address _host, bytes4 _roundId) external {
    Round storage r = getRound(_host, _roundId);
    require(r.status == Status.FINISHED);
    
    uint myPayout;

    for (uint i=0; i<r.outcomes.outcomes.length; i++) {
      uint outcomeShare = r.results.outcomeWinShares[i];

      if (outcomeShare == 0) {
        continue;
      }
   
      uint myOutcomePayout = getMyPayoutForOutcome(
          r.playerBets[i][msg.sender],
          outcomeShare,
          r.outcomePools[i],
          r.stats.poolSize
      );

      if (myOutcomePayout > 0) {
        myPayout = myPayout.add(myOutcomePayout);

        // Reset player bets so that they can't be claimed again
        r.playerBets[i][msg.sender] = 0;
      }

      // Minor optimization that skips iterations in case an outcome got picked as only
      // winner (outcomeShare == 100 (%)) which is expeceted to be often the case
      if (outcomeShare == 100) {
        break;
      }
    }

    require(myPayout > 0);
    msg.sender.transfer(myPayout);
  }

  function claimRefund(address _host, bytes4 _roundId) external {
    Round storage r = getRound(_host, _roundId);
    require(r.status == Status.CANCELLED || r.status == Status.TIMEOUT);

    uint myRefund;

    for(uint i=0; i<r.outcomes.outcomes.length; i++) {
      myRefund = myRefund.add(r.playerBets[i][msg.sender]);
      r.playerBets[i][msg.sender] = 0;
    }

    require(myRefund > 0);
    msg.sender.transfer(myRefund);
  }

  function getMyPayoutForOutcome(uint _myBet, uint _outcomeShare, uint _outcomePool, uint _roundPool) pure private returns (uint) {
    if (_myBet > 0) {
      uint myOutcomeShare = (_myBet*1e20).div(_outcomePool);

      uint myOutcomePayout = _roundPool
          .mul(_outcomeShare)
          .div(100)
          .mul(myOutcomeShare)
          .div(1e20);

      return myOutcomePayout;
    }
    return 0;
  }

  function cancelRound(bytes4 _roundId) external {
    Round storage r = getRound(msg.sender, _roundId);
    require(r.status == Status.SCHEDULED || r.status == Status.OPEN);

    rounds[msg.sender][_roundId].status = Status.CANCELLED;
    hostContext[msg.sender].numRoundsCancelled += 1;
    emit RoundCancelled(msg.sender, _roundId);
  }


  ///
  /// Getters used by UI
  ///

  function getRoundInfo(address _host, bytes4 _roundId)
    public
    view
    roundExists(_host, _roundId)
    // status, createdAt, endedAt, timeoutAt, question, numOutcomes, numBets, poolSize, hostBonus, hostFee
    returns (uint, uint, uint, uint, bytes32, uint, uint, uint, uint, uint)
  {
    Round storage r = getRound(_host, _roundId);
   
    return (
      uint256(r.status),
      r.createdAt,
      r.endedAt,
      r.timeoutAt,
      r.question,
      r.outcomes.outcomes.length,
      r.stats.numBets,
      r.stats.poolSize,
      r.hostBonus,
      r.hostFee
    );
  }

  // Convenience function for the client to only fetch fields that can be
  // updated in the lifecycle of a Round
  function getRoundInfoChanges(address _host, bytes4 _roundId) public view roundExists(_host, _roundId)
    returns (uint, uint, uint, uint)
  {
    Round storage r = getRound(_host, _roundId);

    return (
      uint256(r.status),
      r.endedAt,
      r.stats.numBets,
      r.stats.poolSize
    );
  }

  function getRoundOutcomeByName(bytes32 _hostName, bytes4 _roundId, uint _outcomeIndex) external view returns (bytes32) {
    require(hostAddresses[_hostName] != address(0), HOST_NAME_NOT_FOUND);
    return getRoundOutcome(hostAddresses[_hostName], _roundId, _outcomeIndex);
  }
  
  function getRoundOutcome(address _host, bytes4 _roundId, uint _outcomeIndex) public view roundExists(_host, _roundId) returns (bytes32) {
    Round storage r = getRound(_host, _roundId);
    require(_outcomeIndex < r.outcomes.outcomes.length);
    return r.outcomes.outcomes[_outcomeIndex];
  }

  function getRoundOutcomePoolByName(bytes32 _hostName, bytes4 _roundId, uint _outcomeIndex) external view returns (uint) {
    require(hostAddresses[_hostName] != address(0), HOST_NAME_NOT_FOUND);
    return getRoundOutcomePool(hostAddresses[_hostName], _roundId, _outcomeIndex);
  }
  
  function getRoundOutcomePool(address _host, bytes4 _roundId, uint _outcomeIndex) public view returns (uint) {
    return rounds[_host][_roundId].outcomePools[_outcomeIndex];
  }

  function getRoundOutcomeNumBetsByName(bytes32 _hostName, bytes4 _roundId, uint _outcomeIndex) external view returns (uint) {
    require(hostAddresses[_hostName] != address(0), HOST_NAME_NOT_FOUND);
    return getRoundOutcomeNumBets(hostAddresses[_hostName], _roundId, _outcomeIndex);
  }
  
  function getRoundOutcomeNumBets(address _host, bytes4 _roundId, uint _outcomeIndex) public view returns (uint) {
    return rounds[_host][_roundId].outcomeNumBets[_outcomeIndex];
  }

  function getMyRoundOutcomeBetByName(bytes32 _hostName, bytes4 _roundId, uint _outcomeIndex) external view returns (uint) {
    require(hostAddresses[_hostName] != address(0), HOST_NAME_NOT_FOUND);
    return getMyRoundOutcomeBet(hostAddresses[_hostName], _roundId, _outcomeIndex);
  }
  
  function getMyRoundOutcomeBet(address _host, bytes4 _roundId, uint _outcomeIndex) public view returns (uint) {
    Round storage r = getRound(_host, _roundId);
    return r.playerBets[_outcomeIndex][msg.sender];
  }

  function getRoundOutcomeWinShareByName(bytes32 _hostName, bytes4 _roundId, uint _outcomeIndex) external view returns (uint) {
    require(hostAddresses[_hostName] != address(0), HOST_NAME_NOT_FOUND);
    return getRoundOutcomeWinShare(hostAddresses[_hostName], _roundId, _outcomeIndex);
  }
  
  function getRoundOutcomeWinShare(address _host, bytes4 _roundId, uint _outcomeIndex) public view returns (uint) {
    return rounds[_host][_roundId].results.outcomeWinShares[_outcomeIndex];
  }

  //                                          numRoundsCreated, numRoundsCancelled, numBets, poolSize
  function getHostStats (address _host) external view returns (uint, uint, uint, uint) {
    HostContext storage hc = hostContext[_host];
    return (
      hc.numRoundsSuccess,
      hc.numRoundsCancelled,
      hc.totalNumBets,
      hc.totalPoolSize
    );
  }


  ///
  /// Management of `Username <-> address` mapping
  ///

  function registerRecord(bytes32 _name)
    public
  {
    require(hostAddresses[_name] == address(0));
    require(hostNames[msg.sender] == bytes32(0));

    _setRecord(msg.sender, _name);
  }

  function deleteRecord()
    public
  {
    bytes32 oldName = hostNames[msg.sender];
    require(oldName[0] != 0);

    _removeRecord(msg.sender, oldName);
  }

  function updateRecord(bytes32 _newName)
    external
  {
    deleteRecord();
    registerRecord(_newName);
  }

  function sudoDeleteRecord(bytes32 _name)
    external
    onlyOwner
  {
    address affectedAddress = hostAddresses[_name];
    require(affectedAddress == address(0));

    _removeRecord(affectedAddress, _name);
  }

  function _setRecord(
    address _address,
    bytes32 _name
  )
    private
  {
    hostAddresses[_name] = _address;
    hostNames[_address] = _name;
  }

  function _removeRecord(
    address _address,
    bytes32 _name
  )
    private
  {
    delete hostAddresses[_name];
    delete hostNames[_address];
  }

  function ()
    external
    payable
  {
    revert(); 
  }
}
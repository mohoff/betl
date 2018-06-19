pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';

contract Betl is Ownable {
  using SafeMath for uint;

  uint private constant FEE_PERCENT = 1;
  uint private constant MIN_TIMEOUT = 1 minutes;
  uint private constant MODE_WHATEVER = 0;       // usecase for modes?

  enum Status {
    UNDEFINED,
    OPEN,
    CLOSED,
    FINISHED,
    CANCELLED,
    TIMEOUT
  }

  event RoundCreated(address indexed host, bytes4 roundId);
  event RoundFinished(address indexed host, bytes4 roundId);
  event RoundCanceled(address indexed host, bytes4 roundId);

  // Eventually divide into RoundConfig and RoundConfigExt. First one mandatory, latter outcomeal
  // Default config: one winner, who takes it all.
  struct RoundConfig {
    uint createdAt;
    uint timeoutAt;
    uint minBet;
    uint hostBonus; // or: add directly to roundstats += hostBonus
  }

  struct RoundOutcomes {
    uint numOutcomes;
    bytes32[] outcomes;
    mapping(bytes32 => bool) outcomeLookup;
    // Specifies payout distributions in case multiple winners are possible
    // Example: When there are 3 winners, this array can be [60, 30, 10] ==> in percents, must sum to 100.
    // winnerTiers.length <= numOutcomes
    uint[] payoutTiers;
    //bool hasFlexOutcomes;
  }

  // has to be aligned with RoundConfig(Ext)
  struct RoundResults {
    // can only contain 1 winner, or multiple ones. Primary winner specified first followed by lower tier orders in DESC order
    // EDIT: an uint-array in the same order as bytes32[]-options. Every option has attributed payoutTier associated.
    // Example: 5 outcomes, winner takes it all, outcome[1] got picked as winner. Then: pickedOutcomes == [0, 100, 0, 0, 0]
    uint[] pickedOutcomes;
    uint[] outcomePayouts; // in wei
  }

  struct RoundStats {
    uint numBets;
    uint poolSize;
  }

  struct Round {
    uint id;
    Status status;
    bytes32 question;
    RoundConfig config;
    RoundOutcomes outcomes;
    RoundResults results;
    RoundStats stats;
    //    hash(opt) =>         player  => bet
    mapping(bytes32 => mapping(address => uint)) playerBets;
    //    hash(opt) => totalBets
    mapping(bytes32 => uint) outcomePools;
    mapping(bytes32 => uint) outcomeNumBets;
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

  // function getRoundId(address _host)
  //   public
  //   view
  //   returns (bytes4)
  // {
  //   return bytes4(keccak256(abi.encodePacked(_host, hostContext[_host].nextRoundId)));
  // }
  function getRoundId(address _host) public view returns (bytes4) {
    uint nextRoundNumber = getNextRoundNumber(_host);
    require(nextRoundNumber > 0);
    bytes32 hash = keccak256(abi.encodePacked(_host, nextRoundNumber-1));
    return bytes4(hash);
  }

  function getNextRoundId(address _host) public view returns (bytes4) {
    bytes32 hash = keccak256(abi.encodePacked(_host, hostContext[_host].nextRoundNumber));
    return bytes4(hash);
  }

  function getNextRoundNumber(address _host) public view returns (uint) {
    return hostContext[_host].nextRoundNumber;
  }

  // ADD/TODO/TOTHINK?:
  // - bool _hasMultipleWinners --> rather no. Host has no reason to cheat --> loss of reputation
  // - modeCode usefulness?
  // configData[ timeout, minBet, hostShare ]
  // COSTS: 294518 gas -> @ 5Gwei: 1 dollar
  function createRound (
    bytes32 _question,
    bytes32[] _outcomes,
    uint[] _configData,
    uint[] _payoutTiers
    //bool _hasFlexOutcomes
  )
    external
    payable
  {
    require(_configData[0] >= MIN_TIMEOUT);
    require(_outcomes.length >= 2);// || _hasFlexOutcomes == true);
    require(_configData[2] <= 100);
    require(_payoutTiers.length <= _outcomes.length);

    uint id = getNextRoundNumber(msg.sender);
    // TODO: check if we really need this check
    // if (id > 0) {
    //   Status status = rounds[msg.sender][getRoundId(msg.sender)].status;
    //   require(status == Status.FINISHED ||
    //     status == Status.CANCELLED || 
    //     status == Status.TIMEOUT);
    // }
    //require(hostContext[msg.sender].roundIdLookup[_roundId] == false);

    RoundConfig memory config = RoundConfig(
      now,
      now + _configData[0],
      _configData[1],
      msg.value
    );

    RoundOutcomes memory outcomes = RoundOutcomes(
      _outcomes.length,
      _outcomes,
      _payoutTiers
    );

    RoundResults memory results = RoundResults(
      new uint[](0),
      new uint[](0)
    );

    RoundStats memory stats = RoundStats(
      0,
      msg.value
    );

    Round memory round = Round(
      id,
      Status.OPEN,
      _question,
      config,
      outcomes,
      results,
      stats
    );
    
    bytes4 roundId = getNextRoundId(msg.sender);
    rounds[msg.sender][roundId] = round;

    // post creation
    hostContext[msg.sender].nextRoundNumber += 1;
    hostContext[msg.sender].totalPoolSize += msg.value;

    emit RoundCreated(msg.sender, roundId);
  }

  function getRound (address _hostAddress, bytes4 _roundId)
    public
    view // status, createdAt, timeoutAt, question, numOutcomes, numBets, poolSize, hostBonus
    returns (uint, uint, uint, uint, bytes32, uint, uint, uint, uint)
  {
    uint nextRoundNumber = hostContext[_hostAddress].nextRoundNumber;
    require(nextRoundNumber > 0, 'Host has not created any round yet');
    Round storage round = rounds[_hostAddress][_roundId];
    require(round.status != Status.UNDEFINED, 'Round does not exist');

    return (
      nextRoundNumber-1,
      uint8(round.status),
      round.config.createdAt,
      round.config.timeoutAt,
      round.question,
      round.outcomes.numOutcomes,
      round.stats.numBets,
      round.stats.poolSize,
      round.config.hostBonus
    );
  }

  function getRound (bytes32 _hostName, bytes4 _roundId) 
    external
    view // status, createdAt, timeoutAt, question, numOutcomes, numBets, poolSize, hostBonus
    returns (uint, uint, uint, uint, bytes32, uint, uint, uint, uint)
  {
    require(hostAddresses[_hostName] != address(0), 'Host does not exist');
    return getRound(hostAddresses[_hostName], _roundId);
  }

  function getRoundOutcomes (
    address _host,
    bytes4 _roundId
  )
    external
    view
    returns (bytes32, bytes32, bytes32, bytes32, bytes32, bytes32, bytes32, bytes32, bytes32, bytes32)
  {
    uint numOutcomes = rounds[_host][_roundId].outcomes.numOutcomes;
    bytes32[] storage o = rounds[_host][_roundId].outcomes.outcomes;

    // numOutcomes if expected to be low so we check in increasing order
    if (numOutcomes == 2) {
      return (o[0], o[1], 0, 0, 0, 0, 0, 0, 0, 0);
    }
    if (numOutcomes == 3) {
      return (o[0], o[1], o[2], 0, 0, 0, 0, 0, 0, 0);
    }
    if (numOutcomes == 4) {
      return (o[0], o[1], o[2], o[3], 0, 0, 0, 0, 0, 0);
    }
    if (numOutcomes == 5) {
      return (o[0], o[1], o[2], o[3], o[4], 0, 0, 0, 0, 0);
    }
    if (numOutcomes == 6) {
      return (o[0], o[1], o[2], o[3], o[4], o[5], 0, 0, 0, 0);
    }
    if (numOutcomes == 7) {
      return (o[0], o[1], o[2], o[3], o[4], o[5], o[6], 0, 0, 0);
    }
    if (numOutcomes == 8) {
      return (o[0], o[1], o[2], o[3], o[4], o[5], o[6], o[7], 0, 0);
    }
    if (numOutcomes == 9) {
      return (o[0], o[1], o[2], o[3], o[4], o[5], o[6], o[7], o[8], 0);
    }
    if (numOutcomes == 10) {
      return (o[0], o[1], o[2], o[3], o[4], o[5], o[6], o[7], o[8], o[9]);
    }
  }

  function getPoolFor(bytes32 _outcome, Round storage _r) private view returns (uint) {
    bytes32 hashOutcome = keccak256(_outcome);
    return _r.outcomePools[hashOutcome];
  }

  function getRoundOutcomePools (
    address _host,
    bytes4 _roundId
  )
    external
    view
    returns (uint, uint, uint, uint, uint, uint, uint, uint, uint, uint)
  {
    Round storage r = rounds[_host][_roundId];
    uint numOutcomes = r.outcomes.numOutcomes;
    bytes32[] storage o = r.outcomes.outcomes;

    // numOutcomes if expected to be low so we check in increasing order
    if (numOutcomes == 2) {
      return (getPoolFor(o[0], r), getPoolFor(o[1], r), 0, 0, 0, 0, 0, 0, 0, 0);
    }
    if (numOutcomes == 3) {
      return (getPoolFor(o[0], r), getPoolFor(o[1], r), getPoolFor(o[2], r), 0, 0, 0, 0, 0, 0, 0);
    }
    if (numOutcomes == 4) {
      return (getPoolFor(o[0], r), getPoolFor(o[1], r), getPoolFor(o[2], r), getPoolFor(o[3], r), 0, 0, 0, 0, 0, 0);
    }
    if (numOutcomes == 5) {
      return (getPoolFor(o[0], r), getPoolFor(o[1], r), getPoolFor(o[2], r), getPoolFor(o[3], r), getPoolFor(o[4], r), 0, 0, 0, 0, 0);
    }
    if (numOutcomes == 6) {
      return (getPoolFor(o[0], r), getPoolFor(o[1], r), getPoolFor(o[2], r), getPoolFor(o[3], r), getPoolFor(o[4], r), getPoolFor(o[5], r), 0, 0, 0, 0);
    }
    if (numOutcomes == 7) {
      return (getPoolFor(o[0], r), getPoolFor(o[1], r), getPoolFor(o[2], r), getPoolFor(o[3], r), getPoolFor(o[4], r), getPoolFor(o[5], r), getPoolFor(o[6], r), 0, 0, 0);
    }
    if (numOutcomes == 8) {
      return (getPoolFor(o[0], r), getPoolFor(o[1], r), getPoolFor(o[2], r), getPoolFor(o[3], r), getPoolFor(o[4], r), getPoolFor(o[5], r), getPoolFor(o[6], r), getPoolFor(o[7], r), 0, 0);
    }
    if (numOutcomes == 9) {
      return (getPoolFor(o[0], r), getPoolFor(o[1], r), getPoolFor(o[2], r), getPoolFor(o[3], r), getPoolFor(o[4], r), getPoolFor(o[5], r), getPoolFor(o[6], r), getPoolFor(o[7], r), getPoolFor(o[8], r), 0);
    }
    if (numOutcomes == 10) {
      return (getPoolFor(o[0], r), getPoolFor(o[1], r), getPoolFor(o[2], r), getPoolFor(o[3], r), getPoolFor(o[4], r), getPoolFor(o[5], r), getPoolFor(o[6], r), getPoolFor(o[7], r), getPoolFor(o[8], r), getPoolFor(o[9], r));
    }
  }

  function getNumBetFor(bytes32 _outcome, Round storage _r) private view returns (uint) {
    bytes32 hashOutcome = keccak256(_outcome);
    return _r.outcomeNumBets[hashOutcome];
  }
  
  function getRoundOutcomeNumBets (
    address _host,
    bytes4 _roundId
  )
    external
    view
    returns (uint, uint, uint, uint, uint, uint, uint, uint, uint, uint)
  {
    Round storage r = rounds[_host][_roundId];
    uint numOutcomes = r.outcomes.numOutcomes;
    bytes32[] storage o = r.outcomes.outcomes;

    // numOutcomes if expected to be low so we check in increasing order
    if (numOutcomes == 2) {
      return (getNumBetFor(o[0], r), getNumBetFor(o[1], r), 0, 0, 0, 0, 0, 0, 0, 0);
    }
    if (numOutcomes == 3) {
      return (getNumBetFor(o[0], r), getNumBetFor(o[1], r), getNumBetFor(o[2], r), 0, 0, 0, 0, 0, 0, 0);
    }
    if (numOutcomes == 4) {
      return (getNumBetFor(o[0], r), getNumBetFor(o[1], r), getNumBetFor(o[2], r), getNumBetFor(o[3], r), 0, 0, 0, 0, 0, 0);
    }
    if (numOutcomes == 5) {
      return (getNumBetFor(o[0], r), getNumBetFor(o[1], r), getNumBetFor(o[2], r), getNumBetFor(o[3], r), getNumBetFor(o[4], r), 0, 0, 0, 0, 0);
    }
    if (numOutcomes == 6) {
      return (getNumBetFor(o[0], r), getNumBetFor(o[1], r), getNumBetFor(o[2], r), getNumBetFor(o[3], r), getNumBetFor(o[4], r), getNumBetFor(o[5], r), 0, 0, 0, 0);
    }
    if (numOutcomes == 7) {
      return (getNumBetFor(o[0], r), getNumBetFor(o[1], r), getNumBetFor(o[2], r), getNumBetFor(o[3], r), getNumBetFor(o[4], r), getNumBetFor(o[5], r), getNumBetFor(o[6], r), 0, 0, 0);
    }
    if (numOutcomes == 8) {
      return (getNumBetFor(o[0], r), getNumBetFor(o[1], r), getNumBetFor(o[2], r), getNumBetFor(o[3], r), getNumBetFor(o[4], r), getNumBetFor(o[5], r), getNumBetFor(o[6], r), getNumBetFor(o[7], r), 0, 0);
    }
    if (numOutcomes == 9) {
      return (getNumBetFor(o[0], r), getNumBetFor(o[1], r), getNumBetFor(o[2], r), getNumBetFor(o[3], r), getNumBetFor(o[4], r), getNumBetFor(o[5], r), getNumBetFor(o[6], r), getNumBetFor(o[7], r), getNumBetFor(o[8], r), 0);
    }
    if (numOutcomes == 10) {
      return (getNumBetFor(o[0], r), getNumBetFor(o[1], r), getNumBetFor(o[2], r), getNumBetFor(o[3], r), getNumBetFor(o[4], r), getNumBetFor(o[5], r), getNumBetFor(o[6], r), getNumBetFor(o[7], r), getNumBetFor(o[8], r), getNumBetFor(o[9], r));
    }
  }

  function getMyBetFor(bytes32 outcome, Round storage _r) private view returns (uint) {
    bytes32 hashOutcome = keccak256(outcome);
    return _r.playerBets[hashOutcome][msg.sender];
  }
  
  function getMyRoundOutcomeBets (
    address _host,
    bytes4 _roundId
  )
    external
    view
    returns (uint, uint, uint, uint, uint, uint, uint, uint, uint, uint)
  {
    Round storage r = rounds[_host][_roundId];
    uint numOutcomes = r.outcomes.numOutcomes;
    bytes32[] storage o = r.outcomes.outcomes;

    // numOutcomes if expected to be low so we check in increasing order
    if (numOutcomes == 2) {
      return (getMyBetFor(o[0], r), getMyBetFor(o[1], r), 0, 0, 0, 0, 0, 0, 0, 0);
    }
    if (numOutcomes == 3) {
      return (getMyBetFor(o[0], r), getMyBetFor(o[1], r), getMyBetFor(o[2], r), 0, 0, 0, 0, 0, 0, 0);
    }
    if (numOutcomes == 4) {
      return (getMyBetFor(o[0], r), getMyBetFor(o[1], r), getMyBetFor(o[2], r), getMyBetFor(o[3], r), 0, 0, 0, 0, 0, 0);
    }
    if (numOutcomes == 5) {
      return (getMyBetFor(o[0], r), getMyBetFor(o[1], r), getMyBetFor(o[2], r), getMyBetFor(o[3], r), getMyBetFor(o[4], r), 0, 0, 0, 0, 0);
    }
    if (numOutcomes == 6) {
      return (getMyBetFor(o[0], r), getMyBetFor(o[1], r), getMyBetFor(o[2], r), getMyBetFor(o[3], r), getMyBetFor(o[4], r), getMyBetFor(o[5], r), 0, 0, 0, 0);
    }
    if (numOutcomes == 7) {
      return (getMyBetFor(o[0], r), getMyBetFor(o[1], r), getMyBetFor(o[2], r), getMyBetFor(o[3], r), getMyBetFor(o[4], r), getMyBetFor(o[5], r), getMyBetFor(o[6], r), 0, 0, 0);
    }
    if (numOutcomes == 8) {
      return (getMyBetFor(o[0], r), getMyBetFor(o[1], r), getMyBetFor(o[2], r), getMyBetFor(o[3], r), getMyBetFor(o[4], r), getMyBetFor(o[5], r), getMyBetFor(o[6], r), getMyBetFor(o[7], r), 0, 0);
    }
    if (numOutcomes == 9) {
      return (getMyBetFor(o[0], r), getMyBetFor(o[1], r), getMyBetFor(o[2], r), getMyBetFor(o[3], r), getMyBetFor(o[4], r), getMyBetFor(o[5], r), getMyBetFor(o[6], r), getMyBetFor(o[7], r), getMyBetFor(o[8], r), 0);
    }
    if (numOutcomes == 10) {
      return (getMyBetFor(o[0], r), getMyBetFor(o[1], r), getMyBetFor(o[2], r), getMyBetFor(o[3], r), getMyBetFor(o[4], r), getMyBetFor(o[5], r), getMyBetFor(o[6], r), getMyBetFor(o[7], r), getMyBetFor(o[8], r), getMyBetFor(o[9], r));
    }
  }

  function getRoundPickedOutcomes (
    address _host,
    bytes4 _roundId
  )
    external
    view
    returns (uint, uint, uint, uint, uint, uint, uint, uint, uint, uint)
  {
    uint numOutcomes = rounds[_host][_roundId].outcomes.numOutcomes;
    uint[] storage p = rounds[_host][_roundId].results.pickedOutcomes;

    // numOutcomes if expected to be low so we check in increasing order
    if (numOutcomes == 2) {
      return (p[0], p[1], 0, 0, 0, 0, 0, 0, 0, 0);
    }
    if (numOutcomes == 3) {
      return (p[0], p[1], p[2], 0, 0, 0, 0, 0, 0, 0);
    }
    if (numOutcomes == 4) {
      return (p[0], p[1], p[2], p[3], 0, 0, 0, 0, 0, 0);
    }
    if (numOutcomes == 5) {
      return (p[0], p[1], p[2], p[3], p[4], 0, 0, 0, 0, 0);
    }
    if (numOutcomes == 6) {
      return (p[0], p[1], p[2], p[3], p[4], p[5], 0, 0, 0, 0);
    }
    if (numOutcomes == 7) {
      return (p[0], p[1], p[2], p[3], p[4], p[5], p[6], 0, 0, 0);
    }
    if (numOutcomes == 8) {
      return (p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7], 0, 0);
    }
    if (numOutcomes == 9) {
      return (p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7], p[8], 0);
    }
    if (numOutcomes == 10) {
      return (p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7], p[8], p[9]);
    }
  }

  //                                          numRoundsCreated, numRoundsCancelled, numBets, poolSize
  function getRoundStatsForHost (address _host) external view returns (uint, uint, uint, uint) {
    HostContext storage hc = hostContext[_host];
    return (hc.numRoundsSuccess, hc.numRoundsCancelled, hc.totalNumBets, hc.totalPoolSize);
  }
  // function addOutcomeForRound (address _host, bytes4 _roundId, bytes32 _outcome) external {
  //   //additional check needed to make sure that round exists?
  //   //require(rounds[_host][_roundId] != 0); // not 0x0, there must be a Round
  //   require(rounds[_host][_roundId].outcomes.hasFlexOutcomes == true);
  //   require(rounds[_host][_roundId].status == Status.OPEN);
  //   require(rounds[_host][_roundId].outcomes.outcomeLookup[_outcome] == false); // outcome doesn't exist yet
    
  //   rounds[_host][_roundId].outcomes.outcomes.push(_outcome);
  //   rounds[_host][_roundId].outcomes.outcomeLookup[_outcome] = true;
  //   rounds[_host][_roundId].outcomes.numOutcomes += 1;
  // }

  // always takes newest rounds.
  function pickWinnerAndEnd (uint[] _winners) external payable {
    bytes4 roundId = getRoundId(msg.sender);

    Status status = rounds[msg.sender][roundId].status;
    require(status == Status.OPEN || status == Status.CLOSED); // Host can either end running or closed Round
    require(_winners.length <= rounds[msg.sender][roundId].outcomes.numOutcomes);
    require(now < rounds[msg.sender][roundId].config.timeoutAt); // --> cancelInternal when timeoutAt reached? Nahh. move to Closed?
    

    // TODO: redistribute payouts
    //owner.transfer(1%)
    //host.transfer(hostShare)
    // payouts = remaining pool


    hostContext[msg.sender].totalNumBets += rounds[msg.sender][roundId].stats.numBets;
    hostContext[msg.sender].totalPoolSize += (rounds[msg.sender][roundId].stats.poolSize + msg.value);
    hostContext[msg.sender].numRoundsSuccess += 1;
    rounds[msg.sender][roundId].status == Status.FINISHED;
    emit RoundFinished(msg.sender, roundId);
  }

  function bet (address _host, bytes4 _roundId, bytes32 _outcomeId) external payable {
    require(_roundId == getRoundId(_host));
    require(rounds[_host][_roundId].status == Status.OPEN);
    require(msg.value >= rounds[_host][_roundId].config.minBet);
    require(rounds[_host][_roundId].outcomes.outcomeLookup[_outcomeId] == true);
    require(now < rounds[_host][_roundId].config.timeoutAt);
  
    rounds[_host][_roundId].playerBets[_outcomeId][msg.sender] += msg.value;
    rounds[_host][_roundId].outcomePools[_outcomeId] += msg.value;
    rounds[_host][_roundId].outcomeNumBets[_outcomeId] += 1;
    rounds[_host][_roundId].stats.numBets += 1;
    rounds[_host][_roundId].stats.poolSize += msg.value;
  }

  function claimPayout (address _host, bytes4 _roundId) external {
    require(_roundId == getRoundId(_host));
    require(rounds[_host][_roundId].status == Status.FINISHED);

    uint payout;
    RoundResults storage results = rounds[_host][_roundId].results;
    uint all = rounds[_host][_roundId].stats.poolSize;

    // In case host only picked one winner, this is one iteration
    // TODO: rework this with new pickedOutcome[]
    for(uint i=0; i<results.pickedOutcomes.length; i++) {
      uint pickedOutcome = results.pickedOutcomes[i];
      uint playerBet = rounds[_host][_roundId].playerBets[pickedOutcome][msg.sender];

      if(playerBet > 0) {
        // e.g. 2 (*1e20)
        uint playerShare = (playerBet*1e20).div(rounds[_host][_roundId].outcomePools[pickedOutcome]);
        // e.g. 70
        uint outcomeShare = rounds[_host][_roundId].outcomes.payoutTiers[i];

        // playerShare * outcomeShare = player payout for pickedOutcomes[i]
        uint share = all.mul(outcomeShare).div(100).mul(playerShare).div(1e20);
        payout += share;

        // reset player bets so that they can't be claimed again
        rounds[_host][_roundId].playerBets[pickedOutcome][msg.sender] = 0;
      }
    }

    require(payout > 0);
    msg.sender.transfer(payout);
  }

  function cancelRound () external {
    bytes4 roundId = getRoundId(msg.sender);

    Status status = rounds[msg.sender][roundId].status;
    require(status == Status.UNDEFINED || status == Status.OPEN); // check if round is cancelable

    rounds[msg.sender][roundId].status = Status.CANCELLED;
    hostContext[msg.sender].numRoundsCancelled += 1;
    emit RoundCanceled(msg.sender, roundId);
  }


  ///
  /// Management of `Username <-> address` mappings
  ///

  function registerRecord (bytes32 _name)
    public
  {
    require(hostAddresses[_name] == address(0));
    require(hostNames[msg.sender] == 0x0000000000000000);

    _setRecord(msg.sender, _name);
  }

  function deleteRecord ()
    public
  {
    bytes32 oldName = hostNames[msg.sender];
    require(oldName[0] != 0);

    _removeRecord(msg.sender, oldName);
  }

  function updateRecord (bytes32 _newName)
    external
  {
    deleteRecord();
    registerRecord(_newName);
  }

  function sudoDeleteRecord (bytes32 _name)
    external
    onlyOwner
  {
    address affectedAddress = hostAddresses[_name];
    require(affectedAddress == address(0));

    _removeRecord(affectedAddress, _name);
  }

  function _setRecord (
    address _address,
    bytes32 _name
  )
    private
  {
    hostAddresses[_name] = _address;
    hostNames[_address] = _name;
  }

  function _removeRecord (
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
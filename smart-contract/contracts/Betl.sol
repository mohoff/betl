pragma solidity ^0.5.3;
pragma experimental ABIEncoderV2;

import './NameRegistry.sol';
import './external/Owned.sol';
import './external/SafeMath.sol';


/**
 * WARNING: This source code is unaudited. Operating BETL can require an online gambling license
 * depending on your jurisdiction.
 *
 * 
 * betl
 *
 * A smart contract to allow hosts to create betting rounds for their audience. A round is
 * represented by a question and an exhaustive set of possible answers or outcomes. Players,
 * which form the audience, participate by placing their bets while the round is open.
 * After a round is decided by the host, players can claim pending payouts. Depending on the
 * round mode, a round can have multiple winning outcomes with different payout allocations.
 *
 * For example: "Will I rank top5 by end of this competitive season?" associates a binary
 * round with the outcomes "Yes" and "No". Both outcomes are mutually exclusive, while the
 * outcome space is exhausted. The payout allocation in percent is denoted as (100,0), where
 * the first number represents the allocation of the winning outcome.
 * 
 * In comparison, "What is my rank by the end of this season?" likely represents a non-
 * binary round. Considering the outcomes "1st", "2nd", "3rd", and "4th or lower", the host
 * can decide payout distributions as (100,0,0,0). This means the winning outcome allocates
 * 100% of the pool. Alternatively, "close bets" can be rewarded as well with tiers as
 * (80,20,0,0) or (50,25,15,10).
 * 
 * By using a name registry, hosts can register human-readable names with their Ethereum
 * address. This allows easier host discoverability by players.
 */
contract Betl is Owned {
  using SafeMath for uint;

  uint private constant FEE_PERCENT = 1;
  uint private constant MIN_TIMEOUT = 1 minutes;
  uint private constant MAX_OUTCOMES = 10;

  enum Status {
    UNDEFINED, // Round doesn't exist
    SCHEDULED, // Round is scheduled for the future
    OPEN,      // Round accepts players' bets
    CLOSED,    // Betting phase closed due to reached round duration
    FINISHED,  // Host picked winning outcome. Players can claim payout
    CANCELLED, // Host cancelled round and bets can be re-claimed.
    TIMEOUT    // Host did not finish round in time. Players can re-claim their bets.
  }

  event RoundCreated(address indexed host, bytes4 roundId);
  event RoundFinished(address indexed host, bytes4 roundId);
  event RoundCancelled(address indexed host, bytes4 roundId);

  struct Outcomes {
    bytes32[] outcomes;
    // Specifies payout distributions per totally or relatively winning outcome
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
    uint hostBonus;
    uint hostFee; // in percent

    bytes32 question;
    Outcomes outcomes;
    Results results;
    Stats stats;
    // outcomeIndex =>      player  => bet
    mapping(uint => mapping(address => uint)) playerBets;
    // outcomeIndex => pool size
    mapping(uint => uint) outcomePools;
    // outcomeIndex => number of bets
    mapping(uint => uint) outcomeNumBets;
  }

  struct HostContext {
    uint nextRoundNumber; // == numRoundsCreated
    uint numRoundsSuccess;
    uint numRoundsCancelled;
    uint totalNumBets;
    uint totalPoolSize;
  }

  NameRegistry public nameRegistry;

  //      host    =>  hash(host,id) => Round
  mapping(address => mapping(bytes4 => Round)) rounds;

  //      host    => stats
  mapping(address => HostContext) public hostContext;

  modifier roundExists(address _host, bytes4 _roundId) {
    require(rounds[_host][_roundId].status > Status.UNDEFINED, 'HOST_OR_ROUND_NOT_FOUND');
    _;
  }

  constructor(NameRegistry _nameRegistry)
    public
  {
    require(_nameRegistry != NameRegistry(0), 'REGISTRY_CANNOT_BE_ZERO');
    nameRegistry = _nameRegistry;
  } 

  function getRound(
    address _host,
    bytes4 _roundId
  )
    private
    view
    returns (Round storage)
  {
    Round storage r = rounds[_host][_roundId];
    // verify existance of round without modifier `roundExists` to save gas
    require(r.status > Status.UNDEFINED, 'HOST_OR_ROUND_NOT_FOUND');

    return r;
  }

  // Frontend needs to fetch roundId of created round.
  function createNextRoundId(
    address _host,
    uint _offset
  ) 
    public
    view
    returns (bytes4, uint)
  {
    bytes4 nextRoundId = bytes4(keccak256(abi.encodePacked(_host, hostContext[_host].nextRoundNumber + _offset)));

    // In case `nextRoundId` exists already (chance is 1:4.3e9), recursively call this function again with offset
    return rounds[_host][nextRoundId].status == Status.UNDEFINED
      ? (nextRoundId, _offset)
      : createNextRoundId(_host, _offset + 1);
  }

  function createNewRoundIdForHost(address _host)
    private
    returns (uint, bytes4)
  {
    (bytes4 createdRoundId, uint offset) = createNextRoundId(_host, 0);
    hostContext[_host].nextRoundNumber = hostContext[_host].nextRoundNumber.add(1 + offset);
  
    return (hostContext[_host].nextRoundNumber, createdRoundId);
  }

  // COSTS: 294518 gas -> @ 5Gwei: 1 dollar
  function createRound(
    bytes32 _question,
    bytes32[] calldata _outcomes,
    uint[4] calldata _configData, // array of format `[scheduledAt, timeout, minBet, hostFeeInPercent]`
    uint[] calldata _payoutTiers  // Pre-defined 'round modes' can be offered on the UI-level
  )
    external
    payable
    returns (bytes4)
  {
    require(_configData[0] == 0 || _configData[0] > now, 'CANNOT_BE_SCHEDULED_FOR_PAST');
    require(_configData[1] >= MIN_TIMEOUT, 'TIMEOUT_TOO_SHORT');
    require(_outcomes.length >= 2 && _outcomes.length <= MAX_OUTCOMES, 'INVALID_NUMBER_OF_OUTCOMES');
    require(_configData[3] <= 100, 'HOST_FEE_CANNOT_EXCEED_100');
    require(_payoutTiers.length <= _outcomes.length, 'OUTCOME_PAYOUTTIER_MISMATCH');

    Status status = Status.OPEN;

    Outcomes memory outcomes = Outcomes({
      outcomes: _outcomes,
      payoutTiers: _payoutTiers // in DESC order
    });

    Results memory results = Results({
      payouts: new uint[](_outcomes.length)
    });

    Stats memory stats = Stats({
      numBets: 0,
      poolSize: msg.value
    });

    (uint roundNumber, bytes4 roundId) = createNewRoundIdForHost(msg.sender);

    rounds[msg.sender][roundId] = Round({
      roundNumber: roundNumber,
      status: status,
      createdAt: now,
      endedAt: 0,
      timeoutAt: now + _configData[1],
      minBet: _configData[2],
      hostBonus: msg.value,
      hostFee: _configData[3],
      question: _question,
      outcomes: outcomes,
      results: results,
      stats: stats
    });

    emit RoundCreated(msg.sender, roundId);

    return roundId;
  }

  function bet(
    address _host,
    bytes4 _roundId,
    uint _outcomeIndex
  )
    external
    payable
  {
    Round storage r = getRound(_host, _roundId);
    require(r.status == Status.OPEN, 'ROUND_NOT_OPEN');

    require(msg.value > 0 && msg.value >= r.minBet, 'BET_TOO_SMALL');
    require(_outcomeIndex < r.outcomes.outcomes.length, 'INVALID_OUTCOME');
    require(r.timeoutAt == 0 || now < r.timeoutAt, 'ROUND_TIMED_OUT');
  
    r.playerBets[_outcomeIndex][msg.sender] = r.playerBets[_outcomeIndex][msg.sender].add(msg.value);
    r.outcomePools[_outcomeIndex] = r.outcomePools[_outcomeIndex].add(msg.value);
    r.outcomeNumBets[_outcomeIndex] = r.outcomeNumBets[_outcomeIndex].add(1);
    r.stats.numBets = r.stats.numBets.add(1);
    r.stats.poolSize = r.stats.poolSize.add(msg.value);
  } 

  function pickWinnerAndEnd(
    uint[] calldata _picks,
    bytes4 _roundId
  )
    external
    payable
  {
    Round storage r = getRound(msg.sender, _roundId);
    require(r.status == Status.OPEN || r.status == Status.CLOSED, 'ROUND_NOT_OPEN_OR_CLOSED');
    require(_picks.length == r.outcomes.outcomes.length, 'INVALID_NUMBER_OF_PICKS');
    require(now < r.timeoutAt, 'ROUND_TIMED_OUT');

    uint poolSize = r.stats.poolSize;
    uint ownerFee = poolSize.mul(FEE_PERCENT).div(100);
    uint hostFee = poolSize.mul(r.hostFee).div(100);
    uint payoutPool = poolSize - (ownerFee + hostFee);

    uint allShares;

    for (uint i = 0; i < _picks.length; i++) {
      uint outcomeShare = _picks[i];

      if(outcomeShare == 0) continue;

      require(outcomeShare <= 100, 'INVALID_PICK_PERCENTAGE');
      allShares += outcomeShare;

      // populate lookup to simplify getter function `getRoundOutcomeWinShare`
      r.results.outcomeWinShares[i] = outcomeShare;

      // Register `outcomeShare` percent of `payoutPool` to payouts of iterated outcome
      r.results.payouts[i] = payoutPool.mul(outcomeShare).div(100);
    }
    require(allShares == 100, 'INVALID_PICK_CONFIG');

    hostContext[msg.sender].totalNumBets = hostContext[msg.sender].totalNumBets.add(r.stats.numBets);
    hostContext[msg.sender].totalPoolSize = hostContext[msg.sender].totalPoolSize.add(r.stats.poolSize);
    hostContext[msg.sender].numRoundsSuccess = hostContext[msg.sender].numRoundsSuccess.add(1);
    r.status = Status.FINISHED;
    r.endedAt = now;

    owner.transfer(ownerFee);
    if (hostFee > 0) {
      msg.sender.transfer(hostFee);
    }

    emit RoundFinished(msg.sender, _roundId);
  }

  function getOutcomeId(
    Round storage _round,
    uint _outcomeIndex
  )
    private
    view
    returns (bytes32)
  {
    return keccak256(abi.encodePacked(_round.outcomes.outcomes[_outcomeIndex]));
  }

  function claimPayout(
    address _host,
    bytes4 _roundId
  )
    external
  {
    Round storage r = getRound(_host, _roundId);
    require(r.status == Status.FINISHED, 'ROUND_NOT_FINISHED');
    
    uint payout;

    for (uint i = 0; i < r.outcomes.outcomes.length; i++) {
      uint outcomeShare = r.results.outcomeWinShares[i];

      if (outcomeShare == 0) continue;
   
      uint myOutcomePayout = getPayoutForOutcome(
          r.playerBets[i][msg.sender],
          outcomeShare,
          r.outcomePools[i],
          r.stats.poolSize
      );

      if (myOutcomePayout > 0) {
        payout = payout.add(myOutcomePayout);

        // Reset player bets so that they can't be claimed again
        r.playerBets[i][msg.sender] = 0;
      }

      // If the outcome was picked as only winner (outcomeShare == 100 (%)) we can
      // break out of the loop, as we found the player's total payout already
      if (outcomeShare == 100) {
        break;
      }
    }

    require(payout > 0, 'NO_PAYOUT_TO_CLAIM');

    msg.sender.transfer(payout);
  }

  function claimRefund(
    address _host,
    bytes4 _roundId
  )
    external
  {
    Round storage r = getRound(_host, _roundId);
    require(r.status == Status.CANCELLED || r.status == Status.TIMEOUT, 'ROUND_NOT_CANCELLED_OR_TIMED_OUT');

    uint refund;

    for(uint i = 0; i < r.outcomes.outcomes.length; i++) {
      refund = refund.add(r.playerBets[i][msg.sender]);
      r.playerBets[i][msg.sender] = 0;
    }

    require(refund > 0, "NO_REFUND_TO_CLAIM");

    msg.sender.transfer(refund);
  }

  function getPayoutForOutcome(
    uint _bet,
    uint _outcomeShare,
    uint _outcomePool,
    uint _roundPool
  )
    pure
    private
    returns (uint)
  {
    if (_bet > 0 && _outcomePool > 0) {
      uint outcomeShare = (_bet*1e20).div(_outcomePool);

      // payout = player's share of the outcome's pool times the outcome's share of the total distribution
      return _roundPool
          .mul(_outcomeShare)
          .div(100)
          .mul(outcomeShare)
          .div(1e20);
    }
    return 0;
  }

  function cancelRound(bytes4 _roundId)
    external
  {
    Round storage r = getRound(msg.sender, _roundId);
    require(r.status == Status.SCHEDULED || r.status == Status.OPEN, "ROUND_CANNOT_BE_CANCELLED");

    rounds[msg.sender][_roundId].status = Status.CANCELLED;
    hostContext[msg.sender].numRoundsCancelled = hostContext[msg.sender].numRoundsCancelled.add(1);

    emit RoundCancelled(msg.sender, _roundId);
  }


  ///
  /// Getters used in UI
  ///

  // Get round constants
  function getRoundInfo(
    address _host,
    bytes4 _roundId
  )
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

  // Get round variables (round details that are expected to change throughout the round lifecycle)
  function getRoundInfoChanges(
    address _host,
    bytes4 _roundId
  )
    public
    view
    roundExists(_host, _roundId)
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

  function getRoundOutcome(
    address _host,
    bytes4 _roundId,
    uint _outcomeIndex
  )
    public
    view
    roundExists(_host, _roundId)
    returns (bytes32)
  {
    Round storage r = getRound(_host, _roundId);
    require(_outcomeIndex < r.outcomes.outcomes.length, 'INVALID_OUTCOME');
    return r.outcomes.outcomes[_outcomeIndex];
  }
  
  function getRoundOutcomePool(
    address _host,
    bytes4 _roundId,
    uint _outcomeIndex
  )
    public
    view
    returns (uint)
  {
    Round storage r = getRound(_host, _roundId);
    require(_outcomeIndex < r.outcomes.outcomes.length, 'INVALID_OUTCOME');
    return r.outcomePools[_outcomeIndex];
  }
  
  function getRoundOutcomeNumBets(
    address _host,
    bytes4 _roundId,
    uint _outcomeIndex
  )
    public
    view
    returns (uint)
  {
    Round storage r = getRound(_host, _roundId);
    require(_outcomeIndex < r.outcomes.outcomes.length, 'INVALID_OUTCOME');
    return r.outcomeNumBets[_outcomeIndex];
  }
  
  function getRoundOutcomeBet(
    address _host,
    bytes4 _roundId,
    uint _outcomeIndex
  )
    public
    view
    returns (uint)
  {
    Round storage r = getRound(_host, _roundId);
    require(_outcomeIndex < r.outcomes.outcomes.length, 'INVALID_OUTCOME');
    return r.playerBets[_outcomeIndex][msg.sender];
  }
  
  function getRoundOutcomeWinShare(
    address _host,
    bytes4 _roundId,
    uint _outcomeIndex
  )
    public
    view
    returns (uint)
  {
    Round storage r = getRound(_host, _roundId);
    require(_outcomeIndex < r.outcomes.outcomes.length, 'INVALID_OUTCOME');
    return r.results.outcomeWinShares[_outcomeIndex];
  }

  function getHostContext(address _host) 
    external
    view
    returns (HostContext memory)
  {
    return hostContext[_host];
  }

  function ()
    external
    payable
  {
    // Do not revert to allow for tips in ETH
  }
}
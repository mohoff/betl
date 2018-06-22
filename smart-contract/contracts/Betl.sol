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
    UNDEFINED,
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
    uint[] outcomePayouts; // in wei
    //    hash(opt) => winShare [0-100]
    mapping(bytes32 => uint) outcomeWinShares;
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

  modifier roundExists(address _host, bytes4 _roundId) {
    require(rounds[_host][_roundId].status != Status.UNDEFINED, HOST_OR_ROUND_NOT_FOUND);
    _;
  }

  function getRound(address _host, bytes4 _roundId) private view roundExists(_hostId, roundId) returns (Round) {
    return rounds[_host][_roundId];
  }

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
  function createRound(
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

  function getRoundInfo(bytes32 _hostName, bytes4 _roundId) 
    external
    view // status, createdAt, timeoutAt, question, numOutcomes, numBets, poolSize, hostBonus
    returns (uint, uint, uint, uint, bytes32, uint, uint, uint, uint)
  {
    require(hostAddresses[_hostName] != address(0), 'Host does not exist');
    return getRound(hostAddresses[_hostName], _roundId);
  }

  function getRoundInfo(address _host, bytes4 _roundId)
    public
    view
    roundExists(_host, _roundId)
    // status, createdAt, timeoutAt, question, numOutcomes, numBets, poolSize, hostBonus
    returns (uint, uint, uint, uint, bytes32, uint, uint, uint, uint)
  {
    uint nextRoundNumber = hostContext[_host].nextRoundNumber;
    require(nextRoundNumber > 0, 'Host has not created any round yet');
    Round storage round = rounds[_host][_roundId];
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

  function getRoundOutcomes(bytes32 _hostName, bytes4 _roundId) external view returns (bytes32[]) {
    require(hostAddresses[_hostName] != address(0), 'Host does not exist');
    return getRoundOutcomes(hostAddresses[_hostName], _roundId);
  }
  
  function getRoundOutcomes(address _host, bytes4 _roundId) public view roundExists(_host, _roundId) returns (bytes32[]) {
    return rounds[_host][_roundId].outcomes.outcomes;
  }

  function getRoundOutcomePool(bytes32 _hostName, bytes4 _roundId, bytes32 _outcomeHash) external view returns (uint) {
    require(hostAddresses[_hostName] != address(0), HOST_NAME_NOT_FOUND);
    return getRoundOutcomePool(hostAddresses[_hostName], _roundId, _outcomeHash);
  }
  
  function getRoundOutcomePool(address _host, bytes4 _roundId, bytes32 _outcomeHash) public view roundExists(_host, _roundId) returns (uint) {
    return rounds[_host][_roundId].outcomePools[_outcomeHash];
  }

  function getRoundOutcomeNumBets(bytes32 _hostName, bytes4 _roundId, bytes32 _outcomeHash) external view returns (uint) {
    require(hostAddresses[_hostName] != address(0), HOST_NAME_NOT_FOUND);
    return getRoundOutcomeNumBets(hostAddresses[_hostName], _roundId, _outcomeHash);
  }
  
  function getRoundOutcomeNumBets(address _host, bytes4 _roundId, bytes32 _outcomeHash) public view roundExists(_host, _roundId) returns (uint) {
    return rounds[_host][_roundId].outcomeNumBets[_outcomeHash];
  }

  function getMyRoundOutcomeBet (bytes32 _hostName, bytes4 _roundId, bytes32 _outcomeHash) external view returns (uint) {
    require(hostAddresses[_hostName] != address(0), HOST_NAME_NOT_FOUND);
    return getMyRoundOutcomeBet(hostAddresses[_hostName], _roundId, _outcomeHash);
  }
  
  function getMyRoundOutcomeBet (address _host, bytes4 _roundId, bytes32 _outcomeHash) public view roundExists(_host, _roundId) returns (uint) {
    return rounds[_host][_roundId].playerBets[_outcomeHash][msg.sender];
  }

  function getRoundOutcomeWinShare (bytes32 _hostName, bytes4 _roundId, bytes32 _outcomeHash) external view returns (uint) {
    require(hostAddresses[_hostName] != address(0), HOST_NAME_NOT_FOUND);
    return getRoundOutcomeWinShare(hostAddresses[_hostName], _roundId, _outcomeHash);
  }
  
  function getRoundOutcomeWinShare (address _host, bytes4 _roundId, bytes32 _outcomeHash) public view roundExists(_host, _roundId) returns (uint) {
    return rounds[_host][_roundId].results.outcomeWinShares[_outcomeHash];
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
  function pickWinnerAndEnd (uint[] _winners, bytes4 _roundId) external payable {
    Round storage r = getRound(msg.sender, _roundId);
    require(r.status == Status.OPEN || r.status == Status.CLOSED);

    require(_winners.length <= rounds[msg.sender][_roundId].outcomes.numOutcomes);
    require(now < rounds[msg.sender][_roundId].config.timeoutAt); // --> cancelInternal when timeoutAt reached? Nahh. move to Closed?
    

    // TODO: redistribute payouts
    //owner.transfer(1%)
    //host.transfer(hostShare)
    // payouts = remaining pool


    hostContext[msg.sender].totalNumBets += rounds[msg.sender][_roundId].stats.numBets;
    hostContext[msg.sender].totalPoolSize += (rounds[msg.sender][_roundId].stats.poolSize + msg.value);
    hostContext[msg.sender].numRoundsSuccess += 1;
    rounds[msg.sender][_roundId].status == Status.FINISHED;
    emit RoundFinished(msg.sender, _roundId);
  }

  function bet(address _host, bytes4 _roundId, bytes32 _outcomeId) external payable {
    Round storage r = getRound(_host, _roundId);
    require(r.status == Status.OPEN);

    require(msg.value >= rr.config.minBet);
    require(r.outcomes.outcomeLookup[_outcomeId] == true);
    require(now < r.config.timeoutAt);
  
    r.playerBets[_outcomeId][msg.sender] += msg.value;
    r.outcomePools[_outcomeId] += msg.value;
    r.outcomeNumBets[_outcomeId] += 1;
    r.stats.numBets += 1;
    r.stats.poolSize += msg.value;
  }

  function claimPayout(address _host, bytes4 _roundId) external {
    Round storage r = getRound(_host, _roundId);
    require(r.status == Status.FINISHED);
    
    uint myPayout;

    for(uint i=0; i<r.outcomes.outcomes.length; i++) {
      bytes32 outcome = keccak256(abi.encodePacked(r.outcomes.outcomes[i]));
      uint outcomeShare = r.results.outcomeWinShares[outcome];

      if (outcomeShare == 0) {
        continue;
      }
   
      uint myOutcomePayout = getMyPayoutForOutcome(
          r.playerBets[outcome][msg.sender],
          outcomeShare,
          r.outcomePools[outcome],
          r.stats.poolSize
      );

      if (myOutcomePayout > 0) {
        myPayout = myPayout.add(myOutcomePayout);

        // Reset player bets so that they can't be claimed again
        r.playerBets[outcome][msg.sender] = 0;
      }

      // Optimization that skips iterations in case an outcome got picked as only
      // winner (outcomeShare == 100 (%)) which is expeceted to be often the case
      if (outcomeShare == 100) {
        break;
      }
    }

    require(myPayout > 0);
    msg.sender.transfer(myPayout);
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
    require(r.status == Status.SCHEDULED || r.status == Status.OPEN)

    rounds[msg.sender][_roundId].status = Status.CANCELLED;
    hostContext[msg.sender].numRoundsCancelled += 1;
    emit RoundCanceled(msg.sender, _roundId);
  }


  ///
  /// Management of `Username <-> address` mappings
  ///

  function registerRecord(bytes32 _name)
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
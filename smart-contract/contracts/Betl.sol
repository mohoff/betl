pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';

contract Betl is Ownable {
  using SafeMath for uint;

  uint private constant FEE_PERCENT = 1;
  uint private constant MIN_TIMEOUT = 1 minutes;
  uint private constant MODE_WHATEVER = 0;       // usecase for modes?

  enum Status {
    INACTIVE,
    OPEN,
    CLOSED,
    FINISHED,
    CANCELLED,
    TIMEOUT
  }

  event RoundCreated(address indexed host, bytes4 roundId);
  event RoundFinished(address indexed host, bytes4 roundId);
  event RoundCanceled(address indexed host, bytes4 roundId);

  // Eventually divide into RoundConfig and RoundConfigExt. First one mandatory, latter optional
  // Default config: one winner, who takes it all.
  struct RoundConfig {
    uint createdAt;
    uint timeoutAt;
    uint minBet;
    uint hostBonus; // or: add directly to roundstats += hostBonus
  }

  struct RoundOptions {
    uint numOptions;
    bytes32[] options;
    mapping(bytes32 => bool) optionLookup;
    // Specifies payout distributions in case multiple winners are possible
    // Example: When there are 3 winners, this array can be [60, 30, 10] ==> in percents, must sum to 100.
    // winnerTiers.length <= numOptions
    uint[] payoutTiers;
    bool hasFlexOptions;
  }

  // has to be aligned with RoundConfig(Ext)
  struct RoundResults {
    // can only contain 1 winner, or multiple ones. Primary winner specified first followed by lower tier orders in DESC order
    bytes32[] pickedOptions;
    uint[] optionPayouts; // in wei
  }

  struct RoundStats {
    uint numBets;
    uint poolSize;
  }

  struct Round {
    bytes4 id;
    uint status;
    RoundConfig config;
    RoundOptions options;
    RoundResults results;
    RoundStats stats;
    //    hash(opt) =>         player  => bet
    mapping(bytes32 => mapping(address => uint)) playerBets;
    //    hash(opt) => totalBets
    mapping(bytes32 => uint) optionBets;
  }

  struct HostContext {
    mapping(bytes4 => bool) roundIdLookup;
    bytes4 lastRoundId;
    uint numRoundsCreated;
    uint numRoundsSuccess;
    uint numRoundsCancelled;
    uint totalNumBets;
    uint totalPoolSize;
  }

  //      host    =>        hash(id) => Round
  mapping(address => mapping(bytes8 => Round)) public rounds;

  //      host    => stats
  mapping(address => HostContext) public hostContext;

  //      name   <=> host
  mapping(bytes32 => address) public hostAddresses;
  mapping(address => bytes32) public hostNames;

  constructor () {
  }

  // ADD/TODO/TOTHINK?:
  // - bool _hasMultipleWinners --> rather no. Host has no reason to cheat --> loss of reputation
  // - modeCode usefulness?
  // configData[ timout, minBet, hostShare ]
  // COSTS: 296305gas -> @ 5Gwei: 1 dollar
  function createRound (
    bytes4 _roundId,
    bytes32[] _options,
    uint[] _configData,
    uint[] _payoutTiers,
    bool _hasFlexOptions)
    external
    payable
  {
    require(_configData[0] >= MIN_TIMEOUT);
    require(_options.length >= 2 || _hasFlexOptions == true);
    require(_configData[2] <= 100);
    if (_hasFlexOptions == false) {
      require(_payoutTiers.length <= _options.length);
    }
    
    if(hostContext[msg.sender].lastRoundId != 0x00000000) {
      uint status = rounds[msg.sender][lastRoundId].status;
      require(status == Status.FINISHED ||
        status == Status.CANCELLED || 
        status == Status.TIMEOUT);
    }
    require(hostContext[msg.sender].roundIdLookup[_roundId] == false);

    RoundConfig memory config = RoundConfig(
      now,
      now + _configData[0],
      _configData[1],
      msg.value
    );

    RoundOptions memory options = RoundOptions(
      _options.length,
      _options,
      _payoutTiers,
      _hasFlexOptions
    );

    RoundResults memory results = RoundResults(
      new uint[](0),
      new uint[](0)
    );

    RoundStats memory stats = RoundStats(
      0,
      0,
      msg.value
    );

    Round memory round = Round(
      id,
      STATUS_OPEN,
      config,
      options,
      results,
      stats
    );
    
    bytes32 idHash = keccak256(id);
    rounds[msg.sender][idHash] = round;

    // post creation
    hostContext[msg.sender].lastRoundId = _roundId;
    hostContext[msg.sender].nextRoundId += 1;
    hostContext[msg.sender].numRoundsCreated += 1;
    hostContext[msg.sender].totalPoolSize += msg.value;

    emit RoundCreated(msg.sender, idHash);
  }

  //                                                           status, createdAt, timeout, minBet, hostBonus, hasFlexOption
  function getRoundConfigForHost (address _host) external view returns (uint, uint, uint, uint, uint, bool) {
  }
  //                                                              numBets, numPlayers, poolSize
  function getRoundStatsForHost (address _host) external view returns (uint, uint, uint) {
  }

  // TODO: implement. For now max 5 options/return values. If only 2 provided, fill up with 0s
  function getRoundOptionsForHost (address _host) external view returns (bytes32, bytes32, bytes32, bytes32, bytes32) { }
  
  function getRoundOptionBetsForHost (address _host) external view returns (uint, uint, uint, uint, uint) { }
  
  function getMyRoundOptionBetsForHost (address _host) external view returns (uint, uint, uint, uint, uint) { }

  function getRoundPickedOptionsForHost (address _host) external view returns (bool, bool, bool, bool, bool) { require(rounds[_host][getCurrentRoundIdForHost(_host)].status == STATUS_FINISHED); }

  function addOptionForRound (address _host, bytes4 _roundId, bytes32 _option) external {
    require(rounds[_host][_roundId].id != 0); // not 0x0, there bust be a Round
    require(rounds[_host][_roundId].options.hasFlexOptions == true);
    require(rounds[_host][_roundId].status == STATUS_OPEN);
    require(rounds[_host][_roundId].options.optionLookup[_option] == false); // option doesn't exist yet
    
    rounds[_host][_roundId].options.options.push(_option);
    rounds[_host][_roundId].options.optionLookup[_option] = true;
    rounds[_host][_roundId].options.numOptions += 1;
  }

  // always takes newest rounds.
  function pickWinnerAndEnd (uint[] _winners) external payable {
    bytes4 currentId = hostContext[msg.sender].lastRoundId;
    require(currentId != 0x00000000);

    uint status = rounds[msg.sender][currentId].status;
    require(status == STATUS_OPEN || status == STATUS_CLOSED); // Host can either end running or closed Round
    require(_winners.length <= rounds[msg.sender][currentId].options.numOptions);
    require(now < rounds[msg.sender][currentId].config.timeoutAt); // --> cancelInternal when timeoutAt reached? Nahh. move to Closed?
    

    // TODO: redistribute payouts
    //owner.transfer(1%)
    //host.transfer(hostShare)
    // payouts = remaining pool


    hostContext[_host].totalNumBets += rounds[_host][_roundId].stats.numBets;
    hostContext[_host].totalPoolSize += (rounds[_host][_roundId].stats.poolSize + msg.value);
    hostContext[msg.sender].numRoundsSuccess += 1;
    rounds[msg.sender][currentId].status == STATUS_FINISHED;
    emit RoundEnded(msg.sender, currentId);
  }

  function bet (address _host, bytes4 _roundId, bytes32 _optionId) external {
    bytes4 currentId = hostContext[msg.sender].lastRoundId;
    require(currentId == _roundId && currentId != 0x00000000);
    require(rounds[_host][_roundId].status == STATUS_OPEN);
    require(msg.value >= rounds[_host][_roundId].config.minBet);
    require(rounds[_host][_roundId].options.optionLookup[_optionId] == true);
    require(now < rounds[_host][_roundId].config.timeoutAt);
  
    rounds[_host][_roundId].playerBets[msg.sender] += msg.value;
    rounds[_host][_roundId].optionBets[_optionId] += msg.value;
    rounds[_host][_roundId].stats.numBets += 1;
    rounds[_host][_roundId].stats.poolSize += msg.value;
  }

  function claimPayout (address _host, bytes4 _roundId) external {
    bytes4 currentId = hostContext[msg.sender].lastRoundId;
    require(currentId == _roundId && currentId != 0x00000000);
    require(rounds[_host][_roundId].status == STATUS_FINISHED);

    uint payout;
    RoundResults results = rounds[_host][_roundId].results;
    uint all = rounds[_host][_roundId].stats.poolSize;

    // In case host only picked one winner, this is one iteration
    for(uint i=0; i<results.pickedOptions.length; i++) {
      bytes32 pickedOption = results.pickedOptions[i];
      uint playerBet = rounds[_host][_roundId].playerBets[pickedOptions];

      if(playerBet > 0) {
        // e.g. 2 (*1e20)
        uint playerShare = (playerBet*1e20).div(rounds[_host][_roundId].optionBets[pickedOption]);
        // e.g. 70
        uint optionShare = rounds[_host][_roundId].options.payoutTiers[i];

        // playerShare * optionShare = player payout for pickedOptions[i]
        uint share = all.mul(optionShare).div(100).mul(playerShare).div(1e20)
        payout += share;

        // reset player bets so that they can't be claimed again
        rounds[_host][_roundId].playerBets[pickedOptions] = 0;
      }
    }

    require(payout > 0);
    msg.sender.transfer(payout);
  }

  function cancelRound () external {
    bytes4 roundId = hostContext[msg.sender].lastRoundId;
    require(roundId != 0x00000000);
    uint status = rounds[msg.sender][roundId].status
    require(status == STATUS_INACTIVE || status == STATUS_OPEN); // check if round is cancelable

    rounds[msg.sender][roundId].status = STATUS_CANCELLED;
    hostContext[msg.sender].numRoundsCancelled += 1;
    emit RoundCanceled(msg.sender, roundId);
  }



  function registerRecord (
    string _name
  )
    external
    //isNameFree
  {
    reequire(hostNames[_name] == address(0));
    reequire(hostAddresses[msg.sender] == bytes32(0));
    // or if it's not free, make sure it's the same user, just wanting to replace his name
    // check that it's not contract address (?)
    hostAddresses[_name] = msg.sender;
    hostNames[msg.sender] = _name;
  }

  function deleteRecord (
    string _name,
    address _address
  )
    external
  {
    // owner can delete any record and any user can delete his own record
    require(msg.sender == owner || hostAddresses[_name] == msg.sender);

    hostAddresses[_name] = address(0);
    hostNames[_address] = ''; // or empty bytes
  }

  function ()
    external
    payable
  {
    revert(); 
  }
}
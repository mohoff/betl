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
    //bool hasFlexOptions;
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
    uint id;
    Status status;
    bytes32 question;
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
    uint nextRoundId; // == numRoundsCreated
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

  function getRoundId(address _host)
    public
    view
    returns (bytes4)
  {
    return bytes4(keccak256(abi.encodePacked(_host, hostContext[_host].nextRoundId-1)));
  }


  // ADD/TODO/TOTHINK?:
  // - bool _hasMultipleWinners --> rather no. Host has no reason to cheat --> loss of reputation
  // - modeCode usefulness?
  // configData[ timout, minBet, hostShare ]
  // COSTS: 294518 gas -> @ 5Gwei: 1 dollar
  function createRound (
    bytes32 _question,
    bytes32[] _options,
    uint[] _configData,
    uint[] _payoutTiers
    //bool _hasFlexOptions
  )
    external
    payable
  {
    require(_configData[0] >= MIN_TIMEOUT);
    require(_options.length >= 2);// || _hasFlexOptions == true);
    require(_configData[2] <= 100);
    require(_payoutTiers.length <= _options.length);

    uint id = hostContext[msg.sender].nextRoundId;
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

    RoundOptions memory options = RoundOptions(
      _options.length,
      _options,
      _payoutTiers
    );

    RoundResults memory results = RoundResults(
      new bytes32[](0),
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
      options,
      results,
      stats
    );
    
    bytes4 roundId = bytes4(keccak256(abi.encodePacked(msg.sender, id)));
    rounds[msg.sender][roundId] = round;

    // post creation
    hostContext[msg.sender].nextRoundId += 1;
    hostContext[msg.sender].totalPoolSize += msg.value;

    emit RoundCreated(msg.sender, roundId);
  }

  function getRound (address _hostAddress, bytes4 _roundId)
    public
    view // status, createdAt, timeoutAt, question, numOptions, numBets, poolSize
    returns (uint, uint, uint, uint, bytes32, uint, uint, uint)
  {
    uint nextRoundId = hostContext[_hostAddress].nextRoundId;
    require(nextRoundId > 0, 'Host has not created any round yet');
    Round storage round = rounds[_hostAddress][_roundId];
    require(round.status != Status.UNDEFINED, 'Round does not exist');

    return (
      nextRoundId-1,
      uint8(round.status),
      round.config.createdAt,
      round.config.timeoutAt,
      round.question,
      round.options.numOptions,
      round.stats.numBets,
      round.stats.poolSize
    );
  }

  function getRound (bytes32 _hostName, bytes4 _roundId) 
    external
    view // status, createdAt, timeoutAt, question, numOptions, numBets, poolSize
    returns (uint, uint, uint, uint, bytes32, uint, uint, uint)
  {
    require(hostAddresses[_hostName] != address(0), 'Host does not exist');
    return getRound(hostAddresses[_hostName], _roundId);
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

  function getRoundPickedOptionsForHost (address _host) external view returns (bool, bool, bool, bool, bool) { }

  // function addOptionForRound (address _host, bytes4 _roundId, bytes32 _option) external {
  //   //additional check needed to make sure that round exists?
  //   //require(rounds[_host][_roundId] != 0); // not 0x0, there must be a Round
  //   require(rounds[_host][_roundId].options.hasFlexOptions == true);
  //   require(rounds[_host][_roundId].status == Status.OPEN);
  //   require(rounds[_host][_roundId].options.optionLookup[_option] == false); // option doesn't exist yet
    
  //   rounds[_host][_roundId].options.options.push(_option);
  //   rounds[_host][_roundId].options.optionLookup[_option] = true;
  //   rounds[_host][_roundId].options.numOptions += 1;
  // }

  // always takes newest rounds.
  function pickWinnerAndEnd (uint[] _winners) external payable {
    bytes4 roundId = getRoundId(msg.sender);

    Status status = rounds[msg.sender][roundId].status;
    require(status == Status.OPEN || status == Status.CLOSED); // Host can either end running or closed Round
    require(_winners.length <= rounds[msg.sender][roundId].options.numOptions);
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

  function bet (address _host, bytes4 _roundId, bytes32 _optionId) external payable {
    require(_roundId == getRoundId(msg.sender));
    require(rounds[_host][_roundId].status == Status.OPEN);
    require(msg.value >= rounds[_host][_roundId].config.minBet);
    require(rounds[_host][_roundId].options.optionLookup[_optionId] == true);
    require(now < rounds[_host][_roundId].config.timeoutAt);
  
    rounds[_host][_roundId].playerBets[_optionId][msg.sender] += msg.value;
    rounds[_host][_roundId].optionBets[_optionId] += msg.value;
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
    for(uint i=0; i<results.pickedOptions.length; i++) {
      bytes32 pickedOption = results.pickedOptions[i];
      uint playerBet = rounds[_host][_roundId].playerBets[pickedOption][msg.sender];

      if(playerBet > 0) {
        // e.g. 2 (*1e20)
        uint playerShare = (playerBet*1e20).div(rounds[_host][_roundId].optionBets[pickedOption]);
        // e.g. 70
        uint optionShare = rounds[_host][_roundId].options.payoutTiers[i];

        // playerShare * optionShare = player payout for pickedOptions[i]
        uint share = all.mul(optionShare).div(100).mul(playerShare).div(1e20);
        payout += share;

        // reset player bets so that they can't be claimed again
        rounds[_host][_roundId].playerBets[pickedOption][msg.sender] = 0;
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
pragma solidity ^0.5.3;

import './external/Owned.sol';


contract NameRegistry is Owned {

  // both mappings realize a bidirectional lookup
  mapping(bytes32 => address) public addresses;
  mapping(address => bytes32) public names;

  function registerRecord(bytes32 _name)
    public
  {
    require(addresses[_name] == address(0));
    require(names[msg.sender] == bytes32(0));

    _setRecord(msg.sender, _name);
  }

  function deleteRecord()
    public
  {
    bytes32 oldName = names[msg.sender];
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
    address affectedAddress = addresses[_name];
    require(affectedAddress == address(0));

    _removeRecord(affectedAddress, _name);
  }

  function isRegisteredAddress(address _address)
    external
    returns (bool) 
  {
    return names[_address] != bytes32(0);
  }

  function isRegisteredName(bytes32 _name)
    external
    returns (bool) 
  {
    return addresses[_name] != address(0);
  }

  function _setRecord(
    address _address,
    bytes32 _name
  )
    private
  {
    addresses[_name] = _address;
    names[_address] = _name;
  }

  function _removeRecord(
    address _address,
    bytes32 _name
  )
    private
  {
    delete addresses[_name];
    delete names[_address];
  }

  function ()
    external
    payable
  {
    revert();
  }
}
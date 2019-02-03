pragma solidity ^0.5.3;

import './external/Owned.sol';


contract NameRegistry is Owned {

  // realizes a bidirectional lookup
  mapping(bytes32 => address) public addressOf;
  mapping(address => bytes32) public nameOf;

  function addName(bytes32 _name)
    public
  {
    addRecord(msg.sender, _name);
  }

  function removeName()
    public
  {
    removeRecord(msg.sender, nameOf[msg.sender]);
  }

  function updateRecord(bytes32 _newName)
    external
  {
    removeRecord(msg.sender, nameOf[msg.sender]);
    addRecord(msg.sender, _newName);
  }

  function sudoAddName(address _address,bytes32 _name)
    public
  {
    addRecord(_address, _name);
  }

  function sudoDeleteRecord(bytes32 _name)
    external
    onlyOwner
  {
    removeRecord(addressOf[_name], _name);
  }

  function isRegisteredAddress(address _address)
    external
    view
    returns (bool) 
  {
    return nameOf[_address] != bytes32(0);
  }

  function isRegisteredName(bytes32 _name)
    external
    view
    returns (bool) 
  {
    return addressOf[_name] != address(0);
  }

  function addRecord(
    address _address,
    bytes32 _name
  )
    private
  {
    require(addressOf[_name] == address(0), 'Address already exists');
    require(nameOf[_address] == bytes32(0), 'Name already exists');

    addressOf[_name] = _address;
    nameOf[_address] = _name;
  }

  function removeRecord(
    address _address,
    bytes32 _name
  )
    private
  {
    require(nameOf[_address] != bytes32(0), 'Name does not exist');

    delete addressOf[_name];
    delete nameOf[_address];
  }

  function ()
    external
    payable
  {
    revert();
  }
}
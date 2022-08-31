// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC20Token {
    function transfer(address, uint256) external returns (bool);

    function approve(address, uint256) external returns (bool);

    function transferFrom(
        address,
        address,
        uint256
    ) external returns (bool);

    function totalSupply() external view returns (uint256);

    function balanceOf(address) external view returns (uint256);

    function allowance(address, address) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

contract GoFundMeOnCelo is Ownable {
    uint256 internal listLength = 0;

    address internal cUsdTokenAddress =
        0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;
    struct GoFundMe {
        address payable owner;
        string name;
        string image;
        string description;
        string location;
        uint256 amount;
        uint256 balance;
        uint funders;
        bool funded;
        mapping(address => bool) uniqueFunder;
    }
    // GoFundMe[] public goFundMes;
    mapping(uint256 => GoFundMe) goFundMes;

    // keeps track of goFundMes' ids that have been initialized
    mapping(uint => bool) private exists;
    // keeps track of whether a goFundMe has been verified
    mapping(uint => bool) public verified;
    // keeps track of addresses that are admins
    mapping(address => bool) public admins;

    constructor() {
        admins[msg.sender] = true;
    }

    /// @dev checks if goFundMe's goal has been reached
    modifier notYetFunded(uint256 _index) {
        GoFundMe storage goFundMe = goFundMes[_index];
        require(!goFundMe.funded, "Already funded");
        _;
    }
    /// @dev checks if goFundMe with _index exists
    modifier exist(uint _index) {
        require(exists[_index], "Query of nonexistent campaign");
        _;
    }
    /// @dev checks if goFundMe with _index has been verified
    modifier checkVerified(uint _index) {
        require(verified[_index], "Go fund me hasn't been verified yet");
        _;
    }
    /// @dev checks if address is valid
    modifier checkAddress(address _address) {
        require(_address != address(0), "Error: address zero is not valid");
        _;
    }

    /**
     * @dev give admin's privileges to an address
     * @notice callable only by the contract's owner
     */
    function addAdmin(address _admin) public onlyOwner checkAddress(_admin) {
        admins[_admin] = true;
    }

    /**
     * @dev remove admin's privileges to an address
     * @notice callable only by the contract's owner
     */
    function removeAdmin(address _admin) public onlyOwner checkAddress(_admin) {
        admins[_admin] = false;
    }

    /**
     * @dev approves a goFundMe
     * @notice callable only by an admin
     */
    function approveFundMe(uint _index) public exist(_index) {
        require(admins[msg.sender], "You're not an admin");
        verified[_index] = true;
    }

    /**
     * @dev creates a goFundMe
     */
    function createFundMe(
        string calldata _name,
        string calldata _image,
        string calldata _description,
        string calldata _location,
        uint256 _amount
    ) external {
        GoFundMe storage newGoFundMe = goFundMes[listLength];
        exists[listLength] = true;
        verified[listLength] = false;
        listLength++;
        newGoFundMe.owner = payable(msg.sender);
        newGoFundMe.name = _name;
        newGoFundMe.image = _image;
        newGoFundMe.description = _description;
        newGoFundMe.location = _location;
        newGoFundMe.amount = _amount;
        newGoFundMe.balance = _amount;
        newGoFundMe.funded = false;
    }

    function readFundMe(uint256 _index)
        public
        view
        returns (
            address payable,
            string memory,
            string memory,
            string memory,
            string memory,
            uint256,
            bool
        )
    {
        return (
            goFundMes[_index].owner,
            goFundMes[_index].name,
            goFundMes[_index].image,
            goFundMes[_index].description,
            goFundMes[_index].location,
            goFundMes[_index].balance,
            goFundMes[_index].funded
        );
    }

    /**
     * @dev allow users to fund a goFundMe
     * @param _amount is the amount user want to donate
     * @notice goFundMe's owner can't donate to his own campaign
     */
    function fund(uint256 _index, uint256 _amount)
        external
        payable
        exist(_index)
        checkVerified(_index)
        notYetFunded(_index)
    {
        require(
            goFundMes[_index].owner != msg.sender,
            "You can't fund your own campaign"
        );
        GoFundMe storage goFundMe = goFundMes[_index];
        uint newBalance = goFundMe.balance - _amount;
        goFundMe.balance = newBalance;
        if (goFundMe.balance == 0) {
            goFundMe.funded = true;
        }
        if (!goFundMe.uniqueFunder[msg.sender]) {
            goFundMe.funders++;
            goFundMe.uniqueFunder[msg.sender] = true;
        }
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                goFundMes[_index].owner,
                _amount
            ),
            "Transfer failed."
        );
    }

    function getListLength() public view returns (uint256) {
        return (listLength);
    }

    function getFundersLength(uint256 _index)
        public
        view
        exist(_index)
        checkVerified(_index)
        returns (uint256)
    {
        return goFundMes[_index].funders;
    }
}

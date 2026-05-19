// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Arc chain: USDC is the native gas token (18 decimals).
// Payment via msg.value — no ERC20 approve step needed.

contract ArcNames {

    address public owner;
    uint256 public totalRegistrations;

    mapping(string => address) public nameToAddress;
    mapping(address => string) public primaryName;
    mapping(string => address) public nameOwner;
    mapping(string => uint256) public nameExpiry;
    mapping(string => bool)    public nameExists;

    struct DomainInfo {
        string name;
        address owner;
        address resolvedAddress;
        uint256 expiry;
        bool active;
    }

    event NameRegistered(string name, address owner, uint256 expiry, uint256 price);
    event NameRenewed(string name, address owner, uint256 newExpiry);
    event NameTransferred(string name, address from, address to);
    event PrimaryNameSet(address user, string name);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ── Pricing ────────────────────────────────────────────────────────────────
    // Native USDC on Arc uses 18 decimals: 1e18 = $1.00 USDC

    function getPrice(string memory name) public pure returns (uint256) {
        uint256 len = bytes(name).length;
        require(len >= 1, "Name too short");
        if (len == 1) return 100 * 1e18;    // $100.00
        if (len == 2) return 60  * 1e18;    // $60.00
        if (len == 3) return 10  * 1e18;    // $10.00
        if (len == 4) return 2   * 1e18;    // $2.00
        return 1e17;                         // $0.10  (= 0.1 * 1e18)
    }

    // ── Validation ─────────────────────────────────────────────────────────────

    function isValidName(string memory name) public pure returns (bool) {
        bytes memory b = bytes(name);
        if (b.length == 0 || b.length > 32) return false;
        if (b[0] == 0x2D || b[b.length - 1] == 0x2D) return false;

        for (uint256 i = 0; i < b.length; i++) {
            bytes1 ch = b[i];
            bool isLower  = (ch >= 0x61 && ch <= 0x7A);
            bool isDigit  = (ch >= 0x30 && ch <= 0x39);
            bool isHyphen = (ch == 0x2D);
            if (!isLower && !isDigit && !isHyphen) return false;
        }
        return true;
    }

    // ── Register ───────────────────────────────────────────────────────────────

    function register(string memory name, uint256 duration) external payable {
        require(isValidName(name), "Invalid name");
        require(duration >= 1 && duration <= 10, "1-10 duration only");

        bool expired = nameExists[name] && nameExpiry[name] < block.timestamp;
        require(!nameExists[name] || expired, "Name taken");

        uint256 price = getPrice(name) * duration;
        require(msg.value >= price, "Insufficient payment");

        // If this name was previously owned by someone else and was their
        // primary name, clear that stale reference before reassigning.
        address prevOwner = nameOwner[name];
        if (expired && prevOwner != address(0) && prevOwner != msg.sender) {
            if (keccak256(bytes(primaryName[prevOwner])) == keccak256(bytes(name))) {
                primaryName[prevOwner] = "";
            }
        }

        // Effects
        nameToAddress[name] = msg.sender;
        nameOwner[name]     = msg.sender;
        nameExists[name]    = true;
        nameExpiry[name]    = block.timestamp + (duration * 365 days);
        totalRegistrations++;

        if (bytes(primaryName[msg.sender]).length == 0) {
            primaryName[msg.sender] = name;
        }

        // Interactions — refund overpayment last (CEI pattern)
        if (msg.value > price) {
            (bool ok, ) = msg.sender.call{value: msg.value - price}("");
            require(ok, "Refund failed");
        }

        emit NameRegistered(name, msg.sender, nameExpiry[name], price);
    }

    // ── Renew ──────────────────────────────────────────────────────────────────

    function renew(string memory name, uint256 duration) external payable {
        require(nameExists[name], "Name does not exist");
        require(nameOwner[name] == msg.sender, "Not owner");
        require(duration >= 1 && duration <= 10, "1-10 duration only");

        uint256 price = getPrice(name) * duration;
        require(msg.value >= price, "Insufficient payment");

        // Extend from current expiry if still active, else from now
        if (nameExpiry[name] >= block.timestamp) {
            nameExpiry[name] += duration * 365 days;
        } else {
            nameExpiry[name] = block.timestamp + (duration * 365 days);
        }

        if (msg.value > price) {
            (bool ok, ) = msg.sender.call{value: msg.value - price}("");
            require(ok, "Refund failed");
        }

        emit NameRenewed(name, msg.sender, nameExpiry[name]);
    }

    // ── Transfer ───────────────────────────────────────────────────────────────

    function transferName(string memory name, address to) external {
        require(nameOwner[name] == msg.sender, "Not owner");
        require(to != address(0), "Zero address");
        require(nameExpiry[name] > block.timestamp, "Name expired");

        nameOwner[name]     = to;
        nameToAddress[name] = to;

        if (keccak256(bytes(primaryName[msg.sender])) == keccak256(bytes(name))) {
            primaryName[msg.sender] = "";
        }

        emit NameTransferred(name, msg.sender, to);
    }

    // ── Set Primary ────────────────────────────────────────────────────────────

    function setPrimaryName(string memory name) external {
        require(nameOwner[name] == msg.sender, "Not owner");
        require(nameExpiry[name] > block.timestamp, "Name expired");
        primaryName[msg.sender] = name;
        emit PrimaryNameSet(msg.sender, name);
    }

    // ── Resolve ────────────────────────────────────────────────────────────────

    function resolve(string memory name) external view returns (address) {
        require(nameExists[name], "Name not found");
        require(nameExpiry[name] > block.timestamp, "Name expired");
        return nameToAddress[name];
    }

    function reverseLookup(address wallet) external view returns (string memory) {
        return primaryName[wallet];
    }

    function getDomainInfo(string memory name) external view returns (DomainInfo memory) {
        return DomainInfo({
            name:            name,
            owner:           nameOwner[name],
            resolvedAddress: nameToAddress[name],
            expiry:          nameExpiry[name],
            active:          nameExists[name] && nameExpiry[name] > block.timestamp
        });
    }

    function isAvailable(string memory name) external view returns (bool) {
        if (!nameExists[name]) return true;
        if (nameExpiry[name] < block.timestamp) return true;
        return false;
    }

    // ── Migration ──────────────────────────────────────────────────────────────
    // If contract is redeployed, owner can import old registrations from the
    // previous contract so users do not lose their names.

    bool public migrationOpen = true;

    function closeMigration() external onlyOwner {
        migrationOpen = false;
    }

    function importName(
        string memory name,
        address _owner,
        uint256 expiry
    ) external onlyOwner {
        require(migrationOpen, "Migration closed");
        require(isValidName(name), "Invalid name");
        require(expiry > block.timestamp, "Already expired");
        require(!nameExists[name], "Name already exists");

        nameToAddress[name] = _owner;
        nameOwner[name]     = _owner;
        nameExists[name]    = true;
        nameExpiry[name]    = expiry;
        totalRegistrations++;

        if (bytes(primaryName[_owner]).length == 0) {
            primaryName[_owner] = name;
        }
    }

    // Batch import — saves gas when migrating many names at once
    function importNames(
        string[] calldata names,
        address[] calldata owners,
        uint256[] calldata expiries
    ) external onlyOwner {
        require(migrationOpen, "Migration closed");
        require(
            names.length == owners.length && names.length == expiries.length,
            "Array length mismatch"
        );
        for (uint256 i = 0; i < names.length; i++) {
            if (
                isValidName(names[i]) &&
                expiries[i] > block.timestamp &&
                !nameExists[names[i]]
            ) {
                nameToAddress[names[i]] = owners[i];
                nameOwner[names[i]]     = owners[i];
                nameExists[names[i]]    = true;
                nameExpiry[names[i]]    = expiries[i];
                totalRegistrations++;

                if (bytes(primaryName[owners[i]]).length == 0) {
                    primaryName[owners[i]] = names[i];
                }
            }
        }
    }

    // ── Admin ──────────────────────────────────────────────────────────────────

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function withdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        (bool ok, ) = owner.call{value: amount}("");
        require(ok, "Withdraw failed");
    }

    function withdrawAll() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "Nothing to withdraw");
        (bool ok, ) = owner.call{value: balance}("");
        require(ok, "Withdraw failed");
    }

    receive() external payable {}
}

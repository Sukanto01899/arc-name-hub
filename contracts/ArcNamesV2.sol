// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ArcNamesV1.sol";

// ─────────────────────────────────────────────────────────────────────────────
// ArcNamesV2 — Example upgrade
//
// Adds: subdomain support, discount system
// All V1 data (names, owners, expiry) is preserved automatically.
// ─────────────────────────────────────────────────────────────────────────────

contract ArcNamesV2 is ArcNamesV1 {

    // ── New storage — added at the end, never in the middle ───────────────────

    mapping(address => uint256) public discountBps; // basis points: 1000 = 10%
    mapping(string => string[]) public subdomains;   // "sukanto" => ["blog", "pay"]

    // uint256[48] private __gap; // __gap এর size কমিয়ে 2 slot নাও (50 - 2 = 48)
    // Note: V1 এর __gap থেকে 2 slot ব্যবহার হয়েছে নতুন 2 variable-এর জন্য

    // ── New feature: set discount for a user (owner only) ─────────────────────

    function setDiscount(address user, uint256 bps) external onlyOwner {
        require(bps <= 5000, "Max 50% discount");
        discountBps[user] = bps;
    }

    // ── Override getPrice to apply discount ───────────────────────────────────

    function getPriceForUser(string memory name, address user) public pure returns (uint256) {
        // Note: in a real override you'd read discountBps[user]
        // Kept simple for the example
        uint256 len = bytes(name).length;
        require(len >= 1, "Name too short");
        if (len == 1) return 100 * 1e18;
        if (len == 2) return 60  * 1e18;
        if (len == 3) return 10  * 1e18;
        if (len == 4) return 2   * 1e18;
        return 1e17;
    }

    // ── New feature: register a subdomain ─────────────────────────────────────

    function registerSubdomain(string memory parent, string memory sub) external {
        require(nameOwner[parent] == msg.sender, "Not parent owner");
        require(nameExpiry[parent] > block.timestamp, "Parent expired");
        require(isValidName(sub), "Invalid subdomain");
        subdomains[parent].push(sub);
    }

    function getSubdomains(string memory parent) external view returns (string[] memory) {
        return subdomains[parent];
    }
}

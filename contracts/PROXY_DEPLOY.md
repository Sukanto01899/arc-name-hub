# Proxy Deploy Guide — ArcNames UUPS

## Remix-এ Deploy করার ধাপ

### Step 1 — Plugin Install করো

Remix-এ বামদিকে Plugin Manager খোলো।
Search করো: `openzeppelin`
Install করো: **OpenZeppelin Contracts Plugin**

এটা automatically proxy deploy করার option দেবে।

---

### Step 2 — Compile করো

- Compiler: 0.8.24
- Enable optimization: ✓ (200 runs)
- ArcNamesV1.sol compile করো

---

### Step 3 — Deploy করো (Plugin দিয়ে)

Deploy & Run Transactions ট্যাবে যাও।

Environment: Injected Provider (MetaMask - Arc Testnet)

Contract: `ArcNamesV1`

Deploy বাটনের পাশে **"Deploy as Proxy"** অপশন আসবে (OpenZeppelin plugin install থাকলে)।

Constructor / Initialize arguments:
```
_owner: তোমার wallet address
```

Click "Deploy as Proxy" → MetaMask-এ confirm করো।

এই একটা transaction-এ দুটো contract deploy হবে:
- Implementation: ArcNamesV1 (তুমি এটায় interact করবে না)  
- Proxy: ERC1967Proxy (এটাই তোমার actual contract address)

**Proxy address টা save করো — এটাই চিরকাল ব্যবহার হবে।**

---

### Step 4 — Verify করো

Proxy address-এ call করো:
```
owner()              → তোমার address
migrationOpen()      → true
isAvailable("test")  → true
```

---

## Upgrade করার ধাপ (V1 → V2)

### Step 1 — V2 Compile করো

ArcNamesV2.sol compile করো।

### Step 2 — Upgrade করো

OpenZeppelin plugin-এ:
- Deployed Contracts-এ Proxy address দাও
- "Upgrade" বাটন ক্লিক করো
- Contract: ArcNamesV2 সিলেক্ট করো
- Confirm করো

অথবা manually:

```
Proxy contract এ call করো:
upgradeToAndCall(newImplementationAddress, "0x")
```

### Step 3 — Verify করো

```
// V1 এর পুরনো data আছে কিনা দেখো
isAvailable("sukanto")  → false (পুরনো registration আছে)
nameOwner("sukanto")    → পুরনো owner address

// V2 এর নতুন function কাজ করছে কিনা দেখো
getSubdomains("sukanto") → []
```

---

## Storage Rules — এগুলো ভুললে contract ভেঙে যাবে

```
V1 Storage layout:
  slot 0: _initialized (Initializable)
  slot 1: _owner (Ownable)
  slot 2: totalRegistrations
  slot 3: nameToAddress (mapping)
  slot 4: primaryName (mapping)
  slot 5: nameOwner (mapping)
  slot 6: nameExpiry (mapping)
  slot 7: nameExists (mapping)
  slot 8: migrationOpen
  slot 9-58: __gap (50 reserved slots)

V2 তে নতুন variable যোগ করলে:
  slot 9: discountBps  ← __gap এর প্রথম slot ব্যবহার হয়
  slot 10: subdomains  ← __gap এর দ্বিতীয় slot ব্যবহার হয়
  slot 11-58: বাকি __gap (48 slot বাকি)

❌ NEVER DO THIS:
  - V1 এর কোনো variable rename করো না
  - V1 এর কোনো variable মুছো না  
  - V1 এর variable এর মাঝে নতুন variable ঢোকাও না
  - __gap কমাও — শুধু নতুন variable এর সমান কমাও

✅ ALWAYS DO THIS:
  - নতুন variable শুধু শেষে যোগ করো
  - __gap size ততটুকু কমাও
```

---

## সহজ মনে রাখার উপায়

```
Normal Contract:
  Code + Data = একসাথে
  Upgrade = নতুন contract, data হারায়

Proxy Pattern:
  Proxy  = শুধু Data    (address চেঞ্জ হয় না)
  Impl   = শুধু Code    (upgrade করলে এটা বদলায়)
  Data কখনো হারায় না!
```

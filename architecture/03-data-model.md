&#x09;								**Data Architecture**



**# Data Model**



**\*\*Document Version:\*\* 1.0**



**\*\*Status:\*\* Approved**



**\*\*Owner:\*\* Founder \& CTO**



**---**



**# Purpose**



**This document defines the core data entities of the ApingX platform and the relationships between them.**



**It is technology-agnostic and serves as the blueprint for database design and API development.**



**---**



**# Design Principles**



**- Collections are the centre of the platform.**

**- Every entity exists to support a Collection.**

**- Immutable data belongs on-chain.**

**- Mutable business data belongs off-chain.**

**- Relationships should remain simple and predictable.**



**---**



**# Entity Relationship Diagram**



**```**

**Collection**

**│**

**├── Products**

**├── Credentials**

**├── Contributors**

**├── Story**

**├── Orders**

**├── Reward Distributions**

**└── Collection Charter**



**Customer**

**│**

**├── Orders**

**├── Credentials (optional)**

**└── Wallet**



**Credential**

**│**

**├── Owner**

**├── Collection**

**└── Reward Allocation**



**Contributor**

**│**

**└── Collections**



**Order**

**│**

**├── Customer**

**├── Product**

**└── Collection**

**```**



**---**



**# Core Entities**



**---**



**## Collection**



**Represents a published fashion collection.**



**Attributes**



**- ID**

**- Collection Number**

**- Name**

**- Slug**

**- Description**

**- Theme**

**- Status**

**- Publication Date**

**- Edition Size**

**- Story ID**

**- Charter ID**



**Relationships**



**- Has many Products**

**- Has many Credentials**

**- Has many Contributors**

**- Has many Orders**

**- Has many Reward Distributions**

**- Has one Story**

**- Has one Charter**



**---**



**## Product**



**Represents a physical product.**



**Attributes**



**- ID**

**- Collection ID**

**- Name**

**- Category**

**- SKU**

**- Price**

**- Quantity**

**- Status**



**Relationships**



**- Belongs to one Collection**

**- Appears in many Orders**



**---**



**## Credential**



**Represents permanent participation within a Collection.**



**Attributes**



**- ID**

**- Collection ID**

**- Owner**

**- Credential Type**

**- Reward Allocation**

**- Mint Address**

**- Issue Date**

**- Status**



**Relationships**



**- Belongs to one Collection**

**- Belongs to one Owner**



**---**



**## Contributor**



**Represents a recognised creator or participant.**



**Attributes**



**- ID**

**- Display Name**

**- Role**

**- Biography**

**- Wallet Address**

**- Social Links**



**Relationships**



**- Can belong to many Collections**



**---**



**## Story**



**Represents the editorial content of a Collection.**



**Attributes**



**- ID**

**- Collection ID**

**- Title**

**- Description**

**- Essay**

**- Media Assets**



**Relationships**



**- Belongs to one Collection**



**---**



**## Collection Charter**



**Represents the immutable constitutional record.**



**Attributes**



**- ID**

**- Collection ID**

**- Publication Date**

**- Edition Size**

**- Credential Types**

**- Reward Allocations**

**- Contributors**



**Relationships**



**- Belongs to one Collection**



**---**



**## Customer**



**Represents a platform user.**



**Attributes**



**- ID**

**- Name**

**- Email**

**- Wallet Address**

**- Account Status**



**Relationships**



**- Has many Orders**

**- May own Credentials**



**---**



**## Order**



**Represents a completed purchase.**



**Attributes**



**- ID**

**- Customer ID**

**- Product ID**

**- Collection ID**

**- Quantity**

**- Total Price**

**- Payment Method**

**- Order Date**



**Relationships**



**- Belongs to one Customer**

**- Belongs to one Product**

**- Belongs to one Collection**



**---**



**## Reward Distribution**



**Represents a royalty payment event.**



**Attributes**



**- ID**

**- Collection ID**

**- Distribution Date**

**- Revenue**

**- Amount Distributed**



**Relationships**



**- Belongs to one Collection**



**---**



**# Relationship Rules**



**A Collection:**



**- owns many Products**

**- owns many Credentials**

**- owns many Contributors**

**- owns many Orders**

**- owns one Story**

**- owns one Charter**



**A Product:**



**- belongs to one Collection**



**A Credential:**



**- belongs to one Collection**

**- has one Owner**



**A Customer:**



**- can place many Orders**

**- may own multiple Credentials**



**A Contributor:**



**- can contribute to multiple Collections**



**---**



**# On-Chain Data**



**Stored on Solana**



**- Credential Ownership**

**- Reward Allocation**

**- Mint Address**

**- Provenance**

**- Transfer History**



**---**



**# Off-Chain Data**



**Stored in PostgreSQL**



**- Collections**

**- Products**

**- Stories**

**- Customers**

**- Orders**

**- Contributors**

**- Inventory**

**- Reward History**

**- Media**



**---**



**# Future Entities**



**The following are intentionally excluded from Version One but the model should allow them later.**



**- Collection Timeline**

**- Digital Garment Identity**

**- Marketplace Listings**

**- Auctions**

**- Community Profiles**

**- Exhibitions**

**- AI Recommendations**



**---**



**# Success Criteria**



**The data model succeeds if:**



**- Every Collection can be fully represented.**

**- Relationships remain simple.**

**- On-chain and off-chain responsibilities are clearly separated.**

**- Future expansion requires minimal structural change.**



**# Data Model**



**\*\*Document Version:\*\* 1.0**



**\*\*Status:\*\* Approved**



**\*\*Owner:\*\* Founder \& CTO**



**---**



**# Purpose**



**This document defines the core data entities of the ApingX platform and the relationships between them.**



**It is technology-agnostic and serves as the blueprint for database design and API development.**



**---**



**# Design Principles**



**- Collections are the centre of the platform.**

**- Every entity exists to support a Collection.**

**- Immutable data belongs on-chain.**

**- Mutable business data belongs off-chain.**

**- Relationships should remain simple and predictable.**



**---**



**# Entity Relationship Diagram**



**```**

**Collection**

**│**

**├── Products**

**├── Credentials**

**├── Contributors**

**├── Story**

**├── Orders**

**├── Reward Distributions**

**└── Collection Charter**



**Customer**

**│**

**├── Orders**

**├── Credentials (optional)**

**└── Wallet**



**Credential**

**│**

**├── Owner**

**├── Collection**

**└── Reward Allocation**



**Contributor**

**│**

**└── Collections**



**Order**

**│**

**├── Customer**

**├── Product**

**└── Collection**

**```**



**---**



**# Core Entities**



**---**



**## Collection**



**Represents a published fashion collection.**



**Attributes**



**- ID**

**- Collection Number**

**- Name**

**- Slug**

**- Description**

**- Theme**

**- Status**

**- Publication Date**

**- Edition Size**

**- Story ID**

**- Charter ID**



**Relationships**



**- Has many Products**

**- Has many Credentials**

**- Has many Contributors**

**- Has many Orders**

**- Has many Reward Distributions**

**- Has one Story**

**- Has one Charter**



**---**



**## Product**



**Represents a physical product.**



**Attributes**



**- ID**

**- Collection ID**

**- Name**

**- Category**

**- SKU**

**- Price**

**- Quantity**

**- Status**



**Relationships**



**- Belongs to one Collection**

**- Appears in many Orders**



**---**



**## Credential**



**Represents permanent participation within a Collection.**



**Attributes**



**- ID**

**- Collection ID**

**- Owner**

**- Credential Type**

**- Reward Allocation**

**- Mint Address**

**- Issue Date**

**- Status**



**Relationships**



**- Belongs to one Collection**

**- Belongs to one Owner**



**---**



**## Contributor**



**Represents a recognised creator or participant.**



**Attributes**



**- ID**

**- Display Name**

**- Role**

**- Biography**

**- Wallet Address**

**- Social Links**



**Relationships**



**- Can belong to many Collections**



**---**



**## Story**



**Represents the editorial content of a Collection.**



**Attributes**



**- ID**

**- Collection ID**

**- Title**

**- Description**

**- Essay**

**- Media Assets**



**Relationships**



**- Belongs to one Collection**



**---**



**## Collection Charter**



**Represents the immutable constitutional record.**



**Attributes**



**- ID**

**- Collection ID**

**- Publication Date**

**- Edition Size**

**- Credential Types**

**- Reward Allocations**

**- Contributors**



**Relationships**



**- Belongs to one Collection**



**---**



**## Customer**



**Represents a platform user.**



**Attributes**



**- ID**

**- Name**

**- Email**

**- Wallet Address**

**- Account Status**



**Relationships**



**- Has many Orders**

**- May own Credentials**



**---**



**## Order**



**Represents a completed purchase.**



**Attributes**



**- ID**

**- Customer ID**

**- Product ID**

**- Collection ID**

**- Quantity**

**- Total Price**

**- Payment Method**

**- Order Date**



**Relationships**



**- Belongs to one Customer**

**- Belongs to one Product**

**- Belongs to one Collection**



**---**



**## Reward Distribution**



**Represents a royalty payment event.**



**Attributes**



**- ID**

**- Collection ID**

**- Distribution Date**

**- Revenue**

**- Amount Distributed**



**Relationships**



**- Belongs to one Collection**



**---**



**# Relationship Rules**



**A Collection:**



**- owns many Products**

**- owns many Credentials**

**- owns many Contributors**

**- owns many Orders**

**- owns one Story**

**- owns one Charter**



**A Product:**



**- belongs to one Collection**



**A Credential:**



**- belongs to one Collection**

**- has one Owner**



**A Customer:**



**- can place many Orders**

**- may own multiple Credentials**



**A Contributor:**



**- can contribute to multiple Collections**



**---**



**# On-Chain Data**



**Stored on Solana**



**- Credential Ownership**

**- Reward Allocation**

**- Mint Address**

**- Provenance**

**- Transfer History**



**---**



**# Off-Chain Data**



**Stored in PostgreSQL**



**- Collections**

**- Products**

**- Stories**

**- Customers**

**- Orders**

**- Contributors**

**- Inventory**

**- Reward History**

**- Media**



**---**



**# Future Entities**



**The following are intentionally excluded from Version One but the model should allow them later.**



**- Collection Timeline**

**- Digital Garment Identity**

**- Marketplace Listings**

**- Auctions**

**- Community Profiles**

**- Exhibitions**

**- AI Recommendations**



**---**



**# Success Criteria**



**The data model succeeds if:**



**- Every Collection can be fully represented.**

**- Relationships remain simple.**

**- On-chain and off-chain responsibilities are clearly separated.**

**- Future expansion requires minimal structural change.**


Core Technical Architecture: Offline-First & Sync
The single biggest infrastructure challenge in Nepal is intermittent internet connectivity and power outages. Wholesalers often operate in areas with unstable networks or manage field sales agents who cannot stay online. 

Local-First Database: Build the application using a local database (e.g., SQLite, Realm, or PouchDB) on the device. All transactions (billing, stock entry) must happen locally first.
Background Synchronization: Implement a robust sync engine that automatically pushes data to the cloud when connectivity is restored. It must handle conflict resolution (e.g., if stock was updated on two different devices while offline) without data loss.
Power Resilience: Ensure the software is lightweight enough to run on older hardware and includes auto-save features to prevent data loss during sudden power cuts.

offline first inventory software architecture

View all
Mandatory Compliance: IRD & CBMS Integration
In Nepal, software is not just a tool; it is a legal requirement for VAT-registered businesses. Failure to comply results in heavy fines (up to NPR 500,000) and rejected invoices. 

CBMS API Integration: You must integrate directly with the Inland Revenue Department’s Central Billing Management System (CBMS).  The software needs to push invoice data in real-time or batch mode as per the latest directives.
Audit Trails: The system must maintain an immutable log of every action. Hard deletes are forbidden; any correction must be a "credit note" or a logged edit showing who, when, and why. 
Fiscal Year Logic: Nepal’s fiscal year runs from Shrawan to Ashadh. Your invoice numbering must automatically reset every mid-July and support the Bikram Sambat (BS) calendar alongside AD.
VAT Reports: Pre-generate specific IRD forms (e.g., VAT 305, 306, 308) and ensure digital payment tracking for the 10% VAT rebate on QR/Card transactions. 

Nepal IRD e-billing API documentation

View all
Essential Feature Set for Wholesalers
General inventory features are insufficient. Nepali wholesalers deal with complex pricing and supply chain fragmentation. 

Multi-Rate & Party Management: A single product often has 5+ different prices depending on the customer (e.g., "Gold Customer" vs. "Cash Customer"). The system must allow instant price selection during billing without manual calculation.
Credit (Udhaar) Tracking: Credit management is central to Nepali business. The dashboard must prominently display "Party Due" limits and aging reports. Allow partial payments and "Khata" style ledger views.
Expiry & Batch Tracking: Critical for FMCG and Pharma. The system should alert users before stock expires and support "First-Expiry-First-Out" (FEFO) picking. 
Low-Bandwidth Media: If using product images, ensure they are heavily compressed. Wholesalers manage thousands of SKUs; heavy images will slow down the billing screen on local networks.




wholesaler inventory challenges Nepal

View all
User Experience (UX) & Onboarding Strategy
The biggest barrier to adoption is the fear of technology among older business owners and staff. Your onboarding must be "zero-training."

Nepali Language Interface: Do not just translate menus; translate the workflow. Error messages, invoices, and reports must be available in fluent Nepali. English-only interfaces are a non-starter for many warehouse staff. 
Phased Onboarding: Do not force users to input all data at once.
Day 1: Enable only Billing and Stock View. Let them sell.
Day 3: Prompt for Supplier details.
Day 7: Introduce Reporting and Reordering.
WhatsApp Integration: Use WhatsApp for OTPs, invoice sharing, and low-stock alerts. It is the most trusted and used app in Nepal, offering higher engagement than email or SMS.
Video-First Support: Instead of text manuals, embed short (30-second) Nepali video tutorials directly in the app for tasks like "How to return an item" or "How to add a customer."

inventory software tutorial Nepali language

View all
Summary of Critical Requirements
Feature Category	Critical Requirement for Nepal	Why It Matters
Connectivity	Offline-First Architecture	Internet cuts out frequently; business cannot stop.
Compliance	IRD/CBMS Auto-Sync	Mandatory by law; fines for non-compliance are severe. 
Calendar	Bikram Sambat (BS) Support	All local business, taxes, and fiscal years follow BS.
Language	Full Nepali Localization	Staff often lack English proficiency; reduces training time.
Billing	Multi-Rate Price Lists	Wholesale pricing is dynamic and relationship-based. 
Payments	Fonepay/QR Integration	Digital payments are surging; required for VAT rebates. 



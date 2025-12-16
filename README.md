# Backend-Focused E-Commerce System

## Project Overview

This project is a backend-focused e-commerce system. The primary focus is not basic CRUD operations, but critical backend concerns such as transaction management, stock consistency, order lifecycle handling, and real-world edge-case scenarios. The system is designed to behave predictably and safely under inconsistent data and concurrent operations.

## Tech Stack

The project is built using the following technologies:

- Node.js with TypeScript
- NestJS for a modular backend architecture
- Prisma ORM for type-safe data access and transaction management
- PostgreSQL (via Prisma)
- DTOs and class-validator for input validation and constraints

## Architecture and Domain Design

The backend follows a modular architecture. Core domains are separated based on business responsibilities:

- User
- Vendor
- Product
- ProductVariant
- Order
- StockLog

Each domain is responsible for its own business logic. Vendor-based authorization and soft delete (`deletedAt`) checks are consistently enforced across all critical workflows.

## Product and Variant Management

Product and ProductVariant entities are modeled according to business rules. A clear distinction is made between SIMPLE products and products with variants.

Rules regarding when `stock` and `price` fields are required, optional, or allowed to be null/undefined are explicitly defined at the backend level.

Vendor validation and access control are applied before every product and variant operation.

## Order Creation Flow

The order creation process is implemented within a Prisma transaction. The transaction scope includes:

- User validation
- Product and ProductVariant validation
- Normalization of order items
- Full rollback in case of missing, invalid, or inconsistent data

Scenarios such as invalid products, missing prices, or inconsistent variant data result in the entire order creation being aborted.

## Stock Management and StockLog

Stock deduction is handled atomically as part of the order creation flow. A dedicated StockLog module has been implemented to track stock movements.

The StockLog structure includes:

- Product- or Variant-based records
- Quantity information
- Operation type (e.g. ORDER, CANCEL)

This design enables traceable stock changes and helps minimize overselling risks.

## Business Logic and Backend Decisions

Transaction ordering and stock deduction points are deliberately designed to mitigate overselling risks. Special attention has been given to concurrency, race conditions, and data consistency.

Business rules define how the order flow behaves when critical data such as price, stock, or variant information is missing or ambiguous.

While queue systems or Redis are not yet integrated, the architecture has been structured to allow future integration without major refactoring.

## Development Approach

Domain modeling and workflow design were prioritized before implementation. Instead of focusing on basic CRUD operations, real-world failure scenarios were intentionally addressed first.

The codebase emphasizes clear error handling, meaningful exceptions, and consistent control flow.

## Current Status

Core domains and the order–stock relationship are actively implemented. Order creation and stock logging logic are in place. The project provides a solid foundation for future steps such as payment integration and background processing.

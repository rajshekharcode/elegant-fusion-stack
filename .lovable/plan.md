

## Plan: Add More Blood Stock Sample Data

### Current State
The database currently has 5 blood stock entries:
- A- (12 units, Low Stock)
- AB- (6 units, Critical)
- AB+ (22 units, Available)
- B+ (38 units, Available)
- O- (15 units, Low Stock)

### Missing Blood Groups
The following blood groups are missing and will be added:
- **A+** - Most common blood type
- **B-** - Rare blood type
- **O+** - Universal donor for red cells

### Data to Insert
| Blood Group | Units | Status | Expiry Date | Location |
|-------------|-------|--------|-------------|----------|
| A+ | 45 | Available | 2025-09-25 | Main Storage |
| B- | 8 | Critical | 2025-09-08 | Main Storage |
| O+ | 52 | Available | 2025-09-22 | Main Storage |

### Implementation
A single database INSERT statement will add all three new blood stock records with appropriate:
- Unit quantities matching their status
- Future expiry dates
- Main Storage location (matching existing records)


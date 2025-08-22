# Demo Company Access Instructions

## How to Access the Demo Company

The cap table application now includes a fully functional demo company called **Example LLC** with realistic sample data.

### Demo Login Credentials
- **Email**: `demo@example.com`
- **Password**: `hello`

### Alternative Test Account
- **Email**: `work@me.com` (if needed)
- **Password**: `hello`
- **Note**: Use demo@example.com for testing - it has complete sample data

### What's Included in the Demo
- **Company**: Example LLC (Delaware C-Corp)
- **Stakeholders**: 
  - Alice Founder (CEO & Co-Founder) - 3,000,000 shares
  - Bob Founder (CTO & Co-Founder) - 2,000,000 shares
- **Security Class**: Common Stock
- **Total Shares**: 5,000,000 shares issued
- **Demo Flag**: Clearly marked as demo company in the UI

### Database Verification
The demo company is fully seeded in the PostgreSQL database with:
- Company record with `is_demo = true`
- 2 stakeholder records (Alice and Bob)
- 1 security class (Common Stock)
- 2 share ledger entries with proper share allocations
- Audit log entry marking successful demo seeding

### Technical Implementation
- Database integration: ✅ Complete
- Storage system loading: ✅ Fixed
- Authentication system: ✅ Working
- Frontend display: ✅ Should show demo banner and Example LLC

### Usage
1. Navigate to the application
2. Sign in with the demo credentials above
3. You should see "Example LLC" in your companies list
4. The company will be marked as a demo company
5. You can explore all cap table features with this realistic sample data

### Troubleshooting
If you don't see the demo company:
1. Verify you're logged in as `demo@example.com`
2. Check that the page shows your companies list
3. Look for "Example LLC" with demo badge/indicator
4. The application loads companies from the database into memory on startup

The demo system provides a complete, working example of a cap table with realistic founder equity distribution for testing and demonstration purposes.
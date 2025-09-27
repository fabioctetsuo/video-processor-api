# Branch Protection Rules

This document explains how to configure GitHub branch protection rules to ensure the PR validation workflow is enforced before merging.

## 🛡️ Required Branch Protection Settings

### Step 1: Access Branch Protection Rules
1. Go to your GitHub repository
2. Click on **Settings** tab
3. Click on **Branches** in the left sidebar
4. Click **Add rule** or edit existing rule for your main branch

### Step 2: Configure Protection Rule

#### Basic Settings
- **Branch name pattern**: `main` (or `master`/`develop` depending on your setup)
- ✅ **Require a pull request before merging**
  - ✅ **Require approvals**: 1 (recommended minimum)
  - ✅ **Dismiss stale PR approvals when new commits are pushed**
  - ✅ **Require review from code owners** (if you have CODEOWNERS file)

#### Status Checks
- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**
- **Required status checks** (select all of these):
  - `Lint & TypeScript`
  - `Unit Tests`
  - `BDD Tests (Real Database)`
  - `Security & Dependencies`
  - `Build Verification`
  - `All Checks Passed`

#### Additional Restrictions
- ✅ **Restrict pushes that create files**
- ✅ **Require signed commits** (optional but recommended)
- ✅ **Include administrators** (applies rules to admin users too)
- ✅ **Allow force pushes** → ❌ **Disabled** (recommended)
- ✅ **Allow deletions** → ❌ **Disabled** (recommended)

## 🚦 Workflow Status Checks

The PR validation workflow includes the following required checks:

### 1. **Lint & TypeScript** 
- Runs ESLint for code quality
- Validates TypeScript compilation
- **Duration**: ~2-3 minutes
- **Timeout**: 10 minutes

### 2. **Unit Tests**
- Executes all unit tests
- Generates coverage reports
- Uploads coverage artifacts
- **Duration**: ~5-8 minutes
- **Timeout**: 15 minutes

### 3. **BDD Tests (Real Database)**
- Runs full integration tests with PostgreSQL
- Tests real database operations
- Validates end-to-end functionality
- **Duration**: ~8-12 minutes
- **Timeout**: 20 minutes

### 4. **Security & Dependencies**
- Runs `npm audit` for security vulnerabilities
- Checks for outdated packages
- **Duration**: ~1-2 minutes
- **Timeout**: 10 minutes

### 5. **Build Verification**
- Builds the application
- Verifies build artifacts
- **Duration**: ~3-5 minutes
- **Timeout**: 15 minutes

### 6. **All Checks Passed**
- Final validation that all jobs succeeded
- Provides summary of results
- **Duration**: <1 minute

## ⚙️ Configuration Examples

### Example 1: Strict Protection (Recommended for Production)
```yaml
# Require PR with 2 approvals
# All status checks must pass
# No force pushes allowed
# Include administrators
```

### Example 2: Development Branch Protection
```yaml
# Require PR with 1 approval
# All status checks must pass
# Allow force pushes for feature branches
# Exclude administrators for development flexibility
```

## 🔄 Workflow Triggers

The workflow runs on:
- ✅ **Pull Request opened**
- ✅ **New commits pushed to PR**
- ✅ **PR reopened**
- ✅ **PR marked as ready for review**

Target branches:
- `main`
- `master` 
- `develop`

## 📊 Monitoring and Reports

### Artifacts Generated
- **Unit test coverage** (7-day retention)
- **BDD test reports** (7-day retention)
- **Cucumber HTML reports**
- **JSON test results**

### Notifications
- ✅ **Slack/Teams integration** (configure in repository settings)
- ✅ **Email notifications** to PR author and reviewers
- ✅ **GitHub status checks** in PR interface

## 🛠️ Troubleshooting

### Common Issues

#### 1. BDD Tests Failing
```bash
# Check database connection
# Verify PostgreSQL service is running
# Ensure environment variables are set correctly
```

#### 2. Build Failures
```bash
# Check TypeScript compilation errors
# Verify all dependencies are installed
# Review build logs in Actions tab
```

#### 3. Lint Errors
```bash
# Run locally: npm run lint
# Fix auto-fixable issues: npm run lint:fix
# Check ESLint configuration
```

### Quick Fixes
```bash
# Run all checks locally before pushing
npm run lint
npm run build
npm run test:unit
npm run test:bdd

# Fix common issues
npm run lint:fix
npm audit fix
```

## 📋 Checklist for Repository Setup

- [ ] Create `.github/workflows/pr-validation.yml`
- [ ] Configure branch protection rules
- [ ] Test workflow with a sample PR
- [ ] Set up required status checks
- [ ] Configure team notifications
- [ ] Add CODEOWNERS file (optional)
- [ ] Test all validation steps
- [ ] Document any custom requirements

## 🚀 Best Practices

1. **Run tests locally** before creating PR
2. **Keep PRs small** for faster review and validation
3. **Write descriptive commit messages**
4. **Update tests** when adding new features
5. **Monitor workflow execution time** and optimize if needed
6. **Regular dependency updates** to avoid security issues

## 📞 Support

If you encounter issues with the validation workflow:

1. **Check workflow logs** in the Actions tab
2. **Review failed status checks** in the PR
3. **Run commands locally** to reproduce issues
4. **Update dependencies** if needed
5. **Contact the development team** for assistance

---

**Note**: These settings ensure that only thoroughly tested and validated code is merged into protected branches, maintaining code quality and system stability.
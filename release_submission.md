# Release 2 Submission Metadata

- **Release Identifier**: Release 2 (R2)
- **Declared Project Option**: Talent Discovery Platform
- **Current Deployment URL**: https://immxrsive-platform.vercel.app
- **Repository URL**: https://github.com/krinapatell/immxrsive-platform
- **Immutable Submission Tag**: `R2-submission`
- **Full Commit SHA**: 7d2f8a19bc34091e85a62f43198e7b912a3456cd
- **Known Issues**: None. All automated test flows and resume parsing fixtures pass.

## Test Setup & Access Accounts
- **Employer Access**: Public access via Talent Directory URL (`https://immxrsive-platform.vercel.app/`).
- **Student Access**: Algoma University student authentication domain restricted to `@algomau.ca`.
- **Resume Upload Fixtures Verified**:
  - `resume_clean_single_column.pdf`
  - `resume_layout_stress.pdf`
  - `resume_minimal.pdf`
  - `resume_untrusted_text.pdf` (Prompt injection sanitized)

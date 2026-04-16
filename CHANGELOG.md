# Changelog

All notable changes to Flamingo Pay are documented here.
Format is loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.2.2] — 2026-04-16

### Fixed
- Transaction sheet was hidden behind the merchant tab bar (both at `z-50`). Bumped sheet overlay to `z-[60]` so it sits above the tab bar when open.

## [v1.2.1] — 2026-04-16

### Fixed
- Backdrop overlay behind the transaction sheet no longer swallows scroll gestures intended for the sheet (`touch-none` + `preventDefault`; sheet keeps `touch-auto`).
- Sheet bottom padding now respects `safe-area-inset-bottom` so buttons aren't hidden behind the iOS home indicator.

## [v1.2.0] — 2026-04-16

### Added
- **Viral humor screens** across the buyer checkout flow on `/pay/[merchantId]` — payment moments as brand moments.
- Pending transaction indicator on the transactions list.

### Changed
- Responsive polish: enlarged touch targets, adjusted font scaling for smaller screens, tightened button sizing on TabBar and TopBar.

### Fixed
- Sheet scroll behaviour no longer clips content.

## [v1.1.2] — 2026-04-16

### Changed
- Transaction detail sheet restructured: amount, status badge, and refund button now appear at the top of the sheet; details (reference, rail, bank, time) moved below the action area.

## [v1.1.1] — 2026-04-16

### Fixed
- Tightened transaction detail sheet (padding, font size, row spacing) so the refund button is visible without scrolling on smaller screens.

## [v1.1.0] — 2026-04-16

### Added
- Full and partial **refund flow** with structured reason capture.
- Ozow refund timeline visible to merchants and admins.
- **CSV export** on the transactions page.
- **Open Graph image** for rich link previews on social and chat apps.

### Fixed
- Repaired broken internal links across landing, merchant, and admin surfaces.

## [v1.0.0] — 2026-04-15

Initial release.

### Added
- **Landing page** with 3D hero (Three.js), motion animations (Framer Motion), and confetti effects.
- **Universal payment page** (`/pay/[merchantId]`) — PayShap, Instant EFT (Ozow), and manual bank transfer.
- **Merchant mobile app** — login, 4-step signup, application pending screen, dashboard, transactions, QR display, payouts, profile.
- **Admin operations console** — overview dashboard, merchant directory (search + filter), per-merchant approve/reject/suspend actions.
- **11-language i18n** — all SA official languages, persisted via localStorage.
- **Next.js API routes** — merchant CRUD (`GET`/`POST` list, `GET` single, `PATCH` status).
- **Branded 404 page**, loading states for merchant and admin sections, favicon.
- Vercel auto-deploy on merge to `main`; feature-branch workflow enforced in `AGENTS.md`.

[v1.2.2]: https://github.com/msizibrocabs/flamingopay/releases/tag/v1.2.2
[v1.2.1]: https://github.com/msizibrocabs/flamingopay/releases/tag/v1.2.1
[v1.2.0]: https://github.com/msizibrocabs/flamingopay/releases/tag/v1.2.0
[v1.1.2]: https://github.com/msizibrocabs/flamingopay/releases/tag/v1.1.2
[v1.1.1]: https://github.com/msizibrocabs/flamingopay/releases/tag/v1.1.1
[v1.1.0]: https://github.com/msizibrocabs/flamingopay/releases/tag/v1.1.0
[v1.0.0]: https://github.com/msizibrocabs/flamingopay/releases/tag/v1.0.0

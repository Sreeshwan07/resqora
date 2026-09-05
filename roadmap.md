# RESQORA — Production Readiness Roadmap

Resumed from the mobile-first audit (Phases 1-37 done).

## Completed in this pass
- [x] A. SOS server-side idempotency — atomic `start_emergency_session` RPC + partial unique index preventing duplicate live sessions
- [x] C. DB indexing — added hot-path indexes for `guardian_sessions(emergency_id)`, `share_links(emergency_id, kind)` live links, `accident_media(incident_id, created_at)`
- [x] D. GPS power modes — visibility-gated 10s emergency heartbeat; tracker skips writes while backgrounded
- [x] E. Media compression — browser-side photo downscaling (1600px long edge, JPEG 0.82) before upload/analysis
- [x] F. Notification delivery-status semantics — verified honest labels ("ready" for WhatsApp, "delivered" per email recipient, etc.)

## Remaining (not started)
- [ ] B. Realtime subscription audit — verify only one Supabase realtime channel per client, cleanup on unmount
- [ ] G. Final QA matrix — targeted browser verification of SOS/Guardian/report flows
- [ ] H. Performance targets — bundle/runtime profiling
- [ ] I. Full security scan pass
- [ ] J. Accessibility audit (focus traps, ARIA, color contrast)
- [ ] K. Network resilience — offline queue retry/backoff review
- [ ] L. Legacy cleanup — remove any remaining AEGIS references

Each phase is verified before moving to the next.
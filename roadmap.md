# RESQORA — Production Readiness Roadmap

Resumed from the mobile-first audit (Phases 1-37 done). Remaining workstreams:

- [ ] A. SOS server-side idempotency — prevent duplicate emergency sessions on retries/race conditions
- [ ] B. Realtime subscription audit — one channel per client, cleanup on unmount, no duplicate pings
- [ ] C. DB indexing — index hot query paths (emergencies, location_pings, notifications, pushes)
- [ ] D. GPS power modes — adaptive accuracy/interval based on emergency state and screen visibility
- [ ] E. Media compression — downscale/compress accident photo/video before upload
- [ ] F. Notification delivery-status semantics — track delivery states without misleading "sent" claims
- [ ] G. Final QA matrix — targeted browser verification of the changed paths

Each phase is verified before moving to the next.
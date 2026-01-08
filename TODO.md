# TODO List for User Address Modifications

- [x] Update `src/models/userAddress.model.js`: Change `addressType` to ENUM with values ['present', 'permanent', 'both']
- [ ] Update `src/modules/profile/profile.service.js`: Modify `updateProfile` to handle `payload.address` as object with `present` and `permanent` sub-objects, create/update addresses accordingly
- [ ] Update `src/modules/profile/profile.controller.js`: In `getProfileCompletion`, find all addresses for the user and check if any exist

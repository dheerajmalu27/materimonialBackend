# TODO: Enhance Potential Matches API with Additional Data

## Backend Changes
- [x] Modify `match.service.js` to include additional table joins (user_addresses, user_family, user_lifestyle, profile_views, interests, shortlists)
- [x] Add distance calculation logic
- [x] Fetch mutual interests between users
- [x] Get profile view count for each candidate
- [x] Include online status and last active timestamp
- [x] Calculate profile completion percentage
- [x] Add family details summary (familyType, motherTongue)
- [x] Update response structure to include all new fields

## Frontend Changes
- [x] Update `ProfileCard.tsx` to display new data (distance, mutual interests, profile views, online status, etc.)
- [x] Update `SearchFilter.tsx` to handle new filtering options if needed
- [x] Test API response with new data
- [x] Verify frontend displays new fields correctly

## Testing
- [ ] Test API endpoint returns correct additional data
- [ ] Test frontend integration
- [ ] Verify data accuracy and performance

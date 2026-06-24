# Spec: Feed Author Filtering and Motillo News Repurposing

This design documents the changes required to filter Litium and Motillo feeds on the backend by author name, and to repurpose the Agency Social Wall component as a "Motillo News" panel.

## Goals

1. Filter "Litium News" (`SeoRssAggregator.tsx`) to show only feed items whose author contains "litium".
2. Repurpose "Agency Social Wall" (`AgencySocialWall.tsx`) as "Motillo News" showing feed items whose author contains "motillo".
3. Support free-form author name filtering in the backend via the `GetFeedsRequest` DTO and `FeedService`.
4. Style "Motillo News" to support images, but omit social platform badges (LinkedIn/Instagram) and likes/comments/reposts metrics/icons.

## Backend Changes

### DTO: `GetFeedsRequest.cs`
Add a new query parameter property:
```csharp
public string? AuthorName { get; init; }
```

### Validator: `GetFeedsRequestValidator.cs`
Add validation rule:
```csharp
RuleFor(x => x.AuthorName)
    .MaximumLength(255).WithMessage("Author name must not exceed 255 characters.");
```

### Service: `FeedService.cs`
Filter feed items based on `request.AuthorName` case-insensitively using `.ToLower()`.
```csharp
if (!string.IsNullOrWhiteSpace(request.AuthorName))
{
    var authorLower = request.AuthorName.ToLower();
    query = query.Where(fi => fi.Author != null && fi.Author.ToLower().Contains(authorLower));
}
```

## Frontend Changes

### `SeoRssAggregator.tsx` (Litium News)
Update the query parameters to include `AuthorName: 'litium'`:
```typescript
const { data: response, isLoading } = useGetApiIntranetFeeds({ PageSize: 10, AuthorName: 'litium' });
```

### `MotilloNews.tsx` (Repurposed from `AgencySocialWall.tsx`)
1. Rename file `apps/web/src/components/Intranet/AgencySocialWall.tsx` to `apps/web/src/components/Intranet/MotilloNews.tsx`.
2. Rename component `AgencySocialWall` to `MotilloNews`.
3. Fetch data dynamically:
   ```typescript
   const { data: response, isLoading } = useGetApiIntranetFeeds({ PageSize: 10, AuthorName: 'motillo' });
   const feedItems = response?.data || [];
   ```
4. Update UI details:
   - Change panel title from `"Agency Social Wall"` to `"Motillo News"`.
   - Remove the `actions` button (`+ Share Update`).
   - Remove the platform badge/icons (like `in` or `ig` badges) in both the sidebar list and detail view.
   - Render the publish date in standard format (`new Date(item.publishDate).toLocaleDateString()`).
   - Render `selectedPost.imageUrl` if present. If not, hide the image container.
   - Remove likes, comments, and reposts counters and icons from the bottom.

### `Intranet.tsx`
Update import and rendering:
- Import `MotilloNews` from `../components/Intranet/MotilloNews`.
- Replace `<AgencySocialWall />` with `<MotilloNews />`.

## Verification Plan

### Automated Tests
1. Run server tests to verify feed filtering:
   - Add a unit test to `FeedServiceTests.cs` to test querying feed items by `AuthorName` (matching and non-matching authors).
   - Add a unit test to `GetFeedsRequestValidatorTests.cs` to verify `AuthorName` length validation rules.
2. Build the API and regenerate TS endpoints to verify compilation.
3. Build the web app (`npm run build` or similar) to ensure all typescript types and imports are correct.

### Manual Verification
1. Access the Intranet dashboard and verify:
   - "Litium News" is populated with Litium-related posts.
   - "Motillo News" displays Motillo-related posts in the sidebar and detailed view, with images visible and no social badges, share button, or likes/comments/reposts.

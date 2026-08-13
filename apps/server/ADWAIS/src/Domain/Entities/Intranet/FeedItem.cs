// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

namespace Adwais.Domain.Entities.Intranet;

public class FeedItem
{
    public Guid Id { get; set; }
    public Guid? FeedSourceId { get; set; }
    public FeedSource? FeedSource { get; set; }
    public required string Title { get; set; }
    public string? Content { get; set; }
    public required string Link { get; set; }
    public DateTime PublishDate { get; set; }
    public string? Author { get; set; }
    public string? ImageUrl { get; set; }
}

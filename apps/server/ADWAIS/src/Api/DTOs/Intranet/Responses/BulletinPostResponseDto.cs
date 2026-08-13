// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

namespace Adwais.Api.DTOs.Intranet;

public record BulletinPostResponseDto(
    Guid Id,
    string Title,
    string Body,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    BulletinPostAuthorDto? Author
);

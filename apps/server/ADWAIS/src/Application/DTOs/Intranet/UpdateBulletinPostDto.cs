// Part of the ADWAIS project, licensed under the MIT License.
// Copyright (c) 2026 Marmenlind.
// See /LICENSE for license information.
// SPDX-License-Identifier: MIT

namespace Adwais.Application.DTOs.Intranet;

public record UpdateBulletinPostDto
{
    public string? Title { get; set; }
    public string? Body { get; set; }
}

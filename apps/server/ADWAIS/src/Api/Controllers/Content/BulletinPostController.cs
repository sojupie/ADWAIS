// Part of the ADWAIS project, licensed under the MIT License.
// Copyright (c) 2026 Marmenlind.
// See /LICENSE for license information.
// SPDX-License-Identifier: MIT

using System.Security.Claims;
using Adwais.Api.DTOs.Intranet;
using Adwais.Application.DTOs.Intranet;
using Adwais.Application.Interfaces;
using Adwais.Domain.Entities.Intranet;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Adwais.Api.Controllers.Content;

[ApiController]
[Route("api/intranet/bulletin-posts")]
[Authorize(Policy = "KioskOrStaffAccess")]
public class BulletinPostController(IBulletinPostService postService) : ControllerBase
{
    private readonly IBulletinPostService _postService = postService;

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<BulletinPostResponseDto>> GetPost(Guid id, CancellationToken ct)
    {
        var post = await _postService.GetPostByIdAsync(id, ct);
        if (post == null) return NotFound();
        return Ok(ToResponse(post));
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<BulletinPostResponseDto>>> GetPosts(CancellationToken ct)
    {
        var posts = await _postService.GetPostsAsync(ct);
        return Ok(posts.Select(ToResponse).ToList());
    }

    [HttpPost]
    [Authorize(Policy = "StaffAccess")]
    public async Task<ActionResult<BulletinPostResponseDto>> CreatePost([FromBody] CreateBulletinPostDto dto, CancellationToken ct)
    {
        var nameIdentifier = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(nameIdentifier) || !Guid.TryParse(nameIdentifier, out var userId))
        {
            return Unauthorized("User context is invalid.");
        }

        var post = await _postService.CreatePostAsync(userId, dto.Title, dto.Body, ct);

        return CreatedAtAction(nameof(GetPost), new { id = post.Id }, ToResponse(post));
    }

    [HttpPatch("{id:guid}")]
    [Authorize(Policy = "StaffAccess")]
    public async Task<ActionResult<BulletinPostResponseDto>> UpdatePost(
        Guid id,
        [FromBody] UpdateBulletinPostDto dto,
        CancellationToken ct)
    {
        var post = await _postService.GetPostByIdAsync(id, ct);
        if (post == null) return NotFound();

        var nameIdentifier = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var isAdmin = User.IsInRole("Admin");
        var isAuthor = Guid.TryParse(nameIdentifier, out var userId) && post.UserId == userId;
        if (!isAdmin && !isAuthor) return Forbid();

        var updated = await _postService.UpdatePostAsync(id, dto.Title, dto.Body, ct);
        return updated == null ? NotFound() : Ok(ToResponse(updated));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "StaffAccess")]
    public async Task<IActionResult> DeletePost(Guid id, CancellationToken ct)
    {
        var post = await _postService.GetPostByIdAsync(id, ct);
        if (post == null) return NotFound();

        var nameIdentifier = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var isAdmin = User.IsInRole("Admin");
        var isAuthor = Guid.TryParse(nameIdentifier, out var userId) && post.UserId == userId;
        if (!isAdmin && !isAuthor) return Forbid();

        var deleted = await _postService.DeletePostAsync(id, ct);
        return deleted ? NoContent() : NotFound();
    }

    private static BulletinPostResponseDto ToResponse(BulletinPost post)
    {
        return new BulletinPostResponseDto(
            post.Id,
            post.Title,
            post.Body,
            post.CreatedAt,
            post.UpdatedAt,
            post.User == null ? null : new BulletinPostAuthorDto(post.User.Id, post.User.Name));
    }
}

using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Api.DTOs.Intranet;
using Adwais.Application.DTOs.Intranet;
using Adwais.Application.Interfaces;
using Adwais.Domain.Entities.Intranet;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Adwais.Api.Controllers;

[ApiController]
[Route("api/intranet/posts")]
[Authorize(Policy = "KioskOrStaffAccess")]
public class CommunityPostController(ICommunityPostService postService) : ControllerBase
{
    private readonly ICommunityPostService _postService = postService;

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CommunityPostResponseDto>> GetPost(Guid id, CancellationToken ct)
    {
        var post = await _postService.GetPostByIdAsync(id, ct);
        if (post == null) return NotFound();
        return Ok(ToResponse(post));
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CommunityPostResponseDto>>> GetPosts(CancellationToken ct)
    {
        var posts = await _postService.GetPostsAsync(ct);
        return Ok(posts.Select(ToResponse).ToList());
    }

    [HttpPost]
    [Authorize(Policy = "StaffAccess")]
    public async Task<ActionResult<CommunityPostResponseDto>> CreatePost([FromBody] CreatePostDto dto, CancellationToken ct)
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
    public async Task<ActionResult<CommunityPostResponseDto>> UpdatePost(
        Guid id,
        [FromBody] UpdatePostDto dto,
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

    private static CommunityPostResponseDto ToResponse(CommunityPost post)
    {
        return new CommunityPostResponseDto(
            post.Id,
            post.Title,
            post.Body,
            post.CreatedAt,
            post.UpdatedAt,
            post.User == null ? null : new CommunityPostAuthorDto(post.User.Id, post.User.Name));
    }
}

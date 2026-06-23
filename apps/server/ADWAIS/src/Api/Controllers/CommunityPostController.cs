using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Application.DTOs.Intranet;
using Adwais.Application.Interfaces;
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
    public async Task<IActionResult> GetPost(Guid id, CancellationToken ct)
    {
        var post = await _postService.GetPostByIdAsync(id, ct);
        if (post == null) return NotFound();
        return Ok(post);
    }

    [HttpPost]
    public async Task<IActionResult> CreatePost([FromBody] CreatePostDto dto, CancellationToken ct)
    {
        var nameIdentifier = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(nameIdentifier) || !Guid.TryParse(nameIdentifier, out var userId))
        {
            return Unauthorized("User context is invalid.");
        }

        var post = await _postService.CreatePostAsync(userId, dto.Title, dto.Body, ct);

        return CreatedAtAction(nameof(GetPost), new { id = post.Id }, post);
    }
}

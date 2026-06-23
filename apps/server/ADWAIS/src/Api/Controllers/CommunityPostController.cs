using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Application.DTOs.Intranet;
using Adwais.Application.Interfaces;
using Adwais.Domain.Entities.Intranet;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Adwais.Api.Controllers;

[ApiController]
[Route("api/intranet/posts")]
[Authorize(Policy = "KioskOrStaffAccess")]
public class CommunityPostController(ICommunityPostService postService, IUserService userService) : ControllerBase
{
    private readonly ICommunityPostService _postService = postService;
    private readonly IUserService _userService = userService;

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
        var oidClaim = User.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value 
                       ?? User.FindFirst("oid")?.Value;

        if (string.IsNullOrEmpty(oidClaim) || !Guid.TryParse(oidClaim, out var entraOid))
        {
            return Unauthorized("User context is invalid.");
        }

        var user = await _userService.GetUserByEntraObjectIdAsync(entraOid, ct);
        if (user == null)
        {
            return Unauthorized("User is not registered.");
        }

        var post = await _postService.CreatePostAsync(user.Id, dto.Title, dto.Body, ct);

        return CreatedAtAction(nameof(GetPost), new { id = post.Id }, post);
    }
}

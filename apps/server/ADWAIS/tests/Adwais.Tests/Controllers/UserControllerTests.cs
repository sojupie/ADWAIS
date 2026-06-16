using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;
using Adwais.Api.Controllers;
using Adwais.Api.DTOs.Users;
using Adwais.Application.Interfaces;
using Adwais.Domain.Entities;
using Adwais.Domain.Enums;

namespace Adwais.Tests.Controllers;

public class UserControllerTests
{
    private readonly Mock<IUserService> _userServiceMock;
    private readonly UserController _controller;

    public UserControllerTests()
    {
        _userServiceMock = new Mock<IUserService>();
        _controller = new UserController(_userServiceMock.Object);
    }

    [Fact]
    public async Task GetUsers_ShouldReturnOkWithUsersList()
    {
        // Arrange
        var users = new List<User>
        {
            new User { Id = Guid.NewGuid(), Name = "Alice", Role = UserRole.Admin },
            new User { Id = Guid.NewGuid(), Name = "Bob", Role = UserRole.Employee }
        };

        _userServiceMock.Setup(s => s.GetUsersAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(users);

        // Act
        var result = await _controller.GetUsers(CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedUsers = Assert.IsAssignableFrom<IEnumerable<UserResponseDto>>(okResult.Value);
        Assert.Equal(2, returnedUsers.Count());
        _userServiceMock.Verify(s => s.GetUsersAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetUser_ShouldReturnOkWithUser_WhenUserExists()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, Name = "Alice", Role = UserRole.Admin };

        _userServiceMock.Setup(s => s.GetUserByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        // Act
        var result = await _controller.GetUser(userId, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedUser = Assert.IsType<UserResponseDto>(okResult.Value);
        Assert.Equal(userId, returnedUser.Id);
        Assert.Equal("Alice", returnedUser.Name);
        _userServiceMock.Verify(s => s.GetUserByIdAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetUser_ShouldReturnNotFound_WhenUserDoesNotExist()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _userServiceMock.Setup(s => s.GetUserByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _controller.GetUser(userId, CancellationToken.None);

        // Assert
        Assert.IsType<NotFoundResult>(result.Result);
        _userServiceMock.Verify(s => s.GetUserByIdAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateUser_ShouldReturnCreatedWithUser()
    {
        // Arrange
        var request = new CreateUserRequestDto("New User", UserRole.Employee);
        var createdUser = new User { Id = Guid.NewGuid(), Name = "New User", Role = UserRole.Employee };

        _userServiceMock.Setup(s => s.CreateUserAsync(request.Name, request.Role, It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdUser);

        // Act
        var result = await _controller.CreateUser(request, CancellationToken.None);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var returnedUser = Assert.IsType<UserResponseDto>(createdResult.Value);
        Assert.Equal("New User", returnedUser.Name);
        Assert.Equal(UserRole.Employee, returnedUser.Role);
        _userServiceMock.Verify(s => s.CreateUserAsync(request.Name, request.Role, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateUser_ShouldReturnOkWithUpdatedUser_WhenUserExists()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var request = new UpdateUserRequestDto("Updated User", UserRole.Admin);
        var updatedUser = new User { Id = userId, Name = "Updated User", Role = UserRole.Admin };

        _userServiceMock.Setup(s => s.UpdateUserAsync(userId, request.Name, request.Role, It.IsAny<CancellationToken>()))
            .ReturnsAsync(updatedUser);

        // Act
        var result = await _controller.UpdateUser(userId, request, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedUser = Assert.IsType<UserResponseDto>(okResult.Value);
        Assert.Equal("Updated User", returnedUser.Name);
        Assert.Equal(UserRole.Admin, returnedUser.Role);
        _userServiceMock.Verify(s => s.UpdateUserAsync(userId, request.Name, request.Role, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateUser_ShouldReturnNotFound_WhenUserDoesNotExist()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var request = new UpdateUserRequestDto("Updated User", UserRole.Admin);
        _userServiceMock.Setup(s => s.UpdateUserAsync(userId, request.Name, request.Role, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _controller.UpdateUser(userId, request, CancellationToken.None);

        // Assert
        Assert.IsType<NotFoundResult>(result.Result);
        _userServiceMock.Verify(s => s.UpdateUserAsync(userId, request.Name, request.Role, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteUser_ShouldReturnNoContent_WhenUserExists()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _userServiceMock.Setup(s => s.DeleteUserAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.DeleteUser(userId, CancellationToken.None);

        // Assert
        Assert.IsType<NoContentResult>(result);
        _userServiceMock.Verify(s => s.DeleteUserAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteUser_ShouldReturnNotFound_WhenUserDoesNotExist()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _userServiceMock.Setup(s => s.DeleteUserAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.DeleteUser(userId, CancellationToken.None);

        // Assert
        Assert.IsType<NotFoundResult>(result);
        _userServiceMock.Verify(s => s.DeleteUserAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
    }
}

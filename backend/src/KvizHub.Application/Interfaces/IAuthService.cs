using KvizHub.Application.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace KvizHub.Application.Interfaces;

public interface IAuthService
{
    Task<IActionResult> LoginAsync(LoginRequestDto request);
    Task<IActionResult> RegisterAsync(RegisterRequestDto request);
    Task<IActionResult> RefreshTokenAsync(RefreshTokenRequestDto request);
    Task<IActionResult> UpdateProfileAsync(string userId, UpdateProfileRequestDto request);
    Task<IActionResult> ChangePasswordAsync(string userId, ChangePasswordRequestDto request);
    Task<IActionResult> LogoutAsync(string userId);
    Task<IActionResult> GetCurrentUserAsync(string userId);
}